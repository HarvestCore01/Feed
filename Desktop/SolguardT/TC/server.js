// === FeedCore Chat Server ===
// WebSocket + Firestore batch backup

import express from "express";
import { WebSocketServer } from "ws";
import admin from "firebase-admin";
import { cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import fs from "fs";

// Charge ta clé Firebase Admin SDK
const serviceAccount = JSON.parse(fs.readFileSync("./serviceAccountKey.json", "utf8"));
admin.initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const app = express();
const PORT = process.env.PORT || 8080;

const wss = new WebSocketServer({ noServer: true });

// === Memory buffer ===
let messageBuffer = [];
const BATCH_INTERVAL = 10000; // 10 secondes

async function flushMessages() {
  if (messageBuffer.length === 0) return;

  const batch = db.batch();
  const bucketId = new Date().toISOString().slice(0, 16).replace(":", "-");
  const bucketRef = db.collection("chatBuckets").doc(bucketId);

  batch.set(bucketRef, {
    messages: messageBuffer.map(m => ({
      user: m.user,
      text: m.text,
      ts: Timestamp.fromDate(new Date(m.ts)),
    })),
  }, { merge: true });

  await batch.commit();
  console.log(`🟢 ${messageBuffer.length} messages sauvegardés`);
  messageBuffer = [];
}

setInterval(flushMessages, BATCH_INTERVAL);

// === WebSocket Logic ===
wss.on("connection", (ws) => {
  console.log("🟣 Nouvel utilisateur connecté.");

  ws.on("message", (raw) => {
    try {
      const data = JSON.parse(raw);

      if (data.type === "new_message") {
        const msg = {
          user: data.user || "Anon",
          text: data.text.substring(0, 250),
          ts: Date.now(),
        };

        messageBuffer.push(msg);

        // Broadcast à tous les connectés
        wss.clients.forEach(client => {
          if (client.readyState === client.OPEN) {
            client.send(JSON.stringify({ type: "message", data: msg }));
          }
        });
      }
    } catch (e) {
      console.error("Erreur message :", e);
    }
  });

  ws.on("close", () => console.log("🔴 Utilisateur déconnecté."));
});

// === Upgrade HTTP → WebSocket ===
const server = app.listen(PORT, () => console.log(`🚀 FeedCore Chat Server lancé sur ${PORT}`));
server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});
