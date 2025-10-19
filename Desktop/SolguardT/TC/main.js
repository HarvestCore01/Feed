// === main.js ===
// =============================================================
// 🔹 IMPORT DES MODULES
// =============================================================
import { updateUserInfo, signOutUser } from "./account.js";
import { burnTokens } from "./market.js";
import { updateDisplay } from "./ui.js";
import { auth, app } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

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
  // 🔹 GESTION DES BOUTONS DE MODALES (login / register)
  // =============================================================
  const loginBtn = document.getElementById("login");
  const createAccountBtn = document.getElementById("createAccount");

  if (loginBtn) {
    loginBtn.addEventListener("click", () => openModal("loginModal"));
  }

  if (createAccountBtn) {
    createAccountBtn.addEventListener("click", () => openModal("registerModal"));
  }

  // Fonction d’ouverture modale universelle
  window.openModal = function (id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = "flex";
    modal.classList.add("active");
  };

  window.closeModal = function (id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove("active");
    setTimeout(() => (modal.style.display = "none"), 250);
  };

  // =============================================================
  // 🔹 OBSERVATEUR D’AUTHENTIFICATION
  // =============================================================
  onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) {
      currentUser = user.uid;

      try {
        await updateUserInfo(currentUser);

        loginBtn.style.display = "none";
        createAccountBtn.style.display = "none";
        document.getElementById("viewProfile").style.display = "inline-block";
        document.getElementById("logoutBtn").style.display = "inline-block";

        if (window.refreshFeedWriteAccess) window.refreshFeedWriteAccess();
        showHolographicNotification("🔗 Reconnexion réussie au Core Feed", "#00ff9c");

        console.log("✅ Reconnecté automatiquement :", currentUser);
      } catch (err) {
        console.error("⚠️ Erreur lors du chargement du profil :", err);
      }
    } else {
      localStorage.removeItem("currentUser");
      localStorage.removeItem("username");
      currentUser = null;

      loginBtn.style.display = "inline-block";
      createAccountBtn.style.display = "inline-block";
      document.getElementById("viewProfile").style.display = "none";
      document.getElementById("logoutBtn").style.display = "none";

      if (window.refreshFeedWriteAccess) window.refreshFeedWriteAccess();
    }
  });

  // =============================================================
  // 🔹 SON D’INTRO
  // =============================================================
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

  // =============================================================
  // 🧠 Feed Factory Timer
  // =============================================================
  startFeedFactoryTimer(updateDisplay);

  // =============================================================
  // 🔹 LOGOUT
  // =============================================================
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await signOutUser();
        loginBtn.style.display = "inline-block";
        createAccountBtn.style.display = "inline-block";
        document.getElementById("viewProfile").style.display = "none";
        document.getElementById("logoutBtn").style.display = "none";
        showHolographicNotification("🚪 Déconnecté du Core Feed", "#ff4d6d");
      } catch (err) {
        console.error("Erreur déconnexion :", err);
      }
    });
  }
});

// =============================================================
// 🧩 LOGIQUE FEED FACTORY TIMER (Firebase → Timer → UI)
// =============================================================
function startFeedFactoryTimer(updateDisplay) {
  const db = getDatabase(app);
  const nextFeedRef = ref(db, "nextFeed");
  const lifeBar = document.getElementById("lifeBar");
  const progressMessage = document.getElementById("progressMessage");

  if (!lifeBar || !progressMessage) return;

  let activeFeedName = null;
  let countdownInterval = null;

  onValue(nextFeedRef, (snapshot) => {
    const data = snapshot.val();
    if (!data || !data.startsAt) {
      updateProgressDisplay(0, "⏳ En attente du prochain Feed...");
      if (countdownInterval) clearInterval(countdownInterval);
      return;
    }

    const { startsAt, duration = 86400000, name = "Feed_Alpha" } = data;
    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
      const now = Date.now();
      const remaining = startsAt - now;
      const elapsed = Math.min(Math.max(duration - remaining, 0), duration);
      const percent = (elapsed / duration) * 100;
      lifeBar.style.width = `${percent.toFixed(2)}%`;

      if (remaining > 0) {
        const hours = Math.floor(remaining / 3600000);
        const minutes = Math.floor((remaining % 3600000) / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        updateProgressDisplay(percent, `Prochain Feed « ${name} » dans ${hours}h ${minutes}m ${seconds}s`);
      } else {
        if (activeFeedName !== name) {
          activeFeedName = name;
          triggerFeedLaunch(name);
        }
        clearInterval(countdownInterval);
      }
    }, 1000);
  });

  function updateProgressDisplay(percent, message) {
    if (progressMessage) {
      progressMessage.textContent = message || "⏳ En attente du prochain Feed...";
      progressMessage.classList.remove("hidden");
    }
    if (lifeBar) lifeBar.style.width = `${percent}%`;
  }

  function triggerFeedLaunch(feedName) {
    showHolographicNotification(`🚀 Nouveau projet "${feedName}" lancé !`, "#00ff9c");
    updateDisplay?.();
  }
}

// =============================================================
// 💹 DEXSCREENER LIVE MARKETCAP SYNC + ALERT SYSTEM
// =============================================================
const TOKEN_ADDRESS = "2VBDM27xPCiqWrFab5oREF4UWJVVXpxGCaTrBgb4bQcq";
const DEX_API = `https://api.dexscreener.com/latest/dex/tokens/${TOKEN_ADDRESS}`;

const marketCapBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressMessage");
const marketCapLabel = document.getElementById("marketCap");
const milestoneGoal = document.getElementById("milestoneGoal");

let lastMarketCap = 0;
let currentScaleMax = 1_000_000; // 1M$ par défaut

// =============================================================
// ✨ HOLOGRAPHIC NOTIFICATION SYSTEM (UNIFIÉ GLOBAL)
// =============================================================
function ensureNotifContainer() {
  let container = document.getElementById("feedNotificationContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "feedNotificationContainer";
    document.body.appendChild(container);
  }
  return container;
}

export function showHolographicNotification(message, color = "#00ff9c") {
  const container = ensureNotifContainer();
  const notif = document.createElement("div");
  notif.className = "holo-notif";
  notif.innerHTML = `<span>${message}</span>`;

  notif.style.border = `1px solid ${color}`;
  notif.style.color = color;
  notif.style.boxShadow = `0 0 12px ${color}, inset 0 0 8px ${color}`;

  container.appendChild(notif);

  setTimeout(() => {
    notif.style.opacity = 1;
    notif.style.transform = "translateY(0)";
  }, 50);

  setTimeout(() => {
    notif.style.opacity = 0;
    notif.style.transform = "translateY(-10px)";
    setTimeout(() => notif.remove(), 700);
  }, 5000);
}

window.showHolographicNotification = showHolographicNotification;


// =============================================================
// 🧩 TYPES DE NOTIFS PRÉDÉFINIS (accès global facile)
// =============================================================
window.notify = {
  success: (msg) => showHolographicNotification(`✅ ${msg}`, "#00ff9c"),
  warning: (msg) => showHolographicNotification(`⚠️ ${msg}`, "#ffb347"),
  error: (msg) => showHolographicNotification(`❌ ${msg}`, "#ff4d6d"),
  info: (msg) => showHolographicNotification(`💡 ${msg}`, "#00c8ff"),
  whale: (msg) => showHolographicNotification(`🐋 ${msg}`, "#00bfff"),
  pump: (msg) => showHolographicNotification(`📈 ${msg}`, "#00ffcc"),
  dump: (msg) => showHolographicNotification(`📉 ${msg}`, "#ff5c8a"),
};


// =============================================================
// 🧠 SYNC MARKETCAP + ALERTES
// =============================================================
async function syncMarketCap() {
  try {
    const res = await fetch(DEX_API);
    const data = await res.json();
    const pair = data.pairs?.[0];
    if (!pair) return;

    const marketCap = pair.fdv || 0;
    const volume = pair.volume?.h24 || 0;

    let newScaleMax = currentScaleMax;
    if (marketCap < 1_000_000) newScaleMax = 1_000_000;
    else if (marketCap < 10_000_000) newScaleMax = 10_000_000;
    else if (marketCap < 100_000_000) newScaleMax = 100_000_000;
    else newScaleMax = 1_000_000_000;

    if (newScaleMax !== currentScaleMax) {
      currentScaleMax = newScaleMax;
      showHolographicNotification(`⚙️ Nouvelle échelle → ${formatUSD(currentScaleMax)}`, "#00ffff");
      if (milestoneGoal) milestoneGoal.textContent = formatUSD(currentScaleMax);
    }

    const percent = Math.min(100, (marketCap / currentScaleMax) * 100);
    if (marketCapBar) {
      marketCapBar.style.width = `${percent.toFixed(2)}%`;
      marketCapBar.style.transition = "width 1.2s ease-out";
    }

    const formattedCap = formatUSD(marketCap);
    const formattedVol = formatUSD(volume);

    if (progressText) progressText.textContent = `💰 MarketCap: ${formattedCap} | Volume 24h: ${formattedVol}`;
    if (marketCapLabel) marketCapLabel.textContent = formattedCap;

    const tx = pair.txns || {};
    const m5 = tx.m5 || { buys: 0, sells: 0, volume: 0 };
    const priceChange5m = pair.priceChange?.m5 || 0;

    if (m5.buys > 0 && m5.volume > 10_000) {
      showHolographicNotification(`🐋 Whale Buy — ${m5.buys} tx | $${m5.volume.toLocaleString()} /5min`, "#00bfff");
    }

    if (Math.abs(priceChange5m) >= 5) {
      const symbol = priceChange5m > 0 ? "📈" : "📉";
      const color = priceChange5m > 0 ? "#00ff9c" : "#ff4d6d";
      showHolographicNotification(`${symbol} ${priceChange5m > 0 ? "+" : ""}${priceChange5m.toFixed(2)}% (5min)`, color);
    }

    lastMarketCap = marketCap;
  } catch (err) {
    console.warn("⚠️ Erreur DexScreener:", err);
  }
}

// =============================================================
// 💲 HELPERS
// =============================================================
function formatUSD(num) {
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

// 🔁 Rafraîchit toutes les 10s
setInterval(syncMarketCap, 10000);
syncMarketCap();
