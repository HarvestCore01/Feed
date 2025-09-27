// === account.js ===
import { calculateLevel } from './level.js';

// Login utilisateur
export function login() {
  const username = prompt("Entrez votre pseudo :");
  const password = prompt("Entrez votre mot de passe :");

  let users = JSON.parse(localStorage.getItem("users") || "{}");

  if (users[username] && users[username].password === password) {
    alert(`Bienvenue ${username} !`);
    return username;
  } else {
    alert("❌ Identifiants incorrects.");
    return null;
  }
}

// Création d'un nouveau compte
export function createAccount() {
  const username = prompt("Choisissez un pseudo :");
  const password = prompt("Choisissez un mot de passe :");

  if (!username || !password) return alert("Pseudo et mot de passe requis.");

  let users = JSON.parse(localStorage.getItem("users") || "{}");

  if (users[username]) return alert("❌ Ce pseudo est déjà utilisé.");

  users[username] = { password, feed: 0, level: 1 };
  localStorage.setItem("users", JSON.stringify(users));

  alert("✅ Compte créé avec succès !");
}

export function updateUserInfo(username) {
  const users = JSON.parse(localStorage.getItem("users") || "{}");
  const user = users[username];
  if (!user) return;

  // Sécurité : vérifier si les éléments existent avant de les manipuler
  const pseudoEl = document.getElementById("userPseudo");
  const levelEl = document.getElementById("userLevel");
  const feedEl = document.getElementById("userFeed");
  const rankEl = document.getElementById("userRank");
  const nextDiffEl = document.getElementById("userNextDiff");

  if (!pseudoEl || !levelEl || !feedEl || !rankEl || !nextDiffEl) {
    console.warn("updateUserInfo appelé mais les éléments du DOM n'existent pas encore.");
    return;
  }

  // Mise à jour des infos
  pseudoEl.textContent = username;
  levelEl.textContent = user.level;
  feedEl.textContent = user.feed;
  rankEl.textContent = user.rank || "Non classé";
  nextDiffEl.textContent = user.nextDiff || 0;


  // Calcul du niveau
  user.level = calculateLevel(user.feed);
  localStorage.setItem("users", JSON.stringify(users));

  // Affiche le bloc utilisateur
  document.getElementById("userInfo").style.display = "block";

  // Remplit les champs
  document.getElementById("userPseudo").textContent = currentUser;
  document.getElementById("userLevel").textContent = user.level;
  document.getElementById("userFeed").textContent = user.feed.toFixed(2);

  // Classement
  const sortedUsers = Object.entries(users).sort((a, b) => b[1].feed - a[1].feed);
  const rank = sortedUsers.findIndex(([name]) => name === currentUser) + 1;
  document.getElementById("userRank").textContent = rank;

  // Différence avec le joueur au-dessus
  if (rank > 1) {
    const aboveUserFeed = sortedUsers[rank - 2][1].feed;
    const diff = aboveUserFeed - user.feed;
    document.getElementById("userNextDiff").textContent = diff.toFixed(2);
  } else {
    document.getElementById("userNextDiff").textContent = "0.00";
  }
}
