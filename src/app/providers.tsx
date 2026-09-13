"use client";

import useBreakpoint from "@/hooks/useBreakpoint";
import { useLanguagePreview } from "@/providers/LanguagePreviewProvider";
import { SiteThemeProvider } from "@/providers/SiteThemeProvider";
import { useTheme } from "@/providers/useSiteTheme";
import { EmojiProvider } from "@/providers/EmojiProvider";
import LanguageAccountSync from "@/providers/LanguageAccountSync";
import { BASE_URL } from "@/requests/config";
import { MusicProvider } from "bioloom-miniplayer";
import { ThemeProvider, ToastProvider } from "bioloom-ui";
import { merge } from "lodash";
import { AbstractIntlMessages, NextIntlClientProvider } from "@/compat/next-intl";
import { useEffect, useMemo, useState } from "react";
import { ShortcutProvider } from "react-keybind";
import { QueryClient, QueryClientProvider, HydrationBoundary, type DehydratedState } from "@tanstack/react-query";

const previewMessageLoaders = import.meta.glob<AbstractIntlMessages>(
  ["../messages/*.json", "!../messages/en.json", "!../messages/coverage.json"],
  { import: "default" },
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export default function Providers({
  children,
  locale,
  messages,
  dehydratedState,
}: Readonly<{
  children: React.ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
  dehydratedState?: DehydratedState;
}>) {
  const { isMobile } = useBreakpoint();
  const { previewLocale, selectedLocale } = useLanguagePreview();
  const [activeMessages, setActiveMessages] = useState(messages);
  const [activeLocale, setActiveLocale] = useState(locale);

  useEffect(() => {
    let cancelled = false;
    const targetLocale = previewLocale ?? selectedLocale;
    if (targetLocale === locale) {
      setActiveMessages(messages);
      setActiveLocale(locale);
      return;
    }

    const loadPreviewMessages = async () => {
      try {
        const loadPreviewMessages =
          previewMessageLoaders[`../messages/${targetLocale}.json`];
        if (!loadPreviewMessages) {
          throw new Error(`No messages found for ${targetLocale}`);
        }

        const merged = merge({}, messages, await loadPreviewMessages());
        if (cancelled) return;
        setActiveMessages(merged);
        setActiveLocale(targetLocale);
      } catch (e) {
        if (cancelled) return;
        console.error("Error loading preview messages:", e);
        setActiveMessages(messages); // fallback to server-provided merged messages
        setActiveLocale(locale);
      }
    };

    loadPreviewMessages();
    return () => { cancelled = true; };
  }, [previewLocale, selectedLocale, locale, messages]);

  return (
    <QueryClientProvider client={queryClient}>
      <HydrationBoundary state={dehydratedState}>
        <LanguageAccountSync />
        <ShortcutProvider>
          <SiteThemeProvider>
            <BioloomThemeBridge>
              <NextIntlClientProvider locale={activeLocale} messages={activeMessages}>
                <EmojiProvider>
                  <MusicProvider>
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
      </HydrationBoundary>
    </QueryClientProvider>
  );
}

function BioloomThemeBridge({ children }: { children: React.ReactNode }) {
  const { siteTheme } = useTheme();
  const theme = useMemo(
    () => ({
      name: siteTheme.name,
      type: siteTheme.type,
      colors: siteTheme.colors,
    }),
    [siteTheme.name, siteTheme.type, siteTheme.colors],
  );

  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
}

