console.log("Matrix background script loaded ✅");

const canvas = document.getElementById('matrixBackground');
const ctx = canvas.getContext('2d');

// Réduit la résolution à 50%
canvas.width = window.innerWidth / 2;
canvas.height = window.innerHeight / 2;

// Et tu l'agrandis en CSS :
canvas.style.transform = "scale(2)";
canvas.style.transformOrigin = "top left";

function initCanvas() {
  if (!canvas) return;
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  console.log(`📏 Canvas taille : ${canvas.width}x${canvas.height}`);
}

initCanvas();

// Lettres & config
const letters = "アカサタナハマヤラワ0123456789";
const fontSize = 16;
let columns = canvas ? canvas.width / fontSize : 0;
let drops = Array(Math.floor(columns)).fill(1);
let speeds = Array(Math.floor(columns)).fill(0).map(() => Math.random() * 0.5 + 0.3); 


function drawMatrix() {
  if (!ctx) return;

  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.filter = "blur(0.6px)"; // flou très léger
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
gradient.addColorStop(0, "#00ff9c");
gradient.addColorStop(0.5, "#63ffd4");
gradient.addColorStop(1, "#004d40");
ctx.fillStyle = gradient;

  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    // Tête lumineuse
    ctx.fillStyle = i % 2 === 0 ? "#b8ffe9" : "#00ff9c"; // alterne pour donner un effet dynamique
    drops[i] += speeds[i]; // chaque colonne tombe à sa propre vitesse

    const text = letters.charAt(Math.floor(Math.random() * letters.length));
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

let matrixInterval;

if (canvas) {
  console.log("🚀 Lancement de l'animation Matrix...");
  
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      clearInterval(matrixInterval); // stoppe l'animation quand onglet inactif
    } else {
      matrixInterval = setInterval(drawMatrix, 120); // reprend à 30 FPS
    }
  });

  // démarrage initial
  // matrixInterval = setInterval(drawMatrix, 120);
}

window.addEventListener("resize", () => {
  initCanvas();
  columns = canvas.width / fontSize;
  drops = Array(Math.floor(columns)).fill(1);
  console.log("📏 Canvas ajusté après resize.");
});
