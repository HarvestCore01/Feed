// =============================================================
// === SERVER.JS — Feed Pulse WebSocket + Firestore Persistance ===
// =============================================================

import { WebSocketServer } from "ws";
import admin from "firebase-admin";
import { readFileSync } from "fs";
import { getDatabase } from "firebase-admin/database";

// =============================================================
// === Initialisation Firebase Admin ===
try {
  const serviceAccount = JSON.parse(
    readFileSync(new URL("./serviceAccountKey.json", import.meta.url))
  );

  if (!admin.apps.length) {
    admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://feedcore-64023-default-rtdb.europe-west1.firebasedatabase.app"
});

    console.log("🔥 Firebase Admin initialisé avec Realtime Database");
  }
} catch (err) {
  console.error("❌ Erreur initialisation Firebase Admin :", err);
}

const db = admin.firestore();

// =============================================================
// === Serveur WebSocket
// =============================================================
const wss = new WebSocketServer({ port: 8080 });
console.log("🚀 Feed Pulse WebSocket en ligne sur port 8080");

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
  });

  socket.on("close", () => console.log("❌ Client déconnecté"));
});

// =============================================================
// 🧠 FEED FACTORY - PLANIFICATEUR AUTOMATIQUE
// =============================================================
// Crée ou met à jour le prochain Feed dans Firebase
async function scheduleNextFeed() {
  try {
    const db = getDatabase();

    // Durée de vie d’un cycle Feed (ex: 24h)
    const duration = 5 * 60 * 1000; // 24h en millisecondes

    // Timestamp de départ (vrai nombre, pas une expression)
    const startsAt = Date.now() + duration;

    // Nom unique du feed
    const name = `FEED_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const nextFeed = {
      name,
      startsAt, // ✅ vrai timestamp numérique
      duration
    };

    await db.ref("nextFeed").set(nextFeed);
    console.log(`✅ Nouveau cycle Feed créé :`, nextFeed);
  } catch (err) {
    console.error("❌ Erreur lors de la planification du prochain Feed :", err);
  }
}

// =============================================================
// 🔁 CRON : relance la création d’un nouveau Feed toutes les 24h
// =============================================================

// Lance un premier Feed au démarrage du serveur
scheduleNextFeed();

// Puis recrée un nouveau cycle toutes les 24h
setInterval(scheduleNextFeed, 24 * 60 * 60 * 1000);
