// =============================================================
// === FEED PULSE — WebSocket Universel (Page + Modale) ===
// =============================================================

import { auth } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// =============================================================
// === Rechargement automatique du profil Firebase ===
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      await user.reload();
      console.log("🔁 Profil Firebase rechargé :", user.displayName || user.email);
    } catch (e) {
      console.warn("⚠️ Impossible de recharger le profil Firebase :", e);
    }
  }
});

// =============================================================
// === Paramètres WebSocket ===
const WS_URL = "ws://localhost:8080"; // à remplacer par wss://ton-domaine en prod

// =============================================================
// === Sélection dynamique des éléments ===
function getFeedElements() {
  return {
    log:
      document.getElementById("chat-log") ||
      document.getElementById("feedChatLog"),
    input:
      document.getElementById("message") ||
      document.getElementById("feedMessage"),
    sendBtn:
      document.getElementById("send") ||
      document.getElementById("feedSendBtn"),
  };
}

// =============================================================
// === Indicateur de statut WS ===
function createStatusIndicator() {
  const el = document.createElement("div");
  el.id = "feedStatus";
  el.textContent = "⏳ Connexion...";
  el.style.cssText = `
    position:fixed;
    bottom:10px;
    right:10px;
    font-size:12px;
    color:#aaa;
    background:#111;
    padding:4px 8px;
    border-radius:8px;
    opacity:0.8;
    z-index:9999;
  `;
  document.body.appendChild(el);
  return el;
}

const statusEl =
  document.getElementById("feedStatus") || createStatusIndicator();

function updateStatusIndicator(text, color) {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.style.color = color;
}

// =============================================================
// === Notifications holographiques ===
let lastNotif = "";
let lastNotifTime = 0;

function showFeedNotification(message, duration = 3000) {
  const now = Date.now();
  if (message === lastNotif && now - lastNotifTime < 1000) return;
  lastNotif = message;
  lastNotifTime = now;

  const container = document.getElementById("feedNotificationContainer");
  if (!container) return;

  const notif = document.createElement("div");
  notif.className = "feed-notif";
  notif.textContent = message;
  container.appendChild(notif);
  requestAnimationFrame(() => notif.classList.add("active"));
  setTimeout(() => {
    notif.classList.remove("active");
    notif.classList.add("hide");
    setTimeout(() => notif.remove(), 500);
  }, duration);
}

window.showFeedNotification = showFeedNotification;

// =============================================================
// === Son pour nouveaux messages ===
function playPing() {
  try {
    const audio = new Audio("/assets/notification.mp3"); // son local conseillé
    audio.volume = 0.3;
    audio.play().catch(() => {
      console.warn("[FeedPulse] Audio bloqué par le navigateur (autoplay)");
    });
  } catch (e) {
    console.warn("[FeedPulse] Erreur lecture audio :", e);
  }
}

// =============================================================
// === Récupération du pseudo utilisateur ===
function getUserPseudo(user) {
  if (!user) return "Anonyme";
  if (user.displayName && user.displayName.trim() !== "") {
    return user.displayName.trim();
  } else if (user.email) {
    return user.email.split("@")[0];
  }
  return "Anonyme";
}

// =============================================================
// === Rendu d’un message ===
function appendMessage(user, text) {
  const { log } = getFeedElements();
  if (!log) return;

  const currentUser = getUserPseudo(auth.currentUser);
  const isOwn = user === currentUser;

  const row = document.createElement("div");
  row.className = "feed-message";
  if (isOwn) row.classList.add("own-message");

  const userEl = document.createElement("span");
  userEl.className = "feed-username";
  userEl.textContent = user || "Anonyme";
  userEl.onclick = () => {
    window.location.href = `profile.html?user=${encodeURIComponent(
      user || "Anonyme"
    )}`;
  };

  const txt = document.createElement("span");
  txt.className = "feed-text";
  txt.textContent = ` → ${text}`;

  const timeEl = document.createElement("span");
  timeEl.className = "feed-time";
  const now = new Date();
  timeEl.textContent = ` (${now
    .getHours()
    .toString()
    .padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")})`;

  row.appendChild(userEl);
  row.appendChild(txt);
  row.appendChild(timeEl);
  log.appendChild(row);

  if (isOwn) {
    row.style.transition = "background 0.6s ease";
    row.style.background = "rgba(0,255,156,0.1)";
    setTimeout(() => (row.style.background = "transparent"), 600);
  }

  if (!isOwn) playPing();
  row.scrollIntoView({ behavior: "smooth", block: "end" });
}

// =============================================================
// === Sauvegarde locale ===
function saveMessagesToLocal(messages) {
  try {
    localStorage.setItem(
      "feedMessagesCache",
      JSON.stringify(messages.slice(-50))
    );
  } catch (e) {
    console.warn("[FeedPulse] Erreur sauvegarde locale :", e);
  }
}

function loadMessagesFromLocal() {
  try {
    const raw = localStorage.getItem("feedMessagesCache");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// =============================================================
// === Typing Indicator (User typing...) ===
let typingUsers = new Set();
let typingIndicator;

document.addEventListener("DOMContentLoaded", () => {
  typingIndicator = document.createElement("div");
  typingIndicator.id = "feedTypingIndicator";
  typingIndicator.style.cssText = `
    text-align:center;
    color:#00ff9c;
    font-size:0.9rem;
    margin:6px 0;
    opacity:0;
    transition: opacity 0.3s ease;
  `;
  const { input } = getFeedElements();
  if (input && input.parentNode) {
    input.parentNode.insertBefore(typingIndicator, input);
  } else {
    document.body.appendChild(typingIndicator);
  }
});

function updateTypingIndicator() {
  if (typingUsers.size === 0) {
    typingIndicator.textContent = "";
    typingIndicator.style.opacity = "0";
  } else {
    typingIndicator.textContent =
      "💬 " +
      Array.from(typingUsers).join(", ") +
      (typingUsers.size > 1 ? " pulsent..." : " pulse...");
    typingIndicator.style.opacity = "1";
  }
}

let typingTimeout;
function notifyTyping() {
  clearTimeout(typingTimeout);
  const user = auth.currentUser;
  if (!user || !socket || socket.readyState !== WebSocket.OPEN) return;

  const pseudo = getUserPseudo(user);
  socket.send(JSON.stringify({ type: "typing", user: pseudo }));

  typingTimeout = setTimeout(() => {
    socket.send(JSON.stringify({ type: "stop_typing", user: pseudo }));
  }, 3000);
}

// =============================================================
// === WebSocket ===
let socket;
let cachedMessages = loadMessagesFromLocal();

function connectWS() {
  socket = new WebSocket(WS_URL);
  updateStatusIndicator("⏳ Connexion...", "#aaa");

  socket.addEventListener("open", () => {
    console.log("%c[FeedPulse] Connecté au Core", "color:#00ff9c");
    updateStatusIndicator("🟢 Connecté", "#00ff9c");

    const { log } = getFeedElements();
    if (cachedMessages.length && log) {
      log.innerHTML = "";
      cachedMessages.forEach((msg) => appendMessage(msg.user, msg.text));
    }
  });

  socket.addEventListener("message", (event) => {
    try {
      const payload = JSON.parse(event.data);

      if (payload.type === "user_typing") {
        typingUsers.add(payload.user);
        updateTypingIndicator();
        return;
      }

      if (payload.type === "user_stop_typing") {
        typingUsers.delete(payload.user);
        updateTypingIndicator();
        return;
      }

      if (payload?.type === "history" && Array.isArray(payload.data)) {
        const { log } = getFeedElements();
        if (log) log.innerHTML = "";
        payload.data.forEach((msg) => appendMessage(msg.user, msg.text));
        return;
      }

      if (payload?.type === "message" && payload?.data) {
        appendMessage(payload.data.user, payload.data.text);
        cachedMessages.push(payload.data);
        saveMessagesToLocal(cachedMessages);
      }
    } catch {
      console.warn("[FeedPulse] Message non JSON:", event.data);
    }
  });

  socket.addEventListener("close", () => {
    updateStatusIndicator("🔴 Déconnecté — reconnexion...", "#ff4b4b");
    setTimeout(connectWS, 2000);
  });
}

connectWS();

// =============================================================
// === Envoi d’un message ===
function sendCurrentMessage() {
  const { input } = getFeedElements();
  const text = (input?.value || "").trim();
  if (!text) return;

  const user = auth.currentUser;
  if (!user) {
    showFeedNotification("🔒 Connecte-toi pour pulser le Core");
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    showFeedNotification(
      "⚠️ Connexion au Core en cours… réessaie dans un instant"
    );
    return;
  }

  const username = getUserPseudo(user);
  const msg = { type: "new_message", user: username, text };
  socket.send(JSON.stringify(msg));
  input.value = "";

  socket.send(JSON.stringify({ type: "stop_typing", user: username }));
}

// =============================================================
// === Bind UI ===
function bindFeedUI() {
  const { sendBtn, input } = getFeedElements();
  if (sendBtn) sendBtn.onclick = sendCurrentMessage;
  if (input) {
    input.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendCurrentMessage();
      } else {
        notifyTyping();
      }
    };
  }
}
bindFeedUI();

// =============================================================
// === FEED MODAL HANDLER ===
document.addEventListener("DOMContentLoaded", () => {
  const feedPulseBtn = document.getElementById("feedPulseBtn");
  const feedModal = document.getElementById("feedModal");
  const openFeedPageBtn = document.getElementById("openFeedPage");

  if (feedPulseBtn && feedModal) {
    let overlay = document.getElementById("feedOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "feedOverlay";
      overlay.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        z-index: 998;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(overlay);
    }

    feedPulseBtn.addEventListener("click", () => {
      overlay.style.display = "block";
      feedModal.style.display = "block";
      feedModal.style.position = "fixed";
      feedModal.style.top = "50%";
      feedModal.style.left = "50%";
      feedModal.style.transform = "translate(-50%, -50%) scale(1)";
      feedModal.style.zIndex = "999";
      feedModal.style.maxHeight = "90vh";
      feedModal.style.overflow = "hidden";
      feedModal.style.opacity = "0";
      document.body.style.overflow = "hidden";

      requestAnimationFrame(() => {
        overlay.style.opacity = "1";
        feedModal.style.opacity = "1";
      });

      setTimeout(bindFeedUI, 150);
    });

    const closeModal = () => {
      feedModal.style.opacity = "0";
      overlay.style.opacity = "0";
      setTimeout(() => {
        feedModal.style.display = "none";
        overlay.style.display = "none";
        document.body.style.overflow = "";
      }, 250);
    };

    overlay.addEventListener("click", closeModal);
    const closeBtn = feedModal.querySelector(".close");
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
  }

  if (openFeedPageBtn) {
    openFeedPageBtn.addEventListener("click", () => {
      window.location.href = "feed.html";
    });
  }
});

// =============================================================
// === Synchro Auth Firebase ===
auth.onAuthStateChanged((user) => {
  const { input, sendBtn } = getFeedElements();
  if (!input || !sendBtn) return;

  if (user) {
    input.disabled = false;
    sendBtn.disabled = false;
    input.placeholder = "Pulse ton message...";
    console.log(
      "%c[FeedPulse] Connecté en tant que " + getUserPseudo(user),
      "color:#00ff9c"
    );
  } else {
    input.disabled = true;
    sendBtn.disabled = true;
    input.placeholder = "Connecte-toi pour pulser le Core...";
    console.log("%c[FeedPulse] Non connecté", "color:#ff4b4b");
  }
});
