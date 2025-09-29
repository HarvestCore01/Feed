export function updateLeaderboard(currentUser) {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const whalesBody = document.getElementById("whalesLeaderboardBody");
  const heroesBody = document.getElementById("heroesLeaderboardBody");

  if (!whalesBody || !heroesBody) return;

  // ====== CLASSEMENT WHALES (Feed en SOL) ======
  const whalesSorted = Object.entries(users)
    .map(([name, data]) => ({
      username: name,
      feed: data.feed || 0,
      points: data.points || 0
    }))
    .sort((a, b) => b.feed - a.feed);

  renderTable(whalesSorted, whalesBody, currentUser, "feed");

  // ====== CLASSEMENT HÉROS (Points sociaux) ======
  const heroesSorted = Object.entries(users)
    .map(([name, data]) => ({
      username: name,
      feed: data.feed || 0,
      points: data.points || 0
    }))
    .sort((a, b) => b.points - a.points);

  renderTable(heroesSorted, heroesBody, currentUser, "points");

  // ======= Affiche la position du joueur actuel =======
  const rankWhales = whalesSorted.findIndex(u => u.username === currentUser) + 1;
  const rankHeroes = heroesSorted.findIndex(u => u.username === currentUser) + 1;
  const leaderboardInfo = document.getElementById("leaderboardInfo");

  if (leaderboardInfo) {
    leaderboardInfo.textContent = rankWhales > 0 || rankHeroes > 0
      ? `Votre position : 🐋 #${rankWhales || "-"} | ⚡ #${rankHeroes || "-" }`
      : "Connectez-vous pour voir votre position dans le classement.";
  }

  // Initialise le gestionnaire du popup
  initPopup(users, whalesSorted, heroesSorted);
}

/**
 * Génère un tableau dynamique
 */
function renderTable(sortedList, tbody, currentUser, key) {
  tbody.innerHTML = "";

  sortedList.forEach((user, index) => {
    const tr = document.createElement("tr");

    // Classe prestige
    let rankTitle = "";
    let rankClass = "";
    if (index < 10) {
      rankTitle = "Architecte du Core";
      rankClass = "rank-architecte";
    } else if (index < 100) {
      rankTitle = "Élu";
      rankClass = "rank-elu";
    } else {
      rankTitle = "Feedeur";
      rankClass = "rank-feedeur";
    }

    // Glow top 3
    if (index === 0) tr.classList.add("top1");
    else if (index === 1) tr.classList.add("top2");
    else if (index === 2) tr.classList.add("top3");

    // Mise en avant du joueur actuel
    if (user.username === currentUser) {
      tr.style.backgroundColor = "rgba(0, 255, 156, 0.2)";
    }

    // Ligne
    tr.innerHTML = `
      <td style="padding:6px; text-align:center;">${index + 1}</td>
      <td style="padding:6px;">
        <span class="username">${user.username}</span>
        <span class="rank-badge ${rankClass}" style="margin-left:8px;">${rankTitle}</span>
      </td>
      <td style="padding:6px; text-align:right;">${(user[key] || 0).toFixed(2)}</td>
    `;

    // ✅ Ouverture du popup au clic
    tr.classList.add("leaderboard-row");
    tr.dataset.username = user.username;
    tr.addEventListener("click", () => {
      openPlayerPopup(user.username, user.feed, user.points, index + 1);
    });

    tbody.appendChild(tr);
  });
}

/**
 * Ouvre le pop-up avec les infos du joueur
 */
function openPlayerPopup(username, feed, points, rank) {
  const popup = document.getElementById("playerPopup");
  document.getElementById("popupUsername").textContent = username;
  document.getElementById("popupFeed").textContent = feed.toFixed(2);
  document.getElementById("popupPoints").textContent = points.toFixed(0);
  document.getElementById("popupRank").textContent = "#" + rank;

  // Message dynamique
  const message = feed > points
    ? "Cette Whale domine par sa puissance financière."
    : "Ce héros se distingue par son engagement social.";
  document.getElementById("popupMessage").textContent = message;

  popup.classList.add("active");
}

/**
 * Initialise le pop-up et gère sa fermeture
 */
function initPopup() {
  const popup = document.getElementById("playerPopup");
  const closePopup = document.getElementById("closePopup");

  if (!popup || !closePopup) return;

  // Fermer au clic sur le bouton X
  closePopup.addEventListener("click", () => {
    popup.classList.remove("active");
  });

  // Fermer au clic à l'extérieur du contenu
  popup.addEventListener("click", (e) => {
    if (e.target === popup) {
      popup.classList.remove("active");
    }
  });
}
