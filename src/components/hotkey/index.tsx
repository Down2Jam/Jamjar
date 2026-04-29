"use client";

import { useTranslations } from "@/compat/next-intl";
import { redirect } from "@/compat/next-navigation";
import { useEffect, useMemo } from "react";
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
  const t = useTranslations();
  const hotkeyValue = useMemo(() => hotkey.join("+"), [hotkey]);
  const translatedTitle = t(title);
  const translatedDescription = t(description);

  useEffect(() => {
    if (hotkey && registerShortcut && unregisterShortcut) {
      registerShortcut(
        () => {
          if (onPress) {
            onPress();
          }
          if (href) {
            // addToast({
            //   title: `Navigated to ${href}`,
            // });
            redirect(href);
          }
        },
        [hotkeyValue],
        translatedTitle,
        translatedDescription
      );
      return () => {
        unregisterShortcut([hotkeyValue]);
      };
    }
  }, [
    hotkeyValue,
    href,
    registerShortcut,
    unregisterShortcut,
    onPress,
    translatedTitle,
    translatedDescription,
  ]);

  return <></>;
}
