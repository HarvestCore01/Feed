// === profile.js ===
import { updateUserInfo } from './account.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Profile.js chargé ✅");

  // Récupère le pseudo dans l'URL (si jamais quelqu'un accède à profile.html?user=Pseudo)
  const params = new URLSearchParams(window.location.search);
  const viewedUser = params.get("user");

  // Si un pseudo est passé en paramètre
  if (viewedUser) {
    console.log("Profil consulté via paramètre URL :", viewedUser);

    const users = JSON.parse(localStorage.getItem("users") || "{}");

    if (users[viewedUser]) {
      const data = users[viewedUser];

      // Sécurité : vérifie que les éléments existent avant de modifier
      const usernameEl = document.getElementById("profile-username");
      const feedEl = document.getElementById("profile-feed");

      if (usernameEl) usernameEl.textContent = viewedUser;
      if (feedEl) feedEl.textContent = (data.feed || 0).toFixed(2) + " SOL";

      // Mets à jour aussi via la fonction générique
      updateUserInfo(viewedUser);
    } else {
      alert("❌ Ce joueur n'existe pas dans la base.");
      window.location.href = "leaderboard.html";
    }
    return; // Stoppe ici
  }

  // Sinon → profil du joueur actuellement connecté
  const savedUser = localStorage.getItem("currentUser");

  if (!savedUser) {
    alert("🚫 Vous devez être connecté pour accéder à votre profil.");
    window.location.href = "index.html"; // Redirection vers le dashboard
    return;
  }

  console.log("Profil du joueur connecté :", savedUser);

  // Mets à jour les infos du joueur connecté
  updateUserInfo(savedUser);

  // Gestion du bouton "Retour au Dashboard"
  const backBtn = document.querySelector('.feature-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      console.log("Retour vers le dashboard...");
      window.location.href = "index.html";
    });
  }
});
