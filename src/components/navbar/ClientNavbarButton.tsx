"use client";

import { addToast } from "@heroui/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useShortcut } from "react-keybind";

export default function ClientNavbarButton({
  href,
  hotkey,
}: {
  href: string;
  hotkey: string[];
}) {
  const { registerShortcut, unregisterShortcut } = useShortcut();

  useEffect(() => {
    registerShortcut(
      () => {
        addToast({
          title: `Navigated to ${href}`,
        });
        redirect(href);
      },
      [hotkey.join("+")],
      "Save",
      "Save the file"
    );
    return () => {
      unregisterShortcut(hotkey.join("+"));
    };
  }, [hotkey, href, registerShortcut, unregisterShortcut]);

  return <></>;
}
