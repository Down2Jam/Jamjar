// app/providers/LanguagePreviewProvider.tsx
"use client";
import { createContext, useContext, useState } from "react";

const LanguagePreviewContext = createContext<{
  previewLocale: string | null;
  setPreviewLocale: (locale: string | null) => void;
}>({
  previewLocale: null,
  setPreviewLocale: () => {},
});

export const LanguagePreviewProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [previewLocale, setPreviewLocale] = useState<string | null>(null);

  return (
    <LanguagePreviewContext.Provider
      value={{ previewLocale, setPreviewLocale }}
    >
      {children}
    </LanguagePreviewContext.Provider>
  );
};

export const useLanguagePreview = () => useContext(LanguagePreviewContext);
