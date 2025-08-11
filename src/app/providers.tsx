"use client";

import useBreakpoint from "@/hooks/useBreakpoint";
import { useLanguagePreview } from "@/providers/LanguagePreviewProvider";
import { MusicProvider } from "@/providers/MusicProvider";
import { SiteThemeProvider } from "@/providers/SiteThemeProvider";
import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import { merge } from "lodash";
import { AbstractIntlMessages, NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";
import { ShortcutProvider } from "react-keybind";

export default function Providers({
  children,
  locale,
  messages,
}: Readonly<{
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
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
        <SiteThemeProvider>
          <NextIntlClientProvider
            locale={activeLocale}
            messages={activeMessages}
          >
            <MusicProvider>
              <ToastProvider
                placement={isMobile ? "top-center" : "bottom-right"}
              />
              {children}
            </MusicProvider>
          </NextIntlClientProvider>
        </SiteThemeProvider>
      </ShortcutProvider>
    </HeroUIProvider>
  );
}
