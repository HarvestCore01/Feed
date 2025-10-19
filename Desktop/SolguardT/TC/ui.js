// === ui.js ===
import { marketCap } from "./market.js";
import { setLanguage, applyTranslations } from "./feed-lang.js";

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

    // Si différence minimale, on arrête l'animation
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

// =============================================================
// 🌐 Initialisation du plugin de langue FeedLang
// =============================================================
document.addEventListener("DOMContentLoaded", () => {
  try {
    // 🔸 Récupère la langue sauvegardée ou défaut FR
    const savedLang = localStorage.getItem("feedLang") || "fr";

    // ✅ Initialise la langue active
    setLanguage(savedLang);
    applyTranslations();

    // 🔸 Écouteur du sélecteur de langue (si présent dans le DOM)
    const langSelect = document.getElementById("langSelect");
    if (langSelect) {
      langSelect.value = savedLang;

      // Empêche les doublons de listeners sur hot reloads
      langSelect.replaceWith(langSelect.cloneNode(true));
      const newSelect = document.getElementById("langSelect");

      newSelect.addEventListener("change", (e) => {
        const chosenLang = e.target.value;
        setLanguage(chosenLang);
        applyTranslations();

        // Stocke la préférence utilisateur
        localStorage.setItem("feedLang", chosenLang);

        // ✅ Notification (si ton système holographique est actif)
        const notify = window.showHolographicNotification || window.showFeedNotification;
        if (typeof notify === "function") {
          const flag = chosenLang === "fr" ? "🇫🇷" : "🇬🇧";
          notify(`${flag} Langue changée : ${chosenLang.toUpperCase()}`, "#00ff9c");
        }
      });
    }

    console.log(`🌍 FeedLang initialisé — Langue active : ${savedLang.toUpperCase()}`);
  } catch (err) {
    console.error("❌ Erreur d’initialisation de FeedLang :", err);
  }
});
