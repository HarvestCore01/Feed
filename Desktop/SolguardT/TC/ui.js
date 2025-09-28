// === ui.js ===
import { marketCap } from './market.js';

export function updateDisplay() {
  const marketCapElement = document.getElementById('marketCap');
  if (marketCapElement) {
    marketCapElement.textContent = marketCap.toLocaleString();
  }
}


// ===== Animation ultra rapide du MarketCap =====
let displayedMarketCap = 0;
let marketCapInterval = null;

export function smoothUpdateMarketCap(newMarketCap) {
  // Si un interval existe déjà, on le supprime pour en recréer un nouveau
  if (marketCapInterval) clearInterval(marketCapInterval);

  marketCapInterval = setInterval(() => {
    // Différence entre la valeur affichée et la cible
    const diff = newMarketCap - displayedMarketCap;

    // Si la différence est faible, on termine l'animation
    if (Math.abs(diff) <= 0) {
      displayedMarketCap = newMarketCap;
      clearInterval(marketCapInterval);
    } else {
      // Animation fluide : on se rapproche de la cible
      displayedMarketCap += Math.sign(diff) * Math.min(Math.abs(diff), 200);
    }

    // Mise à jour de l'affichage
    const marketCapEl = document.getElementById("marketCap");
    if (marketCapEl) {
      marketCapEl.textContent = Math.floor(displayedMarketCap).toLocaleString();
    }
  }, 20); // 20ms = rapide mais fluide
}




// Format pour afficher 1k, 1M etc.
function formatMarketCap(value) {
  if (value >= 1000000) return (value / 1000000).toFixed(2) + " M";
  if (value >= 1000) return (value / 1000).toFixed(2) + " K";
  return value.toFixed(2);
}
