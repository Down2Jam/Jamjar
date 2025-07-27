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
  const shortcuts = useShortcut();
  const registerShortcut = shortcuts?.registerShortcut;
  const unregisterShortcut = shortcuts?.unregisterShortcut;

  useEffect(() => {
    if (hotkey && registerShortcut && unregisterShortcut) {
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
