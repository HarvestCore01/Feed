// =============================================================
// 🔹 account.js
// Gestion Auth Firebase + Firestore utilisateur
// =============================================================

import { auth, db } from "./firebase-init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
  query, collection, where, getDocs
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";


// =============================================================
// 1️⃣ CRÉATION D’UN COMPTE UTILISATEUR (Auth + Firestore)
// =============================================================
export async function signUp(email, password, username) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;

  // 🔹 Création du document Firestore
  await setDoc(doc(db, "users", uid), {
    email,
    username,
    feed: 0,
    level: 1,
    rank: "Débutant",
    points: 0,
    lastLogin: new Date().toISOString(),
    createdAt: serverTimestamp()
  });

  return userCred.user;
}


// =============================================================
// 2️⃣ RÉCUPÉRATION DES DONNÉES UTILISATEUR
// =============================================================
export async function getUserData(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data();
  } else {
    console.warn("⚠️ Aucun document trouvé pour l’utilisateur :", uid);
    return null;
  }
}


// =============================================================
// 3️⃣ RÉCUPÉRATION D’UN EMAIL VIA LE PSEUDO (pour login par pseudo)
// =============================================================
export async function getEmailByUsername(username) {
  const q = query(collection(db, "users"), where("username", "==", username));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const userDoc = querySnapshot.docs[0];
    return userDoc.data().email;
  }

  return null;
}


// =============================================================
// 4️⃣ CONNEXION UTILISATEUR
// =============================================================
export async function signIn(email, password) {
  const userCred = await signInWithEmailAndPassword(auth, email, password);

  // 🔹 Met à jour la date de dernière connexion
  await updateDoc(doc(db, "users", userCred.user.uid), {
    lastLogin: new Date().toISOString()
  });

  return userCred.user;
}


// =============================================================
// 5️⃣ DÉCONNEXION UTILISATEUR
// =============================================================
export async function signOutUser() {
  await signOut(auth);
  localStorage.removeItem("currentUser");
}


// =============================================================
// 6️⃣ MISE À JOUR DES INFORMATIONS UTILISATEUR DANS L’UI
// =============================================================
export async function updateUserInfo(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      console.warn("⚠️ Aucun document Firestore trouvé pour l’utilisateur :", uid);
      return;
    }

    const user = snap.data();

    // === Vérifie la présence des éléments DOM avant modification ===
    const usernameEls = [
      document.getElementById("userPseudo"),
      document.getElementById("profile-username")
    ].filter(Boolean);

    const feedEls = [
      document.getElementById("userFeed"),
      document.getElementById("profile-feed")
    ].filter(Boolean);

    const levelEls = [
      document.getElementById("userLevel")
    ].filter(Boolean);

    // === Mise à jour du DOM ===
    usernameEls.forEach(el => el.textContent = user.username || "Inconnu");
    feedEls.forEach(el => el.textContent = (user.feed ?? 0).toFixed(2));
    levelEls.forEach(el => el.textContent = user.level ?? 1);

    // === Rank si dispo ===
    const rankEl = document.getElementById("userRank");
    if (rankEl) rankEl.textContent = user.rank || "Non classé";

    // === Bloc info profil ===
    const infoBlock = document.getElementById("userInfo");
    if (infoBlock) infoBlock.style.display = "block";

  } catch (err) {
    console.error("❌ Erreur updateUserInfo :", err);
  }
}


// =============================================================
// 7️⃣ CRÉATION COMPATIBLE AVEC ANCIEN main.js
// =============================================================
export async function createAccount(email, password, username) {
  try {
    if (!email || !password || !username) {
      alert("⚠️ Email, mot de passe et pseudo requis.");
      return null;
    }

    const user = await signUp(email, password, username);

    // 🔹 Envoi email de vérification
    await sendEmailVerification(user);
    alert("📩 Email de vérification envoyé. Veuillez confirmer avant de vous connecter.");

    return user;
  } catch (err) {
    console.error("❌ Erreur createAccount :", err);
    alert("❌ Impossible de créer le compte.");
    throw err;
  }
}
