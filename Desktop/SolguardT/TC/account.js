// === account.js ===
import { auth, db } from "./firebase-init.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  collection,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";


// =============================================================
// 1️⃣ — CRÉATION DE COMPTE UTILISATEUR
// =============================================================
export async function signUp(email, password, username) {
  const userCred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = userCred.user.uid;

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

  await sendEmailVerification(userCred.user);
  console.log("✅ Compte créé :", uid);
  return userCred.user;
}


// =============================================================
// 2️⃣ — CONNEXION (EMAIL OU PSEUDO)
// =============================================================
export async function getEmailByUsername(username) {
  const q = query(collection(db, "users"), where("username", "==", username));
  const querySnapshot = await getDocs(q);
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data().email;
  }
  return null;
}

export async function signInWithUsernameOrEmail(login, password) {
  let email = login;

  if (!login.includes("@")) {
    const foundEmail = await getEmailByUsername(login);
    if (!foundEmail) {
      throw new Error("❌ Aucun utilisateur trouvé avec ce pseudo.");
    }
    email = foundEmail;
  }

  const userCred = await signInWithEmailAndPassword(auth, email, password);

  await updateDoc(doc(db, "users", userCred.user.uid), {
    lastLogin: new Date().toISOString()
  });

  console.log("✅ Connexion réussie :", userCred.user.uid);
  return userCred.user;
}


// =============================================================
// 3️⃣ — DÉCONNEXION
// =============================================================
export async function signOutUser() {
  await signOut(auth);
  localStorage.removeItem("currentUser");
  localStorage.removeItem("username");
  console.log("🚪 Déconnecté avec succès.");

  if (typeof window.refreshFeedWriteAccess === "function") {
    window.refreshFeedWriteAccess(); // désactive le feed à la déconnexion
  }

  if (typeof window.showFeedNotification === "function") {
    window.showFeedNotification("🔒 Déconnecté du Core Feed");
  }
}


// =============================================================
// 4️⃣ — MISE À JOUR DES INFORMATIONS UTILISATEUR DANS L’UI
// =============================================================
export async function updateUserInfo(uid) {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      console.warn("⚠️ Aucun utilisateur trouvé pour uid :", uid);
      return;
    }

    const data = snap.data();

    // === Mise à jour du DOM ===
    const pseudoEl = document.getElementById("profile-username");
    const levelEl = document.getElementById("userLevel");
    const feedEl = document.getElementById("userFeed");
    const rankEl = document.getElementById("userRank");

    if (pseudoEl) pseudoEl.textContent = data.username || "Inconnu";
    if (levelEl) levelEl.textContent = data.level ?? 1;
    if (feedEl) feedEl.textContent = (data.feed ?? 0).toFixed(2);
    if (rankEl) rankEl.textContent = data.rank || "Non classé";

    console.log(`👤 Profil mis à jour : ${data.username}`);
  } catch (err) {
    console.error("❌ Erreur updateUserInfo :", err);
  }
}


// =============================================================
// 5️⃣ — COMPATIBILITÉ AVEC MAIN.JS (createAccount utilisé)
// =============================================================
export async function createAccount(email, password, username) {
  try {
    if (!email || !password || !username) {
      if (typeof window.showFeedNotification === "function") {
        window.showFeedNotification("⚠️ Email, mot de passe et pseudo requis.");
      }
      return null;
    }

    const user = await signUp(email, password, username);

    if (typeof window.showFeedNotification === "function") {
      window.showFeedNotification("📩 Vérifie ton email avant de te connecter !");
    }

    return user;
  } catch (err) {
    console.error("❌ Erreur createAccount :", err);
    if (typeof window.showFeedNotification === "function") {
      window.showFeedNotification("❌ Impossible de créer le compte.");
    }
    throw err;
  }
}


// =============================================================
// 6️⃣ — HANDLERS UTILISÉS PAR INDEX.HTML
// =============================================================

// --- Connexion utilisateur ---
async function handleLogin(event) {
  event.preventDefault();

  const login = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value.trim();

  try {
    const user = await signInWithUsernameOrEmail(login, password);
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const username = userDoc.exists() ? userDoc.data().username : "Anon";

    // Sauvegarde du pseudo pour le chat Feed Pulse
    localStorage.setItem("username", username);
    localStorage.setItem("currentUser", user.uid);

    if (typeof window.showFeedNotification === "function") {
      window.showFeedNotification(`Bienvenue ${username} dans le Core 💚`);
    }

    if (typeof window.refreshFeedWriteAccess === "function") {
      window.refreshFeedWriteAccess(); // réactive l’accès au feed
    }

    closeModal("loginModal");
  } catch (err) {
    console.error("❌ Erreur login :", err);
    if (typeof window.showFeedNotification === "function") {
      window.showFeedNotification("Connexion impossible : identifiants invalides.");
    }
  }
}

// --- Création de compte ---
async function handleRegister(event) {
  event.preventDefault();

  const email = document.getElementById("register-email").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const username = document.getElementById("register-username").value.trim();

  try {
    const user = await signUp(email, password, username);

    localStorage.setItem("username", username);
    localStorage.setItem("currentUser", user.uid);

    if (typeof window.showFeedNotification === "function") {
      window.showFeedNotification(`Compte créé avec succès, ${username} 🌀`);
    }

    if (typeof window.refreshFeedWriteAccess === "function") {
      window.refreshFeedWriteAccess(); // active le feed immédiatement
    }

    closeModal("registerModal");
  } catch (err) {
    console.error("❌ Erreur register :", err);
    if (typeof window.showFeedNotification === "function") {
      window.showFeedNotification("❌ Impossible de créer le compte.");
    }
  }
}


// =============================================================
// 7️⃣ — EXPORT GLOBAL POUR LE HTML
// =============================================================
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
