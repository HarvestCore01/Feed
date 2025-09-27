// === ui.js ===
import { marketCap } from './market.js';

export function updateDisplay() {
  const marketCapElement = document.getElementById('marketCap');
  if (marketCapElement) {
    marketCapElement.textContent = marketCap.toLocaleString();
  }
}


// Format pour afficher 1k, 1M etc.
function formatMarketCap(value) {
  if (value >= 1000000) return (value / 1000000).toFixed(2) + " M";
  if (value >= 1000) return (value / 1000).toFixed(2) + " K";
  return value.toFixed(2);
}
