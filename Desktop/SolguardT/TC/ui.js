// === ui.js ===
import { marketCap } from "./market.js";

// =============================================================
// 🔹 Mise à jour statique immédiate du MarketCap
// =============================================================
export function updateDisplay() {
  const marketCapElement = document.getElementById("marketCap");
  if (marketCapElement) {
    marketCapElement.textContent = formatMarketCap(marketCap);
  }
}

// =============================================================
// 🔹 Animation fluide du MarketCap affiché
// =============================================================
let displayedMarketCap = 0;
let marketCapInterval = null;

export function smoothUpdateMarketCap(newMarketCap) {
  if (marketCapInterval) clearInterval(marketCapInterval);

  marketCapInterval = setInterval(() => {
    const diff = newMarketCap - displayedMarketCap;

    if (Math.abs(diff) <= 1) {
      displayedMarketCap = newMarketCap;
      clearInterval(marketCapInterval);
    } else {
      // ⚡ Animation fluide
      displayedMarketCap += diff * 0.1;
    }

    const marketCapEl = document.getElementById("marketCap");
    if (marketCapEl) {
      marketCapEl.textContent = formatMarketCap(displayedMarketCap);
    }
  }, 30);
}

// =============================================================
// 🔹 Formatage lisible du MarketCap ($, K, M, B)
// =============================================================
function formatMarketCap(value) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}
