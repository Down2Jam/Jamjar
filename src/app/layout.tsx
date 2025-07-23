import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Providers from "./providers";
import { getLocale, getMessages } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { LanguagePreviewProvider } from "@/providers/LanguagePreviewProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Down2Jam",
  description: "The community centered game jam",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <LanguagePreviewProvider>
          <Providers locale={locale} messages={messages}>
            <ThemeProvider attribute="class">{children}</ThemeProvider>
          </Providers>
        </LanguagePreviewProvider>
      </body>
    </html>
  );
}
