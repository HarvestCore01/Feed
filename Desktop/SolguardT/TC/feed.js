// =============================================================
// === Feed Pulse — WebSocket Universel (Modale + Page) ===
// =============================================================

const WS_URL = "ws://localhost:8080"; // 🔗 à remplacer en prod

// =============================================================
// === Sélection des éléments universels ===
const log =
  document.getElementById("chat-log") ||
  document.getElementById("feedChatLog");

const input =
  document.getElementById("message") ||
  document.getElementById("feedMessage");

const sendBtn =
  document.getElementById("send") ||
  document.getElementById("feedSendBtn");

const statusEl =
  document.getElementById("feedStatus") || createStatusIndicator();

if (!log || !input || !sendBtn) {
  console.warn("[FeedPulse] UI introuvable. Vérifie les IDs du DOM.");
}

// =============================================================
// === Gestion accès écriture selon connexion ===
function updateWriteAccess() {
  if (!input || !sendBtn) return;
  const isLoggedIn = !!localStorage.getItem("username");

  if (!isLoggedIn) {
    input.setAttribute("disabled", "true");
    input.placeholder = "Connecte-toi pour pulser le Core...";
    sendBtn.setAttribute("disabled", "true");
    sendBtn.style.opacity = "0.5";
    sendBtn.style.cursor = "not-allowed";

    input.addEventListener(
      "focus",
      () => {
        notify("🔒 Connecte-toi pour rejoindre le flux du Core");
        input.blur();
      },
      { once: true }
    );
  } else {
    input.removeAttribute("disabled");
    sendBtn.removeAttribute("disabled");
    sendBtn.style.opacity = "1";
    sendBtn.style.cursor = "pointer";
    input.placeholder = "Pulse ton message...";
  }
}

// =============================================================
// === Notifications universelles ===
function notify(msg) {
  if (typeof window.showFeedNotification === "function") {
    window.showFeedNotification(msg);
  } else {
    console.log("[FeedPulse]", msg);
  }
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

function updateStatusIndicator(text, color) {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.style.color = color;
}

// =============================================================
// === Ping sonore pour nouveaux messages ===
function playPing() {
  try {
    const audio = new Audio(
      "https://cdn.pixabay.com/download/audio/2022/03/15/audio_ae62d9e7d5.mp3?filename=notification-3-141424.mp3"
    );
    audio.volume = 0.3;
    audio.play();
  } catch (e) {
    console.warn("[FeedPulse] Impossible de jouer le son:", e);
  }
}

// =============================================================
// === Rendu unifié des messages (modale + plein écran) ===
function appendMessage(user, text) {
  if (!log) return;

  const currentUser = localStorage.getItem("username");
  const isOwn = user === currentUser;

  // Structure principale
  const row = document.createElement("div");
  row.className = "feed-message";
  if (isOwn) row.classList.add("own-message");

  // Colonne pseudo + texte
  const content = document.createElement("div");
  content.className = "feed-content";

  // Pseudo cliquable
  const userEl = document.createElement("span");
  userEl.className = "feed-username";
  userEl.textContent = user || "Anonyme";
  userEl.onclick = () => {
    window.location.href = `profile.html?user=${encodeURIComponent(user || "Anonyme")}`;
  };

  // Texte
  const txt = document.createElement("span");
  txt.className = "feed-text";
  txt.textContent = ` → ${text}`;

  // Heure
  const timeEl = document.createElement("span");
  timeEl.className = "feed-time";
  const now = new Date();
  timeEl.textContent = ` (${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")})`;

  // Assemblage
  content.appendChild(userEl);
  content.appendChild(txt);
  content.appendChild(timeEl);
  row.appendChild(content);
  log.appendChild(row);

  // Effet visuel
  if (isOwn) {
    row.style.transition = "background 0.6s ease";
    row.style.background = "rgba(0,255,156,0.1)";
    setTimeout(() => (row.style.background = "transparent"), 600);
  }

  // Son si ce n’est pas moi
  if (!isOwn) playPing();

  // Scroll smooth
  row.scrollIntoView({ behavior: "smooth", block: "end" });
}

// =============================================================
// === Connexion WS ===
let socket;

function connectWS() {
  socket = new WebSocket(WS_URL);
  updateStatusIndicator("⏳ Connexion...", "#aaa");

  socket.addEventListener("open", () => {
    console.log("%c[FeedPulse] Connecté au Core", "color:#00ff9c");
    updateStatusIndicator("🟢 Connecté", "#00ff9c");
  });

  socket.addEventListener("message", (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload?.type === "message" && payload?.data) {
        appendMessage(payload.data.user, payload.data.text);

        const marketCap = document.getElementById("marketCap");
        if (marketCap) {
          marketCap.classList.add("milestone-flash");
          setTimeout(() => marketCap.classList.remove("milestone-flash"), 600);
        }
      }
    } catch {
      console.warn("[FeedPulse] Message non JSON:", event.data);
    }
  });

  socket.addEventListener("close", () => {
    console.warn("[FeedPulse] WS fermé. Reconnexion dans 2s…");
    updateStatusIndicator("🔴 Déconnecté — reconnexion...", "#ff4b4b");
    setTimeout(connectWS, 2000);
  });

  socket.addEventListener("error", (err) => {
    console.error("[FeedPulse] Erreur WS:", err);
    updateStatusIndicator("⚠️ Erreur WS", "#ffb347");
  });
}

connectWS();

// =============================================================
// === Envoi d’un message ===
function sendCurrentMessage() {
  const text = (input?.value || "").trim();
  if (!text) return;

  const username = localStorage.getItem("username");
  if (!username) {
    notify("🔒 Connecte-toi pour pulser le Core");
    return;
  }

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    notify("⚠️ Connexion au Core en cours… réessaie dans un instant");
    return;
  }

  socket.send(
    JSON.stringify({
      type: "new_message",
      user: username,
      text,
    })
  );

  input.value = "";
}

// =============================================================
// === Bind des actions UI ===
if (sendBtn) sendBtn.addEventListener("click", sendCurrentMessage);
if (input) {
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendCurrentMessage();
    }
  });
}

// =============================================================
// === Synchro connexion / déconnexion ===
updateWriteAccess();
window.refreshFeedWriteAccess = updateWriteAccess;
window.addEventListener("storage", (e) => {
  if (e.key === "username") updateWriteAccess();
});
