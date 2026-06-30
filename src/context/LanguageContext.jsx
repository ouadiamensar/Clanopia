/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// استيراد ملفات الترجمات بشكل ثابت
import enTranslations from "../translations/en.json";
import arTranslations from "../translations/ar.json";
import frTranslations from "../translations/fr.json";
import esTranslations from "../translations/es.json";
import deTranslations from "../translations/de.json";

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("en");
  const [translations, setTranslations] = useState(enTranslations);
  const [loading, setLoading] = useState(true);

  // كائن يحتوي على جميع الترجمات
  const translationFiles = {
    en: enTranslations,
    ar: arTranslations,
    fr: frTranslations,
    es: esTranslations,
    de: deTranslations,
  };

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      setLanguage(savedLanguage);
      setTranslations(translationFiles[savedLanguage] || enTranslations);
    }
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      if (!auth.currentUser) return;

      setLoading(true);
      try {
        const settingsRef = doc(
          db,
          "users",
          auth.currentUser.uid,
          "settings",
          "data"
        );
        
        const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const userLanguage = data.theme?.language || "en";
            
            setLanguage(userLanguage);
            // استخدام الترجمات من الكائن مباشرة
            setTranslations(translationFiles[userLanguage] || enTranslations);
            
            // تحديث localStorage
            localStorage.setItem("language", userLanguage);
          }
        });

        return unsubscribe;
      } catch (error) {
        console.error("Error loading language settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTranslations();
  }, [auth.currentUser]);

  const changeLanguage = async (newLanguage) => {
    if (!auth.currentUser) return;

    try {
      const settingsRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "settings",
        "data"
      );
      
      await setDoc(
        settingsRef,
        {
          theme: {
            language: newLanguage,
          },
        },
        { merge: true }
      );

      setLanguage(newLanguage);
      setTranslations(translationFiles[newLanguage] || enTranslations);
      localStorage.setItem("language", newLanguage);
      
    } catch (error) {
      console.error("Error changing language:", error);
    }
  };

  const value = {
    language,
    translations,
    changeLanguage,
    loading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};