// === main.js ===
// 🔹 Import des modules
import { createAccount, updateUserInfo, signIn, signOutUser } from './account.js';
import { sendSOL, burnTokens, autoIncreaseMarketCap, startLifeTimer, marketCap } from './market.js';
import { updateDisplay, smoothUpdateMarketCap } from './ui.js';
import { updateLeaderboard } from './leaderboard.js';
import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";


// === Variables globales ===
let currentUser = null;
let leaderboardUnlocked = false;
window.eggHatched = false;

// === Sons globaux ===
const bootSound = new Audio('./sounds/boot.mp3');
bootSound.volume = 0.2;
let bootPlayed = false;

// =============================================================
// 1. Initialisation de la page
// =============================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log("Main.js chargé ✅");

// 🔹 Vérifie l'état de connexion Firebase
onAuthStateChanged(auth, (user) => {
  if (user && user.emailVerified) {
    currentUser = user.uid;
    updateUserInfo(currentUser);

    document.getElementById('createAccount').style.display = 'none';
    document.getElementById('viewProfile').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'inline-block';
document.getElementById('login').style.display = 'none';


    console.log("Reconnecté automatiquement via Firebase :", currentUser);
  } else {
    // Nettoyage si pas connecté
    localStorage.removeItem("currentUser");
    currentUser = null;

    document.getElementById('createAccount').style.display = 'inline-block';
    document.getElementById('viewProfile').style.display = 'none';

    console.log("Aucun utilisateur connecté.");
  }
});

  // =============================================================
  // 2. Fonctions locales (sons, animations, intensité, etc.)
  // =============================================================

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

  // =============================================================
  // 3. Lancement initial et animation d’entrée
  // =============================================================
  playBootSound();

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

  // Timer de vie
  startLifeTimer(updateDisplay);

  // =============================================================
  // 4. Boutons principaux
  // =============================================================
  const createAccountBtn = document.getElementById('createAccount');
  const loginBtn = document.getElementById('login');
  const sendSolBtn = document.getElementById('sendSOL');
  const burnCoreBtn = document.getElementById('burnCore');

  // =============================================================
  // 5. Pop-up "Créer un compte"
  // =============================================================
  const createAccountModal = document.getElementById("createAccountModal");
  const closeRegisterModal = document.getElementById("closeRegisterModal");
  const confirmRegisterBtn = document.getElementById("confirmRegisterBtn");

  if (createAccountBtn) {
    createAccountBtn.addEventListener("click", () => {
      createAccountModal.style.display = "flex"; // ouvrir
    });
  }
  if (closeRegisterModal) {
    closeRegisterModal.addEventListener("click", () => {
      createAccountModal.style.display = "none"; // fermer
    });
  }
  window.addEventListener("click", (e) => {
    if (e.target === createAccountModal) {
      createAccountModal.style.display = "none";
    }
  });

  if (confirmRegisterBtn) {
    confirmRegisterBtn.addEventListener("click", async () => {
      const email = document.getElementById("registerEmail").value.trim();
      const username = document.getElementById("registerUsername").value.trim();
      const password = document.getElementById("registerPassword").value.trim();
      const passwordConfirm = document.getElementById("registerPasswordConfirm").value.trim();

      if (password !== passwordConfirm) {
        alert("❌ Les mots de passe ne correspondent pas.");
        return;
      }

      try {
        const user = await createAccount(email, password, username);
        console.log("✅ Compte créé :", user.uid);
        createAccountModal.style.display = "none";
      } catch (err) {
        console.error(err);
      }
    });
  }

  // =============================================================
  // 6. Pop-up "Login"
  // =============================================================
  const loginModal = document.getElementById("loginModal");
  const closeBtn = document.getElementById("closeLoginModal");
  const confirmBtn = document.getElementById("confirmLoginBtn");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      loginModal.style.display = "flex";
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      loginModal.style.display = "none";
    });
  }
  window.addEventListener("click", (e) => {
    if (e.target === loginModal) {
      loginModal.style.display = "none";
    }
  });

  if (confirmBtn) {
    confirmBtn.addEventListener("click", async () => {
      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

      if (email && password) {
        try {
          const user = await signIn(email, password);

          if (!user.emailVerified) {
            alert("⚠️ Veuillez vérifier votre email avant de vous connecter.");
            return;
          }

          currentUser = user.uid;
          localStorage.setItem("currentUser", currentUser);

             // 🔹 Récupérer le pseudo depuis Firestore
      const userData = await getUserData(currentUser);

          await updateUserInfo(currentUser);
          updateLeaderboard(currentUser);

          document.getElementById('createAccount').style.display = 'none';
          document.getElementById('viewProfile').style.display = 'inline-block';
          document.getElementById('logoutBtn').style.display = 'inline-block';
          document.getElementById('login').style.display = 'none';


          loginModal.style.display = "none";
          alert(`Bienvenue ${user.email} !`);
        } catch (err) {
          alert("❌ Email ou mot de passe incorrect.");
        }
      } else {
        alert("🚫 Email et mot de passe requis !");
      }
    });
  }

  // === Bouton Logout ===
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOutUser();
      localStorage.removeItem("currentUser");

      // Réinitialise l'affichage
      document.getElementById('createAccount').style.display = 'inline-block';
      document.getElementById('login').style.display = 'inline-block';
      document.getElementById('viewProfile').style.display = 'none';
      document.getElementById('logoutBtn').style.display = 'none';

      alert("✅ Déconnecté avec succès !");
      currentUser = null;
    } catch (err) {
      console.error("❌ Erreur de déconnexion :", err);
    }
  });
}

  // =============================================================
  // 7. Gestion des actions : Send SOL & Burn
  // =============================================================
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

  burnCoreBtn.addEventListener('click', () => {
    if (!currentUser) {
      alert("🚫 Vous devez être connecté pour brûler des tokens.");
      return;
    }
    burnTokens(currentUser);
    updateDisplay();
  });

  // =============================================================
  // 8. Leaderboard + MarketCap
  // =============================================================
  const milestones = [9000, 20000, 40000];
  let lastTriggeredMilestone = 0;
  let lastMarketCap = 0;
  const marketCapStep = 5000;

  autoIncreaseMarketCap(() => {
    updateDisplay();
    smoothUpdateMarketCap(marketCap);
    updateEggIntensity(marketCap);

    // 🔹 Éclosion de l'œuf
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

    // 🔹 Sons milestones
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

    // 🔹 Déblocage du leaderboard
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
