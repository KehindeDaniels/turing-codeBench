// File Path: src/context/LanguageContext.js

import React, { createContext, useState, useEffect } from "react";
import i18n from "i18next";

// Create Context for Language Management
export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(
    localStorage.getItem("lang") || "en"
  );

  useEffect(() => {
    // BAD PRACTICE: LocalStorage write every time the effect runs, even if language doesn't change
    localStorage.setItem("lang", language); // Inefficient: This runs even if language hasn't changed

    // BAD PRACTICE: Changing the language in i18n on every render, which may trigger unnecessary network requests
    i18n.changeLanguage(language); // Inefficient: This could cause unnecessary language reloads
  }, [language]);

  const switchLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, switchLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
