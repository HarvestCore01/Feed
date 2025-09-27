// === main.js ===
import { createAccount, login, updateUserInfo } from './account.js';
import { sendSOL, burnTokens, autoIncreaseMarketCap, startLifeTimer, marketCap } from './market.js';
import { updateDisplay } from './ui.js';
import { checkLeaderboardUnlock, updateLeaderboard } from './leaderboard.js';

let currentUser = null;
let leaderboardUnlocked = false; // ✅ Drapeau : Leaderboard initialement verrouillé


document.addEventListener('DOMContentLoaded', () => {
  console.log("Main.js chargé ✅");

  // ==========================
  // Gestion du Timer de Vie
  // ==========================
  startLifeTimer(updateDisplay); // Lancer le timer au démarrage

  // ==========================
  // Boutons
  // ==========================
  const createAccountBtn = document.getElementById('createAccount');
  const loginBtn = document.getElementById('login');
  const sendSolBtn = document.getElementById('sendSOL');
  const burnCoreBtn = document.getElementById('burnCore');

  // Création de compte
  createAccountBtn.addEventListener('click', createAccount);

  // Login
  loginBtn.addEventListener('click', () => {
    const user = login();
    if (user) {
      currentUser = user;
      console.log("Connecté :", currentUser);
      alert(`Bienvenue ${currentUser} !`);
      updateUserInfo(currentUser);
      localStorage.setItem("currentUser", currentUser);
      updateLeaderboard(currentUser); // Mise à jour leaderboard dès connexion
    }
  });

  // Envoi de SOL
  sendSolBtn.addEventListener('click', () => {
    if (!currentUser) {
      alert("🚫 Vous devez être connecté pour envoyer du SOL.");
      return;
    }
    sendSOL(currentUser);
    updateDisplay();
    updateUserInfo(currentUser);
    updateLeaderboard(currentUser);
  });

  // Burn des tokens
  burnCoreBtn.addEventListener('click', () => {
    if (!currentUser) {
      alert("🚫 Vous devez être connecté pour brûler des tokens.");
      return;
    }
    burnTokens(currentUser);
    updateDisplay();
  });

  // ==========================
  // Reconnexion automatique
  // ==========================
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = savedUser;
    updateUserInfo(currentUser);
  }

  // ==========================
  // Leaderboard LOCK logique
  // ==========================
  autoIncreaseMarketCap(() => {
    updateDisplay();

    const leaderboardSection = document.getElementById('leaderboardSection');
    const leaderboardMessage = document.getElementById('leaderboardMessage');
    const openLeaderboardBtn = document.getElementById('openLeaderboardBtn');
    const milestoneGoalEl = document.getElementById('milestoneGoal');

    // Vérification sécurisée du milestoneGoal
    if (!milestoneGoalEl) {
      console.warn("⚠️ milestoneGoal introuvable dans le DOM");
      return;
    }

    // Nouveau code : supprime les séparateurs avant conversion
const milestoneGoal = parseInt(milestoneGoalEl.textContent.replace(/\D/g, ''));


    console.log("DEBUG → MarketCap:", marketCap, "MilestoneGoal:", milestoneGoal);

   if (!leaderboardUnlocked) {
      // Tant que le leaderboard n'a pas encore été débloqué
      if (marketCap < milestoneGoal) {
        // Encore verrouillé
        leaderboardSection.classList.add('locked');
        leaderboardMessage.innerHTML = `🔒 Débloquez le leaderboard en atteignant <strong>${milestoneGoal}</strong> SOL de MarketCap.`;
        openLeaderboardBtn.onclick = () => false;
      } else {
        // Débloqué pour la première fois
        leaderboardUnlocked = true; // ✅ ON NE REVIENT PLUS EN ARRIÈRE
        const leaderboardSection = document.getElementById('leaderboardSection');
leaderboardSection.classList.add('unlocked');

        leaderboardSection.classList.remove('locked');
        leaderboardMessage.innerHTML = `🎉 Le leaderboard est maintenant disponible !`;
        openLeaderboardBtn.onclick = null;
      }
    } else {
      // Leaderboard déjà débloqué → reste ouvert quoi qu'il arrive
      leaderboardSection.classList.remove('locked');
      leaderboardMessage.innerHTML = `🎉 Le leaderboard est maintenant disponible !`;
      openLeaderboardBtn.onclick = null;
    }
  });
});
