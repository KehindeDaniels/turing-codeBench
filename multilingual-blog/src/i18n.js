import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

// Initialize i18next with configuration
i18n
  .use(LanguageDetector) // Detect language from browser
  .use(HttpBackend) // Allows fetching translations from JSON files (useful for localization)
  .use(initReactI18next) // Bind i18next to React
  .init({
    fallbackLng: "en", // Fallback language if detection fails
    interpolation: {
      escapeValue: false, // React already does escaping
    },
    react: {
      useSuspense: true,
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json", // Path for language JSON files (will be created later)
    },
  });

export default i18n;
