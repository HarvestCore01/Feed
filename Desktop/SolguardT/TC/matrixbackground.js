console.log("Matrix background script loaded ✅");

const canvas = document.getElementById("matrixBackground");
if (!canvas) {
  console.error("❌ Canvas 'matrixBackground' introuvable !");
} else {
  console.log("✅ Canvas trouvé, initialisation du fond Matrix...");
}

const ctx = canvas ? canvas.getContext("2d") : null;

function initCanvas() {
  if (!canvas) return;
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  console.log(`📏 Canvas taille : ${canvas.width}x${canvas.height}`);
}

initCanvas();

// Lettres & config
const letters = "アカサタナハマヤラワ0123456789";
const fontSize = 14;
let columns = canvas ? canvas.width / fontSize : 0;
let drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
  if (!ctx) return;

  ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#00ff9c";
  ctx.font = fontSize + "px monospace";

  for (let i = 0; i < drops.length; i++) {
    const text = letters.charAt(Math.floor(Math.random() * letters.length));
    ctx.fillText(text, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    }
    drops[i]++;
  }
}

if (canvas) {
  console.log("🚀 Lancement de l'animation Matrix...");
  setInterval(drawMatrix, 33);
}

window.addEventListener("resize", () => {
  initCanvas();
  columns = canvas.width / fontSize;
  drops = Array(Math.floor(columns)).fill(1);
  console.log("📏 Canvas ajusté après resize.");
});
