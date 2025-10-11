// === Feed Pulse — Client WebSocket ===
// Fonctionne avec feed.html (ids: chat-log, message, send)
// ET avec la modale index.html (ids: feedChatLog, feedMessage, feedSendBtn)

const WS_URL = "ws://localhost:8080"; // change en prod vers wss://ton-domaine

// -- Sélection des éléments (fallback entre page et modale)
const log =
  document.getElementById("chat-log") ||
  document.getElementById("feedChatLog");

const input =
  document.getElementById("message") ||
  document.getElementById("feedMessage");

const sendBtn =
  document.getElementById("send") ||
  document.getElementById("feedSendBtn");

// === Contrôle de l'accès au feed selon la connexion ===
const isLoggedIn = !!localStorage.getItem("username");

if (!isLoggedIn) {
  input.setAttribute("disabled", "true");
  input.placeholder = "Connecte-toi pour pulser le Core...";
  sendBtn.setAttribute("disabled", "true");
  sendBtn.style.opacity = "0.5";
  sendBtn.style.cursor = "not-allowed";

  // Notif si un non-connecté essaie d’écrire
  input.addEventListener("focus", () => {
    if (typeof showFeedNotification === "function") {
      showFeedNotification("🔒 Connecte-toi pour rejoindre le flux du Core");
    } else {
      console.log("🔒 Connecte-toi pour rejoindre le flux du Core");
    }
    input.blur();
  });
} else {
  input.removeAttribute("disabled");
  sendBtn.removeAttribute("disabled");
  sendBtn.style.opacity = "1";
  sendBtn.style.cursor = "pointer";
}


// Sécurité: si l'UI n'est pas présente, on sort proprement
if (!log || !input || !sendBtn) {
  console.warn(
    "[FeedPulse] UI introuvable (log/input/send). Vérifie les IDs ou le chargement du DOM."
  );
}

// --- Helper notif (utilise showFeedNotification si dispo)
function notify(msg) {
  if (typeof window.showFeedNotification === "function") {
    window.showFeedNotification(msg);
  } else {
    console.log("[FeedPulse]", msg);
  }
}

// --- Ajoute un message dans le flux
function appendMessage(user, text) {
  if (!log) return;
  const row = document.createElement("div");
  row.className = "message";

  // Pseudo cliquable vers le profil
  const userEl = document.createElement("span");
  userEl.className = "feed-username";
  userEl.textContent = user || "Anonyme";
  userEl.style.cursor = "pointer";
  userEl.onclick = () => {
    const u = user || "Anonyme";
    window.location.href = `profile.html?user=${encodeURIComponent(u)}`;
  };

  const sep = document.createElement("span");
  sep.textContent = " → ";

  const txt = document.createElement("span");
  txt.className = "feed-text";
  txt.textContent = text;

  row.appendChild(userEl);
  row.appendChild(sep);
  row.appendChild(txt);

  log.appendChild(row);
  // Scroll smooth vers le bas
  row.scrollIntoView({ behavior: "smooth", block: "end" });
}

// --- Connexion WebSocket
let socket;
function connectWS() {
  socket = new WebSocket(WS_URL);

  socket.addEventListener("open", () => {
    console.log("%c[FeedPulse] Connecté au Core", "color:#00ff9c");
  });

  socket.addEventListener("message", (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload?.type === "message" && payload?.data) {
        appendMessage(payload.data.user, payload.data.text);
        // petit pulse visuel si l’élément existe (optionnel)
        const marketCap = document.getElementById("marketCap");
        if (marketCap) {
          marketCap.classList.add("milestone-flash");
          setTimeout(() => marketCap.classList.remove("milestone-flash"), 600);
        }
      }
    } catch (e) {
      console.warn("[FeedPulse] message non JSON:", event.data);
    }
  });

  socket.addEventListener("close", () => {
    console.warn("[FeedPulse] WS fermé. Reconnexion dans 2s…");
    setTimeout(connectWS, 2000);
  });

  socket.addEventListener("error", (e) => {
    console.error("[FeedPulse] WS error:", e);
  });
}
connectWS();

// --- Envoi d’un message (protégé par l’état de connexion)
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

// --- Bind des actions UI
if (sendBtn) {
  sendBtn.addEventListener("click", sendCurrentMessage);
}

if (input) {
  // Enter = envoyer / Shift+Enter = nouvelle ligne (si textarea)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      // si c'est un <input type="text">, y'a pas de nouvelle ligne de toute façon
      e.preventDefault();
      sendCurrentMessage();
    }
  });
}

// --- Lecture seule si non connecté + notif si focus
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
  }
}



// Appel initial + expose une API simple si tu veux rafraîchir après login
updateWriteAccess();
window.refreshFeedWriteAccess = updateWriteAccess;

// Si login se fait dans un autre onglet, on réagit au changement localStorage
window.addEventListener("storage", (e) => {
  if (e.key === "username") updateWriteAccess();
});

// =============================================================
// === CONTRÔLE INTELLIGENT D’ACCÈS AU FEED PULSE
// =============================================================

// Fonction appelée à chaque connexion / déconnexion
window.refreshFeedWriteAccess = function () {
  const feedMsg = document.getElementById("feedMessage");
  const feedBtn = document.getElementById("feedSendBtn");
  const isLoggedIn = !!localStorage.getItem("username");

  if (!feedMsg || !feedBtn) return;

  if (isLoggedIn) {
    // ✅ Utilisateur connecté → on active le feed
    feedMsg.removeAttribute("disabled");
    feedMsg.placeholder = "Tape ton message et pulse le Core...";
    feedBtn.removeAttribute("disabled");
    feedBtn.style.opacity = "1";
    feedBtn.style.cursor = "pointer";
  } else {
    // 🔒 Utilisateur non connecté → on désactive l’écriture
    feedMsg.setAttribute("disabled", "true");
    feedMsg.placeholder = "Connecte-toi pour pulser le Core...";
    feedBtn.setAttribute("disabled", "true");
    feedBtn.style.opacity = "0.5";
    feedBtn.style.cursor = "not-allowed";
  }
};

// =============================================================
// === NOTIFICATION UNIQUEMENT SI NON CONNECTÉ
// =============================================================
const feedMessage = document.getElementById("feedMessage");
if (feedMessage) {
  feedMessage.addEventListener("focus", () => {
    if (!localStorage.getItem("username")) {
      if (window.showFeedNotification)
        showFeedNotification("🔒 Connecte-toi pour rejoindre le flux du Core");
      feedMessage.blur(); // empêche d'écrire
    }
  });
}

