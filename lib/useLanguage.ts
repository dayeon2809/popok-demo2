"use client";

import { useEffect, useState } from "react";

export type Language = "ko" | "en";

export const LANGUAGE_STORAGE_KEY = "popok-language";
export const LANGUAGE_CHANGE_EVENT = "popok-language-change";

function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "ko";
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "ko";
}

export function setStoredLanguage(language: Language) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: language }));
}

export function useLanguage() {
  const [language, setLanguageState] = useState<Language>("ko");

  useEffect(() => {
    setLanguageState(getStoredLanguage());

    const handleLanguageChange = (event: Event) => {
      const next = (event as CustomEvent<Language>).detail || getStoredLanguage();
      setLanguageState(next === "en" ? "en" : "ko");
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY) {
        setLanguageState(event.newValue === "en" ? "en" : "ko");
      }
    };

    window.addEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(LANGUAGE_CHANGE_EVENT, handleLanguageChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    setStoredLanguage(next);
  };

  return { language, setLanguage };
}
