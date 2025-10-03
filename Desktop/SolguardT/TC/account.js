// account.js
import { auth, db } from "./firebase-init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

import { sendEmailVerification } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";


// =============================================================
// 1. Création d'un compte utilisateur (Firebase Auth + Firestore)
// =============================================================
export async function signUp(email, password, username) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;

  await setDoc(doc(db, "users", uid), {
    username,
    feed: 0,
    level: 0,
    rank: "Débutant",
    points: 0,
    lastLogin: new Date().toISOString(),
    createdAt: serverTimestamp()
  });

  return userCred.user;
}

// =============================================================
// 2. Connexion utilisateur
// =============================================================
export async function signIn(email, password) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);

  await updateDoc(doc(db, "users", userCred.user.uid), {
    lastLogin: new Date().toISOString()
  });

  return userCred.user;
}

// =============================================================
// 3. Déconnexion utilisateur
// =============================================================
export async function signOutUser() {
  await signOut(auth);
}

// =============================================================
// 4. Mise à jour de l'affichage utilisateur dans l'UI
// =============================================================
export async function updateUserInfo(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      console.warn("⚠️ Aucun utilisateur trouvé pour uid :", uid);
      return;
    }

    const user = snap.data();

    // Sécurité : vérifier que les éléments existent
    const pseudoEl = document.getElementById("userPseudo");
    const levelEl = document.getElementById("userLevel");
    const feedEl = document.getElementById("userFeed");
    const rankEl = document.getElementById("userRank");
    const nextDiffEl = document.getElementById("userNextDiff");
    const infoBlock = document.getElementById("userInfo");

    if (!pseudoEl || !levelEl || !feedEl || !rankEl || !nextDiffEl || !infoBlock) {
      console.warn("⚠️ updateUserInfo : éléments DOM manquants sur cette page.");
      return;
    }

    // Mise à jour des infos utilisateur
    pseudoEl.textContent = user.username;
    levelEl.textContent = user.level ?? 0;
    feedEl.textContent = user.feed?.toFixed(2) ?? "0.00";
    rankEl.textContent = user.rank || "Non classé";

    // TODO : calcul du nextDiff si tu veux l’intégrer plus tard
    nextDiffEl.textContent = "0.00";

    // Affiche le bloc utilisateur
    infoBlock.style.display = "block";

  } catch (err) {
    console.error("❌ Erreur updateUserInfo :", err);
  }
}

// =============================================================
// 5. Compatibilité avec l'ancien main.js (createAccount utilisé)
// =============================================================
// Cette fonction gère les deux cas :
// - Soit main.js appelle createAccount(email, password, username)
export async function createAccount(email, password, username) {
  try {
    if (!email || !password || !username) {
      alert("⚠️ Email, mot de passe et pseudo requis.");
      return null;
    }

    const userCred = await signUp(email, password, username);
    const user = userCred;

    // Envoi de l’email de vérification
    await sendEmailVerification(user);
    alert("📩 Email de vérification envoyé. Veuillez confirmer avant de vous connecter.");

    return user;
  } catch (err) {
    console.error("❌ Erreur createAccount :", err);
    alert("❌ Impossible de créer le compte.");
    throw err;
  }
}

