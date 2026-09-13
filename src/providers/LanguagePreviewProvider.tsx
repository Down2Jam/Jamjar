// app/providers/LanguagePreviewProvider.tsx
"use client";
import { createContext, useCallback, useContext, useState } from "react";
import Cookies from "js-cookie";
import { loadLanguages } from "@/lib/loadLanguages";
import type { LanguageInfo } from "@/types/LanguageInfoType";

const languageKeys = new Set((loadLanguages() as LanguageInfo[]).map(({ key }) => key));

const LanguagePreviewContext = createContext<{
  previewLocale: string | null;
  setPreviewLocale: (locale: string | null) => void;
  selectedLocale: string;
  setSelectedLocale: (locale: string) => void;
}>({
  previewLocale: null,
  setPreviewLocale: () => {},
  selectedLocale: "en",
  setSelectedLocale: () => {},
});

export const LanguagePreviewProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [previewLocale, setPreviewLocale] = useState<string | null>(null);
  const [selectedLocale, setLocale] = useState(() => {
    const saved = Cookies.get("locale") ?? "en";
    return languageKeys.has(saved) ? saved : "en";
  });
  const setSelectedLocale = useCallback((locale: string) => {
    if (!languageKeys.has(locale)) return;
    Cookies.set("locale", locale, { expires: 36500 });
    setLocale(locale);
    setPreviewLocale(null);
  }, []);

  return (
    <LanguagePreviewContext.Provider
      value={{ previewLocale, setPreviewLocale, selectedLocale, setSelectedLocale }}
    >
      {children}
    </LanguagePreviewContext.Provider>
  );
};

export const useLanguagePreview = () => useContext(LanguagePreviewContext);
