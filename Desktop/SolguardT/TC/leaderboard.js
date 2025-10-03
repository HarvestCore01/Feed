// === leaderboard.js ===
// Gestion complète du classement Whales & Héros avec système de pop-up

// =============================================================
// 1. Fonction principale : mise à jour des deux classements
// =============================================================
export function updateLeaderboard(currentUser) {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const whalesBody = document.getElementById("whalesLeaderboardBody");
  const heroesBody = document.getElementById("heroesLeaderboardBody");

  if (!whalesBody || !heroesBody) return;

  // ====== CLASSEMENT WHALES (basé sur le Feed en SOL) ======
  const whalesSorted = Object.entries(users)
    .map(([name, data]) => ({
      username: name,
      feed: data.feed || 0,
      points: data.points || 0
    }))
    .sort((a, b) => b.feed - a.feed);

  renderTable(whalesSorted, whalesBody, currentUser, "feed");

  // ====== CLASSEMENT HÉROS (basé sur les Points sociaux) ======
  const heroesSorted = Object.entries(users)
    .map(([name, data]) => ({
      username: name,
      feed: data.feed || 0,
      points: data.points || 0
    }))
    .sort((a, b) => b.points - a.points);

  renderTable(heroesSorted, heroesBody, currentUser, "points");

  // ====== Affiche la position du joueur actuel ======
  const rankWhales = whalesSorted.findIndex(u => u.username === currentUser) + 1;
  const rankHeroes = heroesSorted.findIndex(u => u.username === currentUser) + 1;
  const leaderboardInfo = document.getElementById("leaderboardInfo");

  if (leaderboardInfo) {
    leaderboardInfo.textContent = rankWhales > 0 || rankHeroes > 0
      ? `Votre position : 🐋 #${rankWhales || "-"} | ⚡ #${rankHeroes || "-" }`
      : "Connectez-vous pour voir votre position dans le classement.";
  }
}

// =============================================================
// 2. Fonction pour générer le contenu d'un tableau dynamique
// =============================================================
function renderTable(sortedList, tbody, currentUser, key) {
  tbody.innerHTML = "";

  sortedList.forEach((user, index) => {
    const tr = document.createElement("tr");

    // ===== Classe prestige =====
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

    // ===== Glow spécial pour le top 3 =====
    if (index === 0) tr.classList.add("top1");
    else if (index === 1) tr.classList.add("top2");
    else if (index === 2) tr.classList.add("top3");

    // ===== Mise en évidence du joueur actuel =====
    if (user.username === currentUser) {
      tr.style.backgroundColor = "rgba(0, 255, 156, 0.2)";
    }

    // ===== Contenu de la ligne =====
    tr.innerHTML = `
      <td style="padding:6px; text-align:center;">${index + 1}</td>
      <td style="padding:6px;">
        <span class="username">${user.username}</span>
        <span class="rank-badge ${rankClass}" style="margin-left:8px;">${rankTitle}</span>
      </td>
      <td style="padding:6px; text-align:right;">${(user[key] || 0).toFixed(2)}</td>
    `;

    // ===== Récupération des infos pour le pop-up =====
    tr.classList.add("leaderboard-row");
    tr.dataset.username = user.username;
    tr.dataset.feed = user.feed;
    tr.dataset.points = user.points;
    tr.dataset.rank = index + 1;

    // Ouvre le pop-up au clic
    tr.addEventListener("click", () => {
      openPlayerPopup({
        username: user.username,
        feed: user.feed,
        points: user.points,
        rank: index + 1
      });
    });

    tbody.appendChild(tr);
  });
}

// =============================================================
// 3. Fonction pour ouvrir le pop-up d'un joueur
// =============================================================
function openPlayerPopup(user) {
  const popup = document.getElementById("playerPopup");
  if (!popup) {
    console.warn("⚠️ Aucun élément #playerPopup trouvé sur cette page.");
    return;
  }

  const popupUsername = document.getElementById("popupUsername");
  const popupFeed = document.getElementById("popupFeed");
  const popupPoints = document.getElementById("popupPoints");
  const popupRank = document.getElementById("popupRank");
  const popupMessage = document.getElementById("popupMessage");

  if (popupUsername) popupUsername.textContent = user.username;
  if (popupFeed) popupFeed.textContent = user.feed.toFixed(2);
  if (popupPoints) popupPoints.textContent = user.points || 0;
  if (popupRank) popupRank.textContent = user.rank || "-";

  // ===== Message dynamique en fonction du profil =====
  if (popupMessage) {
    if (user.feed > 50000) {
      popupMessage.textContent = "Cette Whale domine par sa puissance financière.";
    } else if (user.points > 100) {
      popupMessage.textContent = "Un héros qui propage la voix du Core Feed.";
    } else {
      popupMessage.textContent = "Ce joueur est encore discret, mais il a du potentiel.";
    }
  }

  // Active l'affichage
  popup.classList.add("active");
  document.body.style.overflow = "hidden"; // bloque le scroll en arrière-plan
}

// =============================================================
// 4. Fonction pour fermer le pop-up
// =============================================================
function closePlayerPopup() {
  const popup = document.getElementById("playerPopup");
  if (popup) {
    popup.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

// =============================================================
// 5. Gestion des événements pour fermer le pop-up
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  const closePopupEl = document.getElementById("closePopup");
  const closePopupBtnEl = document.getElementById("closePopupBtn");
  const popup = document.getElementById("playerPopup");

  if (closePopupEl) closePopupEl.addEventListener("click", closePlayerPopup);
  if (closePopupBtnEl) closePopupBtnEl.addEventListener("click", closePlayerPopup);

  // Fermer le pop-up en cliquant sur l'overlay
  if (popup) {
    popup.addEventListener("click", (e) => {
      if (e.target === popup) closePlayerPopup();
    });
  }
});
