// === leaderboard.js ===
// Gestion du classement mondial

// Seuil de déblocage du leaderboard
const LEADERBOARD_UNLOCK_THRESHOLD = 10000; // Débloqué à 10 000 SOL
let leaderboardUnlocked = false; // Empêche l'affichage multiple du message

/**
 * Vérifie si le leaderboard doit être affiché ou non
 * @param {number} marketCap - Capitalisation actuelle
 */


export function checkLeaderboardUnlock(marketCap) {
  const section = document.getElementById("leaderboardSection");
  const flashMessage = document.getElementById("leaderboardUnlockMessage");

  if (!section || !flashMessage) return;

  if (marketCap >= LEADERBOARD_UNLOCK_THRESHOLD) {
    if (!leaderboardUnlocked) {
      leaderboardUnlocked = true;

      // Affiche la section
      section.style.display = "block";

      // Animation flash lors du déblocage
      section.classList.add("flash-unlock");

      // Message dynamique
      flashMessage.textContent = "🌐 Le classement mondial est maintenant ouvert !";
      flashMessage.style.display = "block";

      // Masque le message après 3 secondes
      setTimeout(() => {
        flashMessage.style.display = "none";
        section.classList.remove("flash-unlock");
      }, 3000);
    }
  } else {
    section.style.display = "none";
    leaderboardUnlocked = false;
  }
}

/**
 * Met à jour l'affichage du leaderboard
 * @param {string} currentUser - Nom de l'utilisateur actuellement connecté
 */
export function updateLeaderboard(currentUser) {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const leaderboardBody = document.getElementById("leaderboardBody");

  if (!leaderboardBody) return;

  // Trie les joueurs par feed décroissant
  const sortedUsers = Object.entries(users)
    .map(([name, data]) => ({
      username: name,
      feed: data.feed || 0
    }))
    .sort((a, b) => b.feed - a.feed);

  leaderboardBody.innerHTML = "";

  sortedUsers.forEach((user, index) => {
    const tr = document.createElement("tr");

    // ======= Gestion des rangs prestige =======
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

    // ======= Glow spécial pour le top 3 =======
    if (index === 0) tr.classList.add("top1");
    else if (index === 1) tr.classList.add("top2");
    else if (index === 2) tr.classList.add("top3");

    // Met en évidence l'utilisateur actuel
    if (user.username === currentUser) {
      tr.style.backgroundColor = "rgba(0, 255, 156, 0.2)";
    }

    // Contenu du tableau
    tr.innerHTML = `
      <td style="padding:6px; text-align:center;">${index + 1}</td>
      <td style="padding:6px;">
        ${user.username}
        <span class="rank-title ${rankClass}" style="margin-left:8px;">
          ${rankTitle}
        </span>
      </td>
      <td style="padding:6px; text-align:right;">
        ${user.feed.toFixed(2)}
      </td>
    `;

    leaderboardBody.appendChild(tr);
  });

  // ======= Affiche la position du joueur actuel =======
  const rank = sortedUsers.findIndex(u => u.username === currentUser) + 1;
  const leaderboardInfo = document.getElementById("leaderboardInfo");

  if (leaderboardInfo) {
    leaderboardInfo.textContent = rank > 0
      ? `Votre position : #${rank} - Continuez à feed pour grimper !`
      : "Connectez-vous pour voir votre position dans le classement.";
  }
}
