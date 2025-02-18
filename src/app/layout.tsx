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
            <div className="">
              <div className="bg-[#fff] dark:bg-[#181818] min-h-screen flex flex-col ease-in-out transition-color duration-500">
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
