// === FeedCore Chat Server (Alpha Investor Build) ===
// WebSocket temps réel + Firestore batch backup + miroir feedMessages

import express from "express";
import { WebSocketServer } from "ws";
import admin from "firebase-admin";
import { cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import fs from "fs";

// === Initialisation Firebase Admin SDK ===
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
admin.initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// === Configuration serveur ===
const app = express();
const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ noServer: true });

// === Buffers & paramètres ===
let messageBuffer = [];
let messageHistory = []; // pour mémoire courte en RAM
const MAX_HISTORY = 30;
const BATCH_INTERVAL = 10000; // toutes les 10s

// =====================================================
// === Sauvegarde périodique Firestore (chatBuckets) ===
// =====================================================
async function flushMessages() {
  if (messageBuffer.length === 0) return;

  try {
    const batch = db.batch();
    const bucketId = new Date().toISOString().slice(0, 16).replace(":", "-");
    const bucketRef = db.collection("chatBuckets").doc(bucketId);

    batch.set(
      bucketRef,
      {
        messages: messageBuffer.map((m) => ({
          user: m.user,
          text: m.text,
          ts: Timestamp.fromDate(new Date(m.ts)),
        })),
      },
      { merge: true }
    );

    await batch.commit();
    console.log(`🟢 ${messageBuffer.length} messages sauvegardés dans chatBuckets`);
    messageBuffer = [];
  } catch (e) {
    console.error("❌ Erreur sauvegarde Firestore :", e);
  }
}

setInterval(flushMessages, BATCH_INTERVAL);

// =====================================================
// === Connexions WebSocket (temps réel) ===
// =====================================================
wss.on("connection", (ws) => {
  console.log("🟣 Nouvelle connexion FeedCore");

  // Envoie les 30 derniers messages récents (mémoire vive)
  if (messageHistory.length > 0) {
    ws.send(JSON.stringify({
      type: "history",
      data: messageHistory,
    }));
  }

  ws.on("message", async (raw) => {
    try {
      const data = JSON.parse(raw);
      if (data.type !== "new_message") return;

      const msg = {
        user: data.user?.slice(0, 32) || "Anon",
        text: data.text?.slice(0, 250) || "",
        ts: Date.now(),
      };

      // Stockage RAM
      messageBuffer.push(msg);
      messageHistory.push(msg);
      if (messageHistory.length > MAX_HISTORY) messageHistory.shift();

      // Sauvegarde instantanée dans feedMessages (pour lecture front)
      try {
        await db.collection("feedMessages").add({
          user: msg.user,
          text: msg.text,
          ts: Timestamp.fromDate(new Date(msg.ts)),
        });
      } catch (fireErr) {
        console.error("⚠️ Erreur enregistrement feedMessages :", fireErr);
      }

      // Diffusion à tous les clients connectés
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "message", data: msg }));
        }
      });
    } catch (e) {
      console.error("Erreur message entrant :", e);
    }
  });

  ws.on("close", () => console.log("🔴 Client déconnecté du Core"));
});

// =====================================================
// === API REST : Récupère les derniers messages ===
// =====================================================
app.get("/api/feed/latest", async (req, res) => {
  try {
    const snapshot = await db
      .collection("feedMessages")
      .orderBy("ts", "desc")
      .limit(30)
      .get();

    const messages = snapshot.docs
      .map((doc) => doc.data())
      .reverse(); // ordre chronologique

    res.json({ success: true, messages });
  } catch (e) {
    console.error("❌ Erreur API /api/feed/latest :", e);
    res.status(500).json({ success: false, error: e.message });
  }
});


// =====================================================
// === Upgrade HTTP → WebSocket ===
// =====================================================
const server = app.listen(PORT, () =>
  console.log(`🚀 FeedCore Chat Server lancé sur le port ${PORT}`)
);

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});
