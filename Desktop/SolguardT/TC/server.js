// =============================================================
// === SERVER.JS — Feed Pulse WebSocket + Firestore Persistance ===
// =============================================================

import 'dotenv/config';
import { WebSocketServer } from "ws";
import admin from "firebase-admin";
import { getDatabase } from "firebase-admin/database";

// =============================================================
// === Initialisation Firebase Admin via Variables d’Environnement ===
// =============================================================
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
      }),
      databaseURL: process.env.FIREBASE_DB_URL,
    });

    console.log("🔥 Firebase Admin initialisé avec Realtime Database (env vars)");
  }
} catch (err) {
  console.error("❌ Erreur initialisation Firebase Admin :", err);
}

const db = admin.firestore();

// =============================================================
// === Serveur WebSocket
// =============================================================
const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });
console.log(`🚀 Feed Pulse WebSocket en ligne sur port ${PORT}`);

// =============================================================
// === Fonctions utilitaires
// =============================================================
function broadcast(data) {
  const message = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(message);
  });
}

// =============================================================
// === Persistance Firestore
// =============================================================
const FEED_COLLECTION = "feedMessages";
const MAX_MESSAGES = 30;

// Sauvegarde d’un message
async function saveMessage(user, text) {
  const payload = {
    user,
    text,
    timestamp: admin.firestore.Timestamp.now(),
  };

  try {
    await db.collection(FEED_COLLECTION).add(payload);
    console.log(`💾 Message sauvegardé pour ${user}`);

    // Nettoyage des anciens messages
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
// =============================================================
wss.on("connection", async (socket) => {
  console.log("✅ Client connecté au Feed Pulse");

  // Envoie les derniers messages à la connexion
  const recent = await getRecentMessages();
  socket.send(JSON.stringify({ type: "init_messages", data: recent }));

  socket.on("message", async (message) => {
    try {
      const payload = JSON.parse(message);

      if (payload.type === "typing") {
        broadcast({ type: "user_typing", user: payload.user });
        return;
      }

      if (payload.type === "stop_typing") {
        broadcast({ type: "user_stop_typing", user: payload.user });
        return;
      }

      if (payload.type === "new_message") {
        const { user, text } = payload;
        if (!text?.trim()) return;

        await saveMessage(user, text);
        broadcast({ type: "message", data: { user, text } });
      }
    } catch (err) {
      console.error("❌ Erreur réception message:", err);
    }
  });

  socket.on("close", () => console.log("❌ Client déconnecté"));
});

// =============================================================
// 🧠 FEED FACTORY - PLANIFICATEUR AUTOMATIQUE
// =============================================================
async function scheduleNextFeed() {
  try {
    const db = getDatabase();

    const duration = 5 * 60 * 1000; // 5 minutes (test)
    const startsAt = Date.now() + duration;
    const name = `FEED_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const nextFeed = { name, startsAt, duration };

    await db.ref("nextFeed").set(nextFeed);
    console.log(`✅ Nouveau cycle Feed créé :`, nextFeed);
  } catch (err) {
    console.error("❌ Erreur lors de la planification du prochain Feed :", err);
  }
}

// =============================================================
// 🔁 Relance automatique du Feed toutes les 24h
// =============================================================
scheduleNextFeed();
setInterval(scheduleNextFeed, 24 * 60 * 60 * 1000);
