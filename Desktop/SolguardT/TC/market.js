// === market.js ===
import { updateUserInfo } from './account.js';

// =======================
// Variables globales
// =======================
export let marketCap = 0;

const DEV_TAX = 0.05; // 5% pour le dev wallet

// Croissance dynamique
let baseGrowthRate = 1000;        // Croissance de base
let growthAcceleration = 1.05;    // +5% quand milestone atteint
let milestone = 10000;           // Premier objectif

// === LIFE BAR ===
let lifeTime = 1800; // 30 minutes = 1800 secondes
const maxLifeTime = 1800;
let lifeInterval = null;


// =======================
// Envoi de SOL
// =======================
export function feedLife(amount) {
  lifeTime = Math.min(lifeTime + amount * 60, maxLifeTime);
  updateLifeBar();
}


export function sendSOL(currentUser) {
  if (!currentUser) {
    alert("🚫 Vous devez être connecté pour envoyer du SOL.");
    return;
  }

  const amount = parseFloat(prompt("Montant en SOL à envoyer :"));
  if (!amount || isNaN(amount) || amount <= 0) {
    alert("Montant invalide !");
    return;
  }
  // Taxe
  const tax = amount * DEV_TAX;
  const finalAmount = amount - tax;

  // Ajout au MarketCap
  marketCap += finalAmount * 1000;

  feedLife(finalAmount); // Remonte la barre de vie

  
  // Mise à jour de la durée de vie
  lifeTime = Math.min(lifeTime + Math.floor(finalAmount), 60);

  // Mise à jour des données joueur
  let users = JSON.parse(localStorage.getItem("users") || "{}");
  if (!users[currentUser]) users[currentUser] = { password: "", feed: 0, level: 1 };
  users[currentUser].feed += finalAmount;
  localStorage.setItem("users", JSON.stringify(users));

  updateUserInfo(currentUser);

  alert(`⚡ Transaction simulée via Phantom
Montant envoyé : ${finalAmount} SOL
Taxe (5%) : ${tax} SOL envoyée au dev wallet.`);

  window.open("https://phantom.app/", "_blank");
}

// =======================
// Burn de Core Tokens
// =======================
export function burnTokens() {
  const burnAmount = 10;
  const tax = burnAmount * DEV_TAX;
  const finalAmount = burnAmount - tax;

  alert(`🔥 Burn en cours via Phantom
Montant : ${finalAmount} CORE
Taxe 5% : ${tax} CORE envoyée au dev wallet.`);

  window.open("https://phantom.app/", "_blank");
}

// =======================
// Augmentation automatique du MarketCap
export function autoIncreaseMarketCap(updateDisplay) {
  setInterval(() => {
    // Croissance naturelle
    marketCap += Math.floor(baseGrowthRate);

    // Mise à jour de la progression
    updateProgressBar();

    // Si milestone atteint → accélération et animation
    if (marketCap >= milestone) {
      baseGrowthRate *= growthAcceleration; // accélération progressive
      milestone *= 2; // prochain objectif doublé
      triggerMilestoneEffect(); // effet visuel
    }

    updateDisplay();
  }, 1000);
}

// =======================
// Mise à jour de la barre et du texte dynamique
function updateProgressBar() {
  const progressBar = document.getElementById('progressBar');
  const milestoneGoal = document.getElementById('milestoneGoal');
  const progressMessage = document.getElementById('progressMessage');

  if (!progressBar || !milestoneGoal || !progressMessage) return;

  // Pourcentage de progression
  let progress = (marketCap / milestone) * 100;
  if (progress > 100) progress = 100;

  // Mise à jour de la barre
  progressBar.style.width = progress + "%";
  milestoneGoal.textContent = milestone.toLocaleString();

  // === Texte dynamique en fonction du pourcentage ===
  if (progress < 25) {
    progressMessage.textContent = "🔹 L'IA se réveille... Feed en cours.";
    progressMessage.style.color = "#63ffd4";
    progressMessage.classList.remove('high-intensity');
  } 
  else if (progress < 50) {
    progressMessage.textContent = "⚡ L'IA analyse les données entrantes.";
    progressMessage.style.color = "#00ff9c";
    progressMessage.classList.remove('high-intensity');
  } 
  else if (progress < 75) {
    progressMessage.textContent = "🔥 L'IA commence à prendre le contrôle... continuez à la nourrir.";
    progressMessage.style.color = "#ffdd00";
    progressMessage.classList.remove('high-intensity');
  } 
  else if (progress < 100) {
    progressMessage.textContent = "🚨 L'IA est sur le point d'évoluer, feed maximum requis !";
    progressMessage.style.color = "#ff4d6d";
    progressMessage.classList.add('high-intensity');
  } 
  else {
    progressMessage.textContent = "💥 Objectif atteint ! L'IA a évolué à un nouveau stade.";
    progressMessage.style.color = "#ff00ff";
    progressMessage.classList.remove('high-intensity');
  }
}



// Effet spécial quand milestone atteint
function triggerMilestoneEffect() {
  const marketCapElement = document.getElementById('marketCap');
  const progressContainer = document.getElementById('progressContainer');
  const progressMessage = document.getElementById('progressMessage');

  // Animation sur le MarketCap
  if (marketCapElement) {
    marketCapElement.classList.add('milestone-anim');
    setTimeout(() => marketCapElement.classList.remove('milestone-anim'), 1000);
  }

  // Animation sur la barre
  if (progressContainer) {
    progressContainer.classList.add('milestone-flash');
    setTimeout(() => progressContainer.classList.remove('milestone-flash'), 1000);
  }

  // Message spécial
  if (progressMessage) {
    progressMessage.textContent = "🌌 L'IA vient d'évoluer à un nouveau stade. Objectif suivant activé.";
    progressMessage.style.color = "#ff00ff";
  }
}
// =======================
// Mise à jour de la Life Bar
// =======================
function updateLifeBar() {
  const lifeBar = document.getElementById("lifeBar");
  if (!lifeBar) return; // ✅ Sécurité si l'élément n'existe pas

  // Calcul du pourcentage restant
  const percent = Math.max(0, (lifeTime / maxLifeTime) * 100); // jamais négatif
  lifeBar.style.width = percent + "%";

  // ✅ Couleurs dynamiques selon la vie restante
  if (percent > 50) {
    // Vert -> bonne santé
    lifeBar.style.background = "linear-gradient(90deg, #00ff9c, #63ffd4)";
  } else if (percent > 25) {
    // Orange -> attention
    lifeBar.style.background = "linear-gradient(90deg, #ffdd00, #ffaa00)";
  } else {
    // Rouge -> danger
    lifeBar.style.background = "linear-gradient(90deg, #ff4d6d, #ffaaaa)";
  }
}

// =======================
// Démarrage du timer de vie
// =======================
export function startLifeTimer() {
  if (lifeInterval) clearInterval(lifeInterval);

  lifeInterval = setInterval(() => {
    if (lifeTime > 0) {
      lifeTime--; // la vie baisse chaque seconde
    } else {
      alert("⚠️ L'IA s'éteint faute de feed !");
      clearInterval(lifeInterval); // stoppe le timer
    }
    updateLifeBar();
  }, 1000); // met à jour chaque seconde
}

