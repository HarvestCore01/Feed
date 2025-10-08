// === profile.js ===
import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { doc, getDoc, query, where, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { updateUserInfo } from "./account.js";

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Profile.js chargé ✅");

  const params = new URLSearchParams(window.location.search);
  const viewedUser = params.get("user");

  // =============================================================
  // 1️⃣ — CONSULTATION D’UN PROFIL PAR PSEUDO (ex: ?user=CryptoCore)
  // =============================================================
  if (viewedUser) {
    console.log("Profil consulté :", viewedUser);

    try {
      const q = query(collection(db, "users"), where("username", "==", viewedUser));
      const snap = await getDocs(q);

      if (snap.empty) {
        alert("❌ Ce joueur n’existe pas.");
        window.location.href = "leaderboard.html";
        return;
      }

      const data = snap.docs[0].data();

      const usernameEl = document.getElementById("profile-username");
      const feedEl = document.getElementById("profile-feed");
      const levelEl = document.getElementById("userLevel");
      const rankEl = document.getElementById("userRank");

      if (usernameEl) usernameEl.textContent = data.username;
      if (feedEl) feedEl.textContent = (data.feed ?? 0).toFixed(2) + " SOL";
      if (levelEl) levelEl.textContent = data.level ?? 1;
      if (rankEl) rankEl.textContent = data.rank ?? "Non classé";

      console.log(`👤 Profil de ${data.username} chargé via Firestore ✅`);
    } catch (err) {
      console.error("❌ Erreur lors du chargement du profil public :", err);
      alert("Erreur lors du chargement du profil.");
      window.location.href = "leaderboard.html";
    }

    return; // On s’arrête ici, car c’est un profil public
  }

  // =============================================================
  // 2️⃣ — PROFIL DU JOUEUR CONNECTÉ
  // =============================================================
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("🚫 Vous devez être connecté pour accéder à votre profil.");
      window.location.href = "index.html";
      return;
    }

    if (!user.emailVerified) {
      alert("⚠️ Vérifie ton email avant d’accéder à ton profil.");
      window.location.href = "index.html";
      return;
    }

    console.log("Profil du joueur connecté :", user.uid);
    await updateUserInfo(user.uid);
  });

  // =============================================================
  // 3️⃣ — GESTION DU BOUTON RETOUR
  // =============================================================
  const backBtn = document.querySelector(".feature-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      console.log("Retour vers le dashboard...");
      window.location.href = "index.html";
    });
  }
});
