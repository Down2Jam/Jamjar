"use client";

import useBreakpoint from "@/hooks/useBreakpoint";
import { useLanguagePreview } from "@/providers/LanguagePreviewProvider";
import { SiteThemeProvider, useTheme } from "@/providers/SiteThemeProvider";
import { EmojiProvider } from "@/providers/EmojiProvider";
import { BASE_URL } from "@/requests/config";
import { MusicProvider, useMusic } from "bioloom-miniplayer";
import { ThemeProvider, ToastProvider } from "bioloom-ui";
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
    <ShortcutProvider>
      <SiteThemeProvider>
        <BioloomThemeBridge>
          <NextIntlClientProvider locale={activeLocale} messages={activeMessages}>
            <EmojiProvider>
              <MusicProvider>
                <MusicTrackLoader />
                <ToastProvider
                  placement={isMobile ? "top-center" : "bottom-right"}
                />
                {children}
              </MusicProvider>
            </EmojiProvider>
          </NextIntlClientProvider>
        </BioloomThemeBridge>
      </SiteThemeProvider>
    </ShortcutProvider>
  );
}

function BioloomThemeBridge({ children }: { children: React.ReactNode }) {
  const { siteTheme } = useTheme();

  return (
    <ThemeProvider
      theme={{
        name: siteTheme.name,
        type: siteTheme.type,
        colors: siteTheme.colors,
      }}
    >
      {children}
    </ThemeProvider>
  );
}

function MusicTrackLoader() {
  const { setTracks } = useMusic();

  useEffect(() => {
    let cancelled = false;

    const loadTracks = async () => {
      try {
        const res = await fetch(`${BASE_URL}/tracks`);
        const json = await res.json();
        if (!cancelled) {
          setTracks(json.data ?? []);
        }
      } catch (error) {
        console.error("Error loading tracks:", error);
      }
    };

    loadTracks();
    return () => {
      cancelled = true;
    };
  }, [setTracks]);

  return null;
}
