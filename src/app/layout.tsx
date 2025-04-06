import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider } from "next-themes";
import "./globals.css";

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
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <HeroUIProvider>
          <ThemeProvider attribute="class">{children}</ThemeProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
