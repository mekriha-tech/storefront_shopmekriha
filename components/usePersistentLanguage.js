import { useCallback, useEffect, useState } from "react";

const LANGUAGE_STORAGE_KEY = "mekriha-language";
const SUPPORTED_LANGUAGES = new Set(["en", "as"]);

export default function usePersistentLanguage(defaultLang = "en") {
  const [lang, setLang] = useState(defaultLang);

  useEffect(() => {
    // localStorage is unavailable during SSR, so the stored language can only
    // be read post-mount; this restore-then-render-again is intentional.
    const storedLang = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_LANGUAGES.has(storedLang)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLang(storedLang);
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const updateLang = useCallback((nextLang) => {
    if (!SUPPORTED_LANGUAGES.has(nextLang)) return;
    setLang(nextLang);
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLang);
  }, []);

  return [lang, updateLang];
}
