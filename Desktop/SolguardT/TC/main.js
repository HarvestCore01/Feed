// === main.js ===
import { createAccount, login, updateUserInfo } from './account.js';
import { sendSOL, burnTokens, autoIncreaseMarketCap, startLifeTimer,marketCap } from './market.js';
import { updateDisplay } from './ui.js';
import { checkLeaderboardUnlock, updateLeaderboard } from './leaderboard.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  startLifeTimer(); // Lancer le timer au démarrage
});


document.addEventListener('DOMContentLoaded', () => {
  console.log("Main.js chargé ✅");

  // === Boutons ===

  // Créer un compte
  document.getElementById('createAccount').addEventListener('click', createAccount);

  // Login
  document.getElementById('login').addEventListener('click', () => {
    currentUser = login();
    if (currentUser) {
      console.log("Connecté :", currentUser);
      alert(`Bienvenue ${currentUser} !`);
      updateUserInfo(currentUser); // ✅ Affiche immédiatement le profil connecté
      localStorage.setItem("currentUser", currentUser); // Sauvegarde l'utilisateur
    }
  });
  // Mise à jour du classement dès la connexion
  document.getElementById('login').addEventListener('click', () => {
  currentUser = login();
  if (currentUser) {
    console.log("Connecté :", currentUser);
    updateLeaderboard(currentUser); // MAJ du leaderboard dès connexion
  }
});


  // Envoi de SOL (feed l'IA)
  document.getElementById('sendSOL').addEventListener('click', () => {
    if (!currentUser) {
      alert("🚫 Vous devez être connecté pour envoyer du SOL.");
      return;
    }
    sendSOL(currentUser);
    updateDisplay();
    updateUserInfo(currentUser); // ✅ Met à jour le profil après un feed
    updateLeaderboard(currentUser); // Refresh du leaderboard après feed
  });

  // Burn des tokens
  document.getElementById('burnCore').addEventListener('click', () => {
    if (!currentUser) {
      alert("🚫 Vous devez être connecté pour brûler des tokens.");
      return;
    }
    burnTokens(currentUser);
    updateDisplay();
  });

  // === Reconnexion automatique ===
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = savedUser;
    updateUserInfo(currentUser); // ✅ Affiche directement le profil après refresh
  }

 // === Lancements automatiques ===
autoIncreaseMarketCap(() => {
  updateDisplay();                // met à jour la barre de progression
  checkLeaderboardUnlock(marketCap); // vérifie à chaque tick

   // === Affiche le lien vers le leaderboard quand le cap est atteint ===
  const leaderboardLink = document.getElementById('leaderboardLink');
  const milestoneGoal = parseInt(document.getElementById('milestoneGoal').textContent);

  if (marketCap >= milestoneGoal) {
    leaderboardLink.style.display = 'block'; // Affiche le bouton
  }
});

startLifeTimer(updateDisplay);     // timer de vie
});