// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// 🔹 Configuration de ton projet Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCDKeMtXSp34ewRCZlNCKjFotPVGIINHQw",
  authDomain: "feedcore-64023.firebaseapp.com",
  projectId: "feedcore-64023",
  storageBucket: "feedcore-64023.appspot.com", // ⚠️ ton URL avait une erreur (".app" en trop)
  messagingSenderId: "868675248253",
  appId: "1:868675248253:web:e395abb45fac24d0a71114",
  measurementId: "G-XLBSRMK02N"
};

// 🔹 Initialisation Firebase
const app = initializeApp(firebaseConfig);

// 🔹 Exporte les services pour les autres fichiers
export const auth = getAuth(app);
export const db = getFirestore(app);

// 🔹 Test Firebase (optionnel, juste pour vérifier que ça marche)
async function testFirebase() {
  console.log("✅ Firebase initialisé !");

  try {
    const testRef = doc(db, "test", "ping");
    await setDoc(testRef, { message: "hello core feed", date: new Date().toISOString() });

    const snap = await getDoc(testRef);
    if (snap.exists()) {
      console.log("🔥 Firestore fonctionne, document lu :", snap.data());
    } else {
      console.error("⚠️ Firestore ne renvoie rien !");
    }
  } catch (err) {
    console.error("❌ Erreur Firestore :", err);
  }
}

testFirebase();
