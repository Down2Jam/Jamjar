import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/navbar";
import { ToastContainer } from "react-toastify";
import { NextUIProvider, Spacer } from "@nextui-org/react";
import Footer from "@/components/footer";
import { ThemeProvider } from "next-themes";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Down2Jam",
  description: "A community built game jam!",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NextUIProvider>
          <ThemeProvider attribute="class">
            <div>
              <div className="bg-[#fff] dark:bg-[#181818] min-h-screen flex flex-col ease-in-out transition-color duration-500">
                <div className="fixed top-0 left-0 bg-[repeating-linear-gradient(135deg,#075e94_0px,#075e94_40px,#4a3279_40px,#4a3279_80px)] w-screen h-screen opacity-10 dark:opacity-5 pointer-events-none" />
                <Navbar />
                <Spacer y={5} />
                <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto flex-grow w-full">
                  {children}
                </div>
                <Footer />
                <ToastContainer />
              </div>
            </div>
          </ThemeProvider>
        </NextUIProvider>
      </body>
    </html>
  );
}

/*
<div className="fixed top-0 left-0 bg-opacity-5 bg-gradient-to-br from-[#075e94] to-[#4a3279] via-transparent w-screen h-screen opacity-10" />
*/
