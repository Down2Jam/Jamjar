"use client";

import { addToast } from "@heroui/react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useShortcut } from "react-keybind";

export default function Hotkey({
  href,
  hotkey,
  onPress,
  title,
  description,
}: {
  href?: string;
  hotkey: string[];
  onPress?: () => void;
  title: string;
  description: string;
}) {
  const { registerShortcut, unregisterShortcut } = useShortcut();

  useEffect(() => {
    if (hotkey) {
      registerShortcut(
        () => {
          if (onPress) {
            onPress();
          }
          if (href) {
            addToast({
              title: `Navigated to ${href}`,
            });
            redirect(href);
          }
        },
        [hotkey.join("+")],
        title,
        description
      );
      return () => {
        unregisterShortcut([hotkey.join("+")]);
      };
    }
  }, [
    hotkey,
    href,
    registerShortcut,
    unregisterShortcut,
    onPress,
    title,
    description,
  ]);

  return <></>;
}
