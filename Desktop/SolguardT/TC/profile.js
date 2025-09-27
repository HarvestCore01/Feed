// === profile.js ===
import { updateUserInfo } from './account.js';

document.addEventListener('DOMContentLoaded', () => {
  console.log("Profile.js chargé ✅");

  const savedUser = localStorage.getItem("currentUser");

  // 1️⃣ Vérifie si un utilisateur est connecté
  if (!savedUser) {
    alert("🚫 Vous devez être connecté pour accéder à votre profil.");
    window.location.href = "index.html"; // Redirection vers le dashboard
    return;
  }

  // 2️⃣ Affiche les données du joueur connecté
  updateUserInfo(savedUser);

  // 3️⃣ Gestion du bouton "Retour au Dashboard"
  const backBtn = document.querySelector('.feature-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      console.log("Retour vers le dashboard...");
      // Pas de e.preventDefault ici → navigation classique
    });
  }
});
