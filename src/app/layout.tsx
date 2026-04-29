import type { Metadata } from "@/compat/next";
import { Inter } from "@/compat/next-font-google";
import "./globals.css";
import Providers from "./providers";
import { getLocale, getMessages } from "@/compat/next-intl-server";
import { LanguagePreviewProvider } from "@/providers/LanguagePreviewProvider";
import { QueryClient, dehydrate } from "@tanstack/react-query";
import { getCurrentJam } from "@/helpers/jam";
import { queryKeys } from "@/hooks/queries/queryKeys";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://d2jam.com"),
  title: "Down2Jam",
  description: "The community centered game jam",
  keywords: ["game jam", "community", "indie games", "down2jam"],
  openGraph: {
    title: "Down2Jam",
    description: "The community centered game jam",
    url: "https://d2jam.com",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/D2J_Icon.png",
        width: 320,
        height: 320,
        alt: "Down2Jam logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Down2Jam",
    description: "The community centered game jam",
    images: ["/images/D2J_Icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: queryKeys.jam.current(),
    queryFn: getCurrentJam,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen`}>
        <LanguagePreviewProvider>
          <Providers locale={locale} messages={messages} dehydratedState={dehydrate(queryClient)}>
            {children}
          </Providers>
        </LanguagePreviewProvider>
      </body>
    </html>
  );
}
