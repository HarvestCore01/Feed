// ===============================
// 🌐 FeedLang — Plugin de traduction Core Feed
// ===============================
const translations = {
  fr: {
    login: "Se connecter",
    logout: "Se déconnecter",
    register: "Créer un compte",
    forgotPassword: "Mot de passe oublié ?",
    emailPlaceholder: "Adresse e-mail",
    passwordPlaceholder: "Mot de passe",
    usernamePlaceholder: "Nom d'utilisateur",
    createAccountSuccess: "Compte créé avec succès 🎉",
    resetMailSent: "📩 Email de réinitialisation envoyé à",
    resetMailError: "❌ Erreur lors de l’envoi du mail",
    welcome: "Bienvenue",
    disconnected: "Déconnecté du Core Feed",
    verifyEmail: "📩 Vérifie ton email avant de te connecter !",
    fillAllFields: "⚠️ Email, mot de passe et pseudo requis.",
  },
  en: {
    login: "Log in",
    logout: "Log out",
    register: "Create account",
    forgotPassword: "Forgot password?",
    emailPlaceholder: "Email address",
    passwordPlaceholder: "Password",
    usernamePlaceholder: "Username",
    createAccountSuccess: "Account successfully created 🎉",
    resetMailSent: "📩 Password reset email sent to",
    resetMailError: "❌ Error sending password reset email",
    welcome: "Welcome",
    disconnected: "Disconnected from Core Feed",
    verifyEmail: "📩 Check your inbox before logging in!",
    fillAllFields: "⚠️ Email, password and username required.",
  },
};

// ===============================
// 🔹 Détection et persistance de la langue
// ===============================
const defaultLang = localStorage.getItem("feedLang") || navigator.language.slice(0, 2) || "fr";
let currentLang = translations[defaultLang] ? defaultLang : "fr";

export function setLanguage(lang) {
  if (!translations[lang]) {
    console.warn(`Langue non disponible : ${lang}`);
    return;
  }
  currentLang = lang;
  localStorage.setItem("feedLang", lang);
  applyTranslations();
}

export function t(key) {
  return translations[currentLang][key] || key;
}

// ===============================
// 🧠 Application directe dans le DOM
// ===============================
export function applyTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    const text = translations[currentLang][key];
    if (text) el.textContent = text;
  });
}

// ===============================
// 🚀 Initialisation automatique
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  applyTranslations();
  console.log(`🌍 FeedLang actif (${currentLang.toUpperCase()})`);
});
