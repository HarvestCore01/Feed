// === main.js ===
import { createAccount, login, updateUserInfo } from './account.js';
import { sendSOL, burnTokens, autoIncreaseMarketCap, startLifeTimer, marketCap } from './market.js';
import { updateDisplay, smoothUpdateMarketCap } from './ui.js';
import { updateLeaderboard } from './leaderboard.js';

let currentUser = null;
let leaderboardUnlocked = false;
window.eggHatched = false;

// === Sons globaux ===
const bootSound = new Audio('./sounds/boot.mp3');
bootSound.volume = 0.2;
let bootPlayed = false;

// === Vérifie si un utilisateur est déjà connecté au chargement ===
document.addEventListener('DOMContentLoaded', () => {
  console.log("Main.js chargé ✅");

  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = savedUser;
    updateUserInfo(currentUser);
    document.getElementById('createAccount').style.display = 'none';
    document.getElementById('viewProfile').style.display = 'inline-block';
    console.log("Reconnecté automatiquement :", currentUser);
  }

  // === Fonctions locales ===
  function updateEggIntensity(marketCap) {
    const egg = document.getElementById('ai-hologram');
    if (!egg) return;
    const intensity = Math.min(Math.log10(marketCap + 1) / 4, 1);
    egg.style.setProperty('--intensity', intensity.toFixed(3));
    egg.style.animationDuration = `${2.5 - intensity * 1.5}s`;
  }

  function playMilestoneSound() {
    const audio = new Audio('./sounds/milestone.mp3');
    audio.volume = 0.25;
    audio.play().catch(err => console.warn("Lecture bloquée :", err));
  }

  function playBootSound() {
    if (!bootPlayed) {
      bootSound.play().then(() => {
        bootPlayed = true;
        console.log("🔊 Son de boot joué avec succès !");
      }).catch(() => {
        console.warn("⚠️ Lecture auto bloquée, attente d'un clic utilisateur...");
        document.body.addEventListener('click', () => {
          bootSound.play();
          bootPlayed = true;
        }, { once: true });
      });
    }
  }

  function hatchEgg() {
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = 0;
    flash.style.left = 0;
    flash.style.width = '100%';
    flash.style.height = '100%';
    flash.style.background = 'rgba(0,217,255,0.8)';
    flash.style.zIndex = 9999;
    flash.style.transition = 'opacity 0.6s ease-out';
    document.body.appendChild(flash);
    setTimeout(() => flash.style.opacity = 0, 50);
    setTimeout(() => flash.remove(), 650);
  }

  function playBeep() {
    const audio = new Audio('./sounds/beep.mp3');
    audio.volume = 0.05;
    audio.playbackRate = 0.9 + Math.random() * 0.2;
    audio.play();
  }

  // === Lancement initial ===
  playBootSound();

  // Animation d'entrée
  const intro = document.getElementById('intro-screen');
  const dashboard = document.getElementById('dashboard');

  setTimeout(() => {
    intro.classList.add('fade-out');
    setTimeout(() => {
      intro.style.display = 'none';
      dashboard.style.display = 'block';
      setTimeout(() => dashboard.classList.add('visible'), 50);
    }, 800);
  }, 2500);

  // === Timer de vie ===
  startLifeTimer(updateDisplay);

  // === Boutons ===
  const createAccountBtn = document.getElementById('createAccount');
  const loginBtn = document.getElementById('login');
  const sendSolBtn = document.getElementById('sendSOL');
  const burnCoreBtn = document.getElementById('burnCore');

  createAccountBtn.addEventListener('click', createAccount);

  loginBtn.addEventListener('click', () => {
    const user = login();
    if (user) {
      currentUser = user;
      localStorage.setItem("currentUser", currentUser);
      updateUserInfo(currentUser);
      updateLeaderboard(currentUser);
      document.getElementById('createAccount').style.display = 'none';
      document.getElementById('viewProfile').style.display = 'inline-block';
      alert(`Bienvenue ${currentUser} !`);
    }
  });

  // === Envoi de SOL + Leaderboard ===
  sendSolBtn.addEventListener('click', () => {
    if (!currentUser) {
      alert("🚫 Vous devez être connecté pour envoyer du SOL.");
      return;
    }

    // Ajout des points au joueur
    const users = JSON.parse(localStorage.getItem("users") || "{}");
    if (!users[currentUser]) users[currentUser] = { feed: 0 };
    const amount = 10;
    users[currentUser].feed += amount;
    localStorage.setItem("users", JSON.stringify(users));

    // Mises à jour
    sendSOL(currentUser);
    updateDisplay();
    updateUserInfo(currentUser);
    updateLeaderboard(currentUser);
  });

  burnCoreBtn.addEventListener('click', () => {
    if (!currentUser) {
      alert("🚫 Vous devez être connecté pour brûler des tokens.");
      return;
    }
    burnTokens(currentUser);
    updateDisplay();
  });

  // === Leaderboard + MarketCap ===
  const milestones = [9000, 20000, 40000];
  let lastTriggeredMilestone = 0;
  let lastMarketCap = 0;
  const marketCapStep = 5000;

  autoIncreaseMarketCap(() => {
    updateDisplay();
    smoothUpdateMarketCap(marketCap);
    updateEggIntensity(marketCap);

    // Éclosion de l'œuf
    if (marketCap >= 10000 && !window.eggHatched) {
      const aiHologram = document.getElementById('ai-hologram');
      if (aiHologram) {
        aiHologram.classList.add('hatch');
        hatchEgg();
        setTimeout(() => {
          aiHologram.innerHTML = `
            <div class="ia-final">
              <span class="energy"></span>
              <div class="ring"></div>
              <div class="ring"></div>
            </div>`;
        }, 2000);
      }
      window.eggHatched = true;
    }

    // Sons milestones
    if (marketCap - lastMarketCap >= marketCapStep) {
      playBeep();
      lastMarketCap = marketCap;
    }

    for (let milestone of milestones) {
      if (marketCap >= milestone && lastTriggeredMilestone < milestone) {
        playMilestoneSound();
        lastTriggeredMilestone = milestone;
      }
    }

    // Déblocage du leaderboard
    const leaderboardSection = document.getElementById('leaderboardSection');
    const leaderboardMessage = document.getElementById('leaderboardMessage');
    const openLeaderboardBtn = document.getElementById('openLeaderboardBtn');
    const milestoneGoalEl = document.getElementById('milestoneGoal');

    if (!milestoneGoalEl) return;
    const milestoneGoal = parseInt(milestoneGoalEl.textContent.replace(/\D/g, ''));

    if (!leaderboardUnlocked) {
      if (marketCap < milestoneGoal) {
        leaderboardSection.classList.add('locked');
        leaderboardMessage.innerHTML = `🔒 Débloquez le leaderboard en atteignant <strong>${milestoneGoal}</strong> SOL.`;
        openLeaderboardBtn.onclick = () => false;
      } else {
        leaderboardUnlocked = true;
        leaderboardSection.classList.add('unlocked');
        leaderboardSection.classList.remove('locked');
        leaderboardMessage.innerHTML = `🎉 Le leaderboard est maintenant disponible !`;
        openLeaderboardBtn.onclick = null;
      }
    }
  });
});
