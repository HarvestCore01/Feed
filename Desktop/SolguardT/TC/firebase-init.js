// ===============================
// 🔥 FIREBASE INIT — CORE FEED
// Version corrigée et stable (ESM compatible)
// ===============================

// Import des modules Firebase v9 (modular)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// ===============================
// 🔹 Configuration du projet Firebase
// ===============================
const firebaseConfig = {
  apiKey: "AIzaSyCDKeMtXSp34ewRCZlNCKjFotPVGIINHQw",
  authDomain: "feedcore-64023.firebaseapp.com",
  databaseURL:
    "https://feedcore-64023-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "feedcore-64023",
  storageBucket: "feedcore-64023.appspot.com",
  messagingSenderId: "868675248253",
  appId: "1:868675248253:web:e395abb45fac24d0a71114",
  measurementId: "G-XLBSRMK02N"
};

// ===============================
// 🚀 Initialisation Firebase
// ===============================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ===============================
// 🌐 Exportation centralisée
// ===============================
// Ces exports permettront à tous tes modules (account.js, leaderboard.js, etc.)
// d’utiliser les mêmes instances Firebase sans erreur “firebase is not defined”.
export { app, auth, db, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, doc, setDoc, getDoc };

// ===============================
// 🧪 Test optionnel (désactivable en prod)
// ===============================
async function testFirebase() {
  console.log("✅ Firebase initialisé et connecté au projet FeedCore.");

  try {
    const testRef = doc(db, "test", "ping");
    await setDoc(testRef, {
      message: "hello core feed",
      date: new Date().toISOString()
    });

    const snap = await getDoc(testRef);
    if (snap.exists()) {
      console.log("🔥 Firestore fonctionne :", snap.data());
    } else {
      console.warn("⚠️ Firestore ne renvoie rien !");
    }
  } catch (err) {
    console.error("❌ Erreur Firestore :", err);
  }
}

// Désactiver ce test en production
// testFirebase();
