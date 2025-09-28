// === main.js ===
import { createAccount, login, updateUserInfo } from './account.js';
import { sendSOL, burnTokens, autoIncreaseMarketCap, startLifeTimer, marketCap } from './market.js';
import { updateDisplay } from './ui.js';
import { checkLeaderboardUnlock, updateLeaderboard } from './leaderboard.js';
import { smoothUpdateMarketCap } from './ui.js';


let currentUser = null;
let leaderboardUnlocked = false; // ✅ Drapeau : Leaderboard initialement verrouillé
window.eggHatched = false;


// Initialisation globale du son
const bootSound = new Audio('./sounds/boot.mp3');
bootSound.volume = 0.2;
let bootPlayed = false; // Pour éviter de le rejouer plusieurs fois


document.addEventListener('DOMContentLoaded', () => {
  console.log("Main.js chargé ✅");


  function updateEggIntensity(marketCap) {
  const egg = document.getElementById('ai-hologram');
  if (!egg) return;

  // Intensité logarithmique pour une montée progressive
  const intensity = Math.min(Math.log10(marketCap + 1) / 4, 1); 
  egg.style.setProperty('--intensity', intensity.toFixed(3));

  // Vitesse d'agitation qui s'accélère
  egg.style.animationDuration = `${2.5 - intensity * 1.5}s`;
}



  // Fonction pour jouer le son de milestone
function playMilestoneSound() {
  const audio = new Audio('./sounds/milestone.mp3');
  audio.volume = 0.25; // un peu plus fort que le bip
  audio.play().catch(err => console.warn("Lecture bloquée :", err));
}

const milestones = [9000, 20000, 40000]; // tu peux en ajouter d'autres
let lastTriggeredMilestone = 0;

  
   // ==========================
  // Animation d'entrée du dashboard
  // ==========================
  const intro = document.getElementById('intro-screen');
  const dashboard = document.getElementById('dashboard');

 // Fonction pour jouer le son une seule fois
function playBootSound() {
  if (!bootPlayed) {
    bootSound.play().then(() => {
      bootPlayed = true;
      console.log("🔊 Son de boot joué avec succès !");
    }).catch(() => {
      console.warn("⚠️ Lecture auto bloquée, attente d'un clic utilisateur...");
      document.body.addEventListener('click', () => {
        bootSound.play();
        bootPlayed = true;
      }, { once: true });
    });
  }
}
// Fonction pour l'effet flash à l'éclosion
function hatchEgg() {
  const flash = document.createElement('div');
  flash.style.position = 'fixed';
  flash.style.top = 0;
  flash.style.left = 0;
  flash.style.width = '100%';
  flash.style.height = '100%';
  flash.style.background = 'rgba(0,217,255,0.8)';
  flash.style.zIndex = 9999;
  flash.style.transition = 'opacity 0.6s ease-out';
  document.body.appendChild(flash);

  setTimeout(() => flash.style.opacity = 0, 50);
  setTimeout(() => flash.remove(), 650);
}


// Fonction Notif Marketcap
const beepAudio = new Audio('./sounds/beep.mp3');
beepAudio.volume = 0.05; // ajustable, reste subtil

function playBeep() {
  const audio = new Audio('./sounds/beep.mp3');
  audio.volume = 0.05;
  audio.playbackRate = 0.9 + Math.random() * 0.2; // pitch varie entre 0.9 et 1.1
  audio.play();
}



// Appel au chargement initial
playBootSound();

  // Après 2,5 sec → on cache l'intro et on affiche le dashboard
  setTimeout(() => {
  // Ajoute la classe qui déclenche l'effet
  intro.classList.add('fade-out');


  // Attend la fin de la transition avant de cacher l'élément
  setTimeout(() => {
    intro.style.display = 'none';
    dashboard.style.display = 'block';
    // Déclenche l'apparition du dashboard
    setTimeout(() => {
      dashboard.classList.add('visible');
    }, 50); // petit délai pour que la transition soit visible
  }, 800); // 800ms = même durée que la transition CSS
}, 2500); // L'écran d'intro reste visible 2.5s avant le fondu
  // ==========================
  // Gestion du Timer de Vie
  // ==========================
  startLifeTimer(updateDisplay); // Lancer le timer au démarrage

  // ==========================
  // Boutons
  // ==========================
  const createAccountBtn = document.getElementById('createAccount');
  const loginBtn = document.getElementById('login');
  const sendSolBtn = document.getElementById('sendSOL');
  const burnCoreBtn = document.getElementById('burnCore');

  // Création de compte
  createAccountBtn.addEventListener('click', createAccount);


  // Login
  loginBtn.addEventListener('click', () => {
    const user = login();
    if (user) {
      currentUser = user;
      console.log("Connecté :", currentUser);
      alert(`Bienvenue ${currentUser} !`);
      updateUserInfo(currentUser);
      localStorage.setItem("currentUser", currentUser);
      updateLeaderboard(currentUser); // Mise à jour leaderboard dès connexion
    }

    // Vérifie si un utilisateur est déjà connecté au chargement
const savedUser = localStorage.getItem("currentUser");
if (savedUser) {
  // Masquer Create Account et afficher Mon Profil
  document.getElementById('createAccount').style.display = 'none';
  document.getElementById('viewProfile').style.display = 'inline-block';
}

  });

  

  // Envoi de SOL
  sendSolBtn.addEventListener('click', () => {
    if (!currentUser) {
      alert("🚫 Vous devez être connecté pour envoyer du SOL.");
      return;
    }
    sendSOL(currentUser);
    updateDisplay();
    updateUserInfo(currentUser);
    updateLeaderboard(currentUser);
  });

  // Burn des tokens
  burnCoreBtn.addEventListener('click', () => {
    if (!currentUser) {
      alert("🚫 Vous devez être connecté pour brûler des tokens.");
      return;
    }
    burnTokens(currentUser);
    updateDisplay();
  });

  // ==========================
  // Reconnexion automatique
  // ==========================
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    currentUser = savedUser;
    updateUserInfo(currentUser);
  }


    let lastMarketCap = 0;
   const marketCapStep = 5000; // déclenche le son tous les 5K SOL
  // ==========================
  // Leaderboard LOCK logique
  // ==========================
  autoIncreaseMarketCap(() => {
    updateDisplay();
     // ✅ Ajout ici : anime le MarketCap
  smoothUpdateMarketCap(marketCap);
 updateEggIntensity(marketCap);

 // === Vérifie si l'œuf doit éclore ===
  if (marketCap >= 10000 && !window.eggHatched) {
    const aiHologram = document.getElementById('ai-hologram');
    if (aiHologram) {
      aiHologram.classList.add('hatch');
      hatchEgg();
      console.log("🥚 L'œuf éclot !");
    // ➡️ Après 2s (temps de l'animation), on remplace l'œuf par l'IA stable
    setTimeout(() => {
      aiHologram.innerHTML = `
        <div class="ia-final">
          <span class="energy"></span>
        </div>
      `;
    }, 2000);
  }
  window.eggHatched = true; // évite de rejouer l'animation
}

    const leaderboardSection = document.getElementById('leaderboardSection');
    const leaderboardMessage = document.getElementById('leaderboardMessage');
    const openLeaderboardBtn = document.getElementById('openLeaderboardBtn');
    const milestoneGoalEl = document.getElementById('milestoneGoal');

 
// Après mise à jour du MarketCap

if (marketCap - lastMarketCap >= marketCapStep) {
  playBeep();
  lastMarketCap = marketCap; // Réinitialise le seuil
}

// Vérifie si un milestone majeur est franchi
for (let milestone of milestones) {
  if (marketCap >= milestone && lastTriggeredMilestone < milestone) {
    playMilestoneSound();  // 🔊 son spécial
    lastTriggeredMilestone = milestone; // évite de rejouer en boucle
    console.log(`🎉 Milestone atteint : ${milestone} SOL`);
  }
}



    // Vérification sécurisée du milestoneGoal
    if (!milestoneGoalEl) {
      console.warn("⚠️ milestoneGoal introuvable dans le DOM");
      return;
    }

    // Nouveau code : supprime les séparateurs avant conversion
const milestoneGoal = parseInt(milestoneGoalEl.textContent.replace(/\D/g, ''));


    console.log("DEBUG → MarketCap:", marketCap, "MilestoneGoal:", milestoneGoal);

   if (!leaderboardUnlocked) {
      // Tant que le leaderboard n'a pas encore été débloqué
      if (marketCap < milestoneGoal) {
        // Encore verrouillé
        leaderboardSection.classList.add('locked');
        leaderboardMessage.innerHTML = `🔒 Débloquez le leaderboard en atteignant <strong>${milestoneGoal}</strong> SOL de MarketCap.`;
        openLeaderboardBtn.onclick = () => false;
      } else {
        // Débloqué pour la première fois
        leaderboardUnlocked = true; // ✅ ON NE REVIENT PLUS EN ARRIÈRE
        const leaderboardSection = document.getElementById('leaderboardSection');
leaderboardSection.classList.add('unlocked');

        leaderboardSection.classList.remove('locked');
        leaderboardMessage.innerHTML = `🎉 Le leaderboard est maintenant disponible !`;
        openLeaderboardBtn.onclick = null;
      }
    } else {
      // Leaderboard déjà débloqué → reste ouvert quoi qu'il arrive
      leaderboardSection.classList.remove('locked');
      leaderboardMessage.innerHTML = `🎉 Le leaderboard est maintenant disponible !`;
      openLeaderboardBtn.onclick = null;
    }
  });
});
