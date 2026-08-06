"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE, localeFromPathname, localizePath, type Locale } from "./i18n/locale";

export type Language = Locale;

export const LANGUAGE_STORAGE_KEY = "popok-language";
export const LANGUAGE_CHANGE_EVENT = "popok-language-change";

function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "ko";
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "ko";
}

export function setStoredLanguage(language: Language) {
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  document.cookie = `${LOCALE_COOKIE}=${language}; Path=/; Max-Age=31536000; SameSite=Lax`;
  window.dispatchEvent(new CustomEvent(LANGUAGE_CHANGE_EVENT, { detail: language }));
}

export function useLanguage() {
  const pathname = usePathname();
  const router = useRouter();
  const routeLanguage = localeFromPathname(pathname || "/");
  const [language, setLanguageState] = useState<Language>(routeLanguage);

  useEffect(() => {
    setLanguageState(routeLanguage);
    if (typeof window !== "undefined") setStoredLanguage(routeLanguage);

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
  }, [routeLanguage]);

  const setLanguage = (next: Language) => {
    setLanguageState(next);
    setStoredLanguage(next);
    router.push(localizePath(pathname || "/", next));
  };

  return { language, setLanguage };
}
