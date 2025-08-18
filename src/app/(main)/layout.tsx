import Navbar from "../../components/navbar";
import { Spacer } from "@heroui/react";
import PageBackground from "./PageBackground";

// import Footer from "@/components/footer";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PageBackground>
      <Navbar />
      <Spacer y={5} />
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto flex-grow w-full px-2 sm:px-8 z-10">
        {children}
      </div>
    </PageBackground>
  );
}
