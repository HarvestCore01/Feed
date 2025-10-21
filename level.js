// === level.js ===

// Seuils d'XP nécessaires pour passer chaque niveau
// Exemple : 
// - Niveau 1 = 0 CORE
// - Niveau 2 = 100 CORE
// - Niveau 3 = 500 CORE
// etc.
const LEVEL_THRESHOLDS = [0, 100, 500, 1000, 2500, 5000, 10000];

/**
 * Calcule le niveau en fonction du total feed
 * @param {number} feed - Total des CORE envoyés
 * @returns {number} Niveau actuel du joueur
 */
export function calculateLevel(feed) {
  if (feed < 0) return 1; // sécurité

  // Trouve le dernier seuil inférieur ou égal au feed
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (feed >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break; // on arrête dès qu'on dépasse le feed
    }
  }
  return level;
}
