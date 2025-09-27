// === main.js ===
import { createAccount, login, updateUserInfo } from './account.js';
import { sendSOL, burnTokens, autoIncreaseMarketCap, startLifeTimer } from './market.js';
import { updateDisplay } from './ui.js';

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

  // Envoi de SOL (feed l'IA)
  document.getElementById('sendSOL').addEventListener('click', () => {
    if (!currentUser) {
      alert("🚫 Vous devez être connecté pour envoyer du SOL.");
      return;
    }
    sendSOL(currentUser);
    updateDisplay();
    updateUserInfo(currentUser); // ✅ Met à jour le profil après un feed
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
  autoIncreaseMarketCap(updateDisplay); // Augmente le MarketCap toutes les X secondes
  startLifeTimer(updateDisplay); // Démarre le timer de vie
});
