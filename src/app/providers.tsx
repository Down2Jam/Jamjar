"use client";

import { HeroUIProvider } from "@heroui/react";
import { ToastProvider } from "@heroui/toast";
import { ShortcutProvider } from "react-keybind";

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <HeroUIProvider>
      <ShortcutProvider>
        <ToastProvider />
        {children}
      </ShortcutProvider>
    </HeroUIProvider>
  );
}
