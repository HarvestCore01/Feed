// === leaderboard.js ===
// Gestion du classement mondial

// Valeur de déblocage modifiable
const LEADERBOARD_UNLOCK_THRESHOLD = 10000; // Débloqué à 10 000 SOL

let leaderboardUnlocked = false; // Pour éviter que le message se répète

// Vérifie si le leaderboard doit être affiché
export function checkLeaderboardUnlock(marketCap) {
  const section = document.getElementById("leaderboardSection");
  const flashMessage = document.getElementById("leaderboardUnlockMessage");

  if (!section || !flashMessage) return;

  // Quand on dépasse le seuil
  if (marketCap >= LEADERBOARD_UNLOCK_THRESHOLD) {
    if (!leaderboardUnlocked) {
      leaderboardUnlocked = true;

      // Affiche la section
      section.style.display = "block";

      // Animation flash
      section.classList.add("flash-unlock");

      // Message dynamique
      flashMessage.textContent = "🌐 Le classement mondial est maintenant ouvert !";
      flashMessage.style.display = "block";

      setTimeout(() => {
        flashMessage.style.display = "none";
        section.classList.remove("flash-unlock");
      }, 3000); // Le message disparaît après 3 secondes
    }
  } else {
    section.style.display = "none";
    leaderboardUnlocked = false;
  }
}

// Construit le tableau dynamique
export function updateLeaderboard(currentUser) {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const leaderboardBody = document.getElementById("leaderboardBody");

  if (!leaderboardBody) return;

  // Transforme l'objet en tableau et trie par feed décroissant
  const sortedUsers = Object.entries(users)
    .map(([name, data]) => ({
      username: name,
      feed: data.feed || 0
    }))
    .sort((a, b) => b.feed - a.feed);

  leaderboardBody.innerHTML = "";

  sortedUsers.forEach((user, index) => {
    const tr = document.createElement("tr");

    // Surligne le joueur actuel
    if (user.username === currentUser) {
      tr.style.backgroundColor = "rgba(0, 255, 156, 0.2)";
    }

    tr.innerHTML = `
      <td style="padding:6px; text-align:center;">${index + 1}</td>
      <td style="padding:6px;">${user.username}</td>
      <td style="padding:6px; text-align:right;">${user.feed.toFixed(2)}</td>
    `;

    leaderboardBody.appendChild(tr);
  });

  // Affiche la position du joueur
  const rank = sortedUsers.findIndex(u => u.username === currentUser) + 1;
  const leaderboardInfo = document.getElementById("leaderboardInfo");
  if (rank > 0) {
    leaderboardInfo.textContent = `Votre position : #${rank} - Continuez à feed pour grimper !`;
  } else {
    leaderboardInfo.textContent = "Connectez-vous pour voir votre position dans le classement.";
  }
}
