import Navbar from "../../components/navbar";
import { Spacer } from "@heroui/react";

// import Footer from "@/components/footer";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="bg-[#fff] dark:bg-[#181818] min-h-screen flex flex-col ease-in-out transition-color duration-500">
      <div className="fixed top-0 left-0 bg-[repeating-linear-gradient(135deg,#075e94_0px,#075e94_40px,#4a3279_40px,#4a3279_80px)] w-screen h-screen opacity-10 dark:opacity-5 pointer-events-none" />
      <Navbar />
      <Spacer y={5} />
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-8xl mx-auto flex-grow w-full px-8">
        {children}
      </div>
    </div>
  );
}
