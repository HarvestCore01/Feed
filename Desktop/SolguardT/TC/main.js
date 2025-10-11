// === main.js ===
// =============================================================
// 🔹 IMPORT DES MODULES
// =============================================================
import {updateUserInfo,signOutUser} from "./account.js";
import {sendSOL,burnTokens,autoIncreaseMarketCap,startLifeTimer,marketCap} from "./market.js";
import { updateDisplay, smoothUpdateMarketCap } from "./ui.js";
import { updateLeaderboard } from "./leaderboard.js";
import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";


// =============================================================
// 🔸 VARIABLES GLOBALES
// =============================================================
let currentUser = null;
let leaderboardUnlocked = false;
window.eggHatched = false;

const bootSound = new Audio("./sounds/boot.mp3");
bootSound.volume = 0.2;
let bootPlayed = false;


// =============================================================
// 1️⃣ INITIALISATION DE LA PAGE
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  console.log("Main.js chargé ✅");

  // =============================================================
  // 🔹 OBSERVATEUR D’AUTHENTIFICATION
  // =============================================================
  onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) {
      currentUser = user.uid;

      try {
        await updateUserInfo(currentUser);

        document.getElementById("createAccount").style.display = "none";
        document.getElementById("login").style.display = "none";
        document.getElementById("viewProfile").style.display = "inline-block";
        document.getElementById("logoutBtn").style.display = "inline-block";

        // ✅ Active le feed si connecté
        if (window.refreshFeedWriteAccess) window.refreshFeedWriteAccess();

        if (window.showFeedNotification)
          showFeedNotification("🔗 Reconnexion réussie au Core Feed");

        console.log("✅ Reconnecté automatiquement :", currentUser);
      } catch (err) {
        console.error("⚠️ Erreur lors du chargement du profil :", err);
      }
    } else {
      // 🔹 Aucun utilisateur ou mail non vérifié
      localStorage.removeItem("currentUser");
      localStorage.removeItem("username");
      currentUser = null;

      document.getElementById("createAccount").style.display = "inline-block";
      document.getElementById("login").style.display = "inline-block";
      document.getElementById("viewProfile").style.display = "none";
      document.getElementById("logoutBtn").style.display = "none";

      // 🔒 Désactive le feed
      if (window.refreshFeedWriteAccess) window.refreshFeedWriteAccess();
    }
  });

  // =============================================================
  // 2️⃣ UTILITAIRES VISUELS / AUDIO
  // =============================================================
  function updateEggIntensity(marketCap) {
    const egg = document.getElementById("ai-hologram");
    if (!egg) return;
    const intensity = Math.min(Math.log10(marketCap + 1) / 4, 1);
    egg.style.setProperty("--intensity", intensity.toFixed(3));
    egg.style.animationDuration = `${2.5 - intensity * 1.5}s`;
  }

  function playMilestoneSound() {
    const audio = new Audio("./sounds/milestone.mp3");
    audio.volume = 0.25;
    audio.play().catch((err) => console.warn("Lecture bloquée :", err));
  }

  function playBootSound() {
    if (!bootPlayed) {
      bootSound
        .play()
        .then(() => {
          bootPlayed = true;
          console.log("🔊 Son de boot joué !");
        })
        .catch(() => {
          document.body.addEventListener(
            "click",
            () => {
              bootSound.play();
              bootPlayed = true;
            },
            { once: true }
          );
        });
    }
  }

  function hatchEgg() {
    const flash = document.createElement("div");
    flash.style.position = "fixed";
    flash.style.top = 0;
    flash.style.left = 0;
    flash.style.width = "100%";
    flash.style.height = "100%";
    flash.style.background = "rgba(0,217,255,0.8)";
    flash.style.zIndex = 9999;
    flash.style.transition = "opacity 0.6s ease-out";
    document.body.appendChild(flash);
    setTimeout(() => (flash.style.opacity = 0), 50);
    setTimeout(() => flash.remove(), 650);
  }

  function playBeep() {
    const audio = new Audio("./sounds/beep.mp3");
    audio.volume = 0.05;
    audio.playbackRate = 0.9 + Math.random() * 0.2;
    audio.play();
  }

  // =============================================================
  // 3️⃣ INTRO / DÉMARRAGE
  // =============================================================
  playBootSound();

  const intro = document.getElementById("intro-screen");
  const dashboard = document.getElementById("dashboard");

  setTimeout(() => {
    intro.classList.add("fade-out");
    setTimeout(() => {
      intro.style.display = "none";
      dashboard.style.display = "block";
      setTimeout(() => dashboard.classList.add("visible"), 50);
    }, 800);
  }, 2500);

  startLifeTimer(updateDisplay);

  // =============================================================
  // 4️⃣ MODALES / MOT DE PASSE / UI
  // =============================================================
  const createAccountBtn = document.getElementById("createAccount");
  const loginBtn = document.getElementById("login");
  const logoutBtn = document.getElementById("logoutBtn");
  const sendSolBtn = document.getElementById("sendSOL");
  const burnCoreBtn = document.getElementById("burnCore");

  function openModal(id) {
    document.getElementById(id)?.classList.add("active");
  }
  function closeModal(id) {
    document.getElementById(id)?.classList.remove("active");
  }

  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal"))
      e.target.classList.remove("active");
  });

  function togglePassword(id, el) {
    const input = document.getElementById(id);
    const type = input.type === "password" ? "text" : "password";
    input.type = type;
    el.textContent = type === "password" ? "👁️" : "🙈";
  }

  window.togglePassword = togglePassword;
  window.openModal = openModal;
  window.closeModal = closeModal;

  if (loginBtn)
    loginBtn.addEventListener("click", () => openModal("loginModal"));
  if (createAccountBtn)
    createAccountBtn.addEventListener("click", () => openModal("registerModal"));

  // =============================================================
  // 5️⃣ DÉCONNEXION
  // =============================================================
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOutUser();

        document.getElementById("createAccount").style.display = "inline-block";
        document.getElementById("login").style.display = "inline-block";
        document.getElementById("viewProfile").style.display = "none";
        document.getElementById("logoutBtn").style.display = "none";

        if (window.showFeedNotification)
          showFeedNotification("🚪 Déconnecté du Core Feed");
      } catch (err) {
        console.error("Erreur déconnexion :", err);
      }
    });
  }

  // =============================================================
  // 6️⃣ ACTIONS UTILISATEUR (SEND / BURN)
  // =============================================================
  if (burnCoreBtn) {
    burnCoreBtn.addEventListener("click", () => {
      if (!currentUser) {
        if (window.showFeedNotification)
          showFeedNotification("⚠️ Connecte-toi avant de brûler des tokens");
        return;
      }
      burnTokens(currentUser);
      updateDisplay();
    });
  }

  // =============================================================
  // 7️⃣ LEADERBOARD & MARKETCAP
  // =============================================================
  const milestones = [9000, 20000, 40000];
  let lastTriggeredMilestone = 0;
  let lastMarketCap = 0;
  const marketCapStep = 5000;

  autoIncreaseMarketCap(() => {
    updateDisplay();
    smoothUpdateMarketCap(marketCap);
    updateEggIntensity(marketCap);

    if (marketCap >= 10000 && !window.eggHatched) {
      const aiHologram = document.getElementById("ai-hologram");
      if (aiHologram) {
        aiHologram.classList.add("hatch");
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

    const leaderboardSection = document.getElementById("leaderboardSection");
    const leaderboardMessage = document.getElementById("leaderboardMessage");
    const openLeaderboardBtn = document.getElementById("openLeaderboardBtn");
    const milestoneGoalEl = document.getElementById("milestoneGoal");
    if (!milestoneGoalEl) return;

    const milestoneGoal = parseInt(
      milestoneGoalEl.textContent.replace(/\D/g, "")
    );
    if (!leaderboardUnlocked) {
      if (marketCap < milestoneGoal) {
        leaderboardSection.classList.add("locked");
        leaderboardMessage.innerHTML = `🔒 Débloquez le leaderboard à <strong>${milestoneGoal}</strong> SOL.`;
        openLeaderboardBtn.onclick = () => false;
      } else {
        leaderboardUnlocked = true;
        leaderboardSection.classList.add("unlocked");
        leaderboardSection.classList.remove("locked");
        leaderboardMessage.innerHTML = `🎉 Le leaderboard est maintenant disponible !`;
        openLeaderboardBtn.onclick = null;
      }
    }
  });
});
