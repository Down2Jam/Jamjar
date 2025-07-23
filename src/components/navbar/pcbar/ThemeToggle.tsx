"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import NavbarTooltip from "./NavbarTooltip";
import Hotkey from "../../hotkey";
import { useTranslations } from "next-intl";

export default function ThemeToggle() {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState<boolean>(false);
  const [reduceMotion, setReduceMotion] = useState<boolean>(false);
  const t = useTranslations("Navbar");

  useEffect(() => {
    setMounted(true);

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setReduceMotion(event.matches);
    };
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const handleToggle = () => {
    if (isSpinning) return;

    if (!reduceMotion) {
      setIsSpinning(true);
      setTimeout(() => setIsSpinning(false), 500);
    }

    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  if (!mounted) {
    return null;
  }

  return (
    <NavbarTooltip
      hotkey={["T"]}
      name={resolvedTheme === "dark" ? t("Light.Title") : t("Dark.Title")}
      description={
        resolvedTheme === "dark"
          ? t("Light.Description")
          : t("Dark.Description")
      }
      icon={resolvedTheme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    >
      <div className={`rounded-xl text-[#333] dark:text-white`}>
        <div
          onClick={handleToggle}
          style={{ cursor: "pointer" }}
          className={`p-[6px] ${
            isSpinning && !reduceMotion ? "animate-[spin_0.5s_ease-out]" : ""
          }`}
        >
          {resolvedTheme === "dark" && <Moon size={20} />}
          {resolvedTheme === "light" && <Sun size={20} />}
          <Hotkey
            hotkey={["T"]}
            onPress={handleToggle}
            description={
              resolvedTheme === "dark"
                ? t("Light.Description")
                : t("Dark.Description")
            }
            title={
              resolvedTheme === "dark" ? t("Light.Title") : t("Dark.Title")
            }
          />
        </div>
      </div>
    </NavbarTooltip>
  );
}
