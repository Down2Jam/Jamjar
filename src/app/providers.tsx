"use client";

import useBreakpoint from "@/hooks/useBreakpoint";
import {
  LanguagePreviewProvider,
  useLanguagePreview,
} from "@/providers/LanguagePreviewProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import { merge } from "lodash";
import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";
import { ShortcutProvider } from "react-keybind";

export default function Providers({
  children,
  locale,
  messages,
}: Readonly<{
  children: React.ReactNode;
  locale: string;
  messages: Record<string, any>;
}>) {
  const { isMobile } = useBreakpoint();
  const { previewLocale } = useLanguagePreview();
  const [activeMessages, setActiveMessages] = useState(messages);
  const [activeLocale, setActiveLocale] = useState(locale);

  useEffect(() => {
    if (!previewLocale || previewLocale === locale) {
      setActiveMessages(messages);
      setActiveLocale(locale);
      return;
    }

    const loadPreviewMessages = async () => {
      try {
        const fallbackMessages = (await import(`@/messages/en.json`)).default;
        const previewMessages = (
          await import(`@/messages/${previewLocale}.json`)
        ).default;

        const merged = merge({}, fallbackMessages, previewMessages);
        setActiveMessages(merged);
        setActiveLocale(previewLocale);
      } catch (e) {
        console.error("Error loading preview messages:", e);
        setActiveMessages(messages); // fallback to server-provided merged messages
        setActiveLocale(locale);
      }
    };

    loadPreviewMessages();
  }, [previewLocale, locale, messages]);

  return (
    <HeroUIProvider>
      <ShortcutProvider>
        <ThemeProvider>
          <NextIntlClientProvider
            locale={activeLocale}
            messages={activeMessages}
          >
            <ToastProvider
              placement={isMobile ? "top-center" : "bottom-right"}
            />
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </ShortcutProvider>
    </HeroUIProvider>
  );
}
