// =============================================================
// === SERVER.JS — Feed Pulse WebSocket + Firestore Persistance ===
// =============================================================

import { WebSocketServer } from "ws";
import admin from "firebase-admin";
import { readFileSync } from "fs";

// =============================================================
// === Initialisation Firebase Admin ===
try {
  const serviceAccount = JSON.parse(
    readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
  );

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("🔥 Firebase Admin initialisé");
  }
} catch (err) {
  console.error("❌ Erreur initialisation Firebase Admin :", err);
}

const db = admin.firestore();

// =============================================================
// === Serveur WebSocket
const wss = new WebSocketServer({ port: 8080 });
console.log("🚀 Feed Pulse WebSocket en ligne sur port 8080");

// =============================================================
// === Fonctions utilitaires
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
}

// =============================================================
// === Persistance Firestore
const FEED_COLLECTION = "feedMessages";
const MAX_MESSAGES = 30;

// Sauvegarde d’un message (plat)
async function saveMessage(user, text) {
  const payload = {
    user,
    text,
    timestamp: admin.firestore.Timestamp.now(),
  };

  try {
    await db.collection(FEED_COLLECTION).add(payload);
    console.log(`💾 Message sauvegardé pour ${user}`);

    // Supprime les anciens
    const snapshot = await db
      .collection(FEED_COLLECTION)
      .orderBy("timestamp", "desc")
      .get();

    const messages = snapshot.docs;
    if (messages.length > MAX_MESSAGES) {
      const old = messages.slice(MAX_MESSAGES);
      for (const msg of old) {
        await db.collection(FEED_COLLECTION).doc(msg.id).delete();
      }
      console.log(`🧹 ${old.length} anciens messages supprimés`);
    }
  } catch (err) {
    console.error("❌ Erreur Firestore (saveMessage):", err);
  }
}

// Lecture des derniers messages
async function getRecentMessages() {
  try {
    const snapshot = await db
      .collection(FEED_COLLECTION)
      .orderBy("timestamp", "desc")
      .limit(MAX_MESSAGES)
      .get();

    const messages = snapshot.docs.map((doc) => doc.data()).reverse();
    console.log(`📦 ${messages.length} messages chargés depuis Firestore`);
    return messages;
  } catch (err) {
    console.error("❌ Erreur Firestore (getRecentMessages):", err);
    return [];
  }
}

// =============================================================
// === Événements WebSocket
// Réception des nouveaux messages
  ws.on("message", async (message) => {
    try {
      const payload = JSON.parse(message);

      // --- typing ---
      if (payload.type === "typing") {
        broadcast({ type: "user_typing", user: payload.user });
        return;
      }

      if (payload.type === "stop_typing") {
        broadcast({ type: "user_stop_typing", user: payload.user });
        return;
      }

      // --- message standard ---
      if (payload.type === "new_message") {
        const { user, text } = payload;
        if (!text?.trim()) return;

        await saveMessage(user, text);
        broadcast({ type: "message", data: { user, text } });
      }
    } catch (err) {
      console.error("❌ Erreur réception message:", err);
    }
  

  ws.on("close", () => console.log("❌ Client déconnecté"));
});
