/**
 * @file Allows the user to change the language of the site.
 * Shows in the PC navbar.
 *
 * @author Ategon
 * @created 2025-7-22
 */
"use client";

import Cookies from "js-cookie";
import { useTranslations } from "next-intl";
import { ChevronDown, Languages } from "lucide-react";
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import ProgressCircle from "./ProgressCircle";
import { useRef, useState } from "react";
import { useLanguagePreview } from "@/providers/LanguagePreviewProvider";
import coverage from "../../../messages/coverage.json";
import PreviewLanguageBanner from "@/components/preview-language-banner";
import { useTheme } from "@/providers/ThemeProvider";

function waveText(label: string, colorLeft: string, colorRight: string) {
  return (
    <span
      className={`bg-gradient-to-r text-transparent bg-clip-text font-medium flex`}
      style={{
        backgroundImage: `linear-gradient(to right, ${colorLeft}, ${colorRight})`,
      }}
    >
      {label.split("").map((char, i) => (
        <span
          key={i}
          className={`
        inline-block
        transition-transform
        group-hover:animate-smallwave
      `}
          style={{
            animationDelay: `${i * 60}ms`,
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

export function getTailwindColors(gradient: string): [string, string] {
  const map: Record<string, [string, string]> = {
    "from-blue-500 to-blue-300": ["#3b82f6", "#93c5fd"],
    "from-indigo-500 to-indigo-300": ["#6366f1", "#a5b4fc"],
    "from-green-500 to-green-300": ["#22c55e", "#86efac"],
    "from-yellow-500 to-yellow-300": ["#eab308", "#fde68a"],
    "from-red-500 to-yellow-300": ["#ef4444", "#fde68a"],
    "from-rose-500 to-pink-300": ["#f43f5e", "#f9a8d4"],
    "from-purple-500 to-purple-300": ["#8b5cf6", "#c4b5fd"],
    "from-amber-500 to-amber-300": ["#f59e0b", "#fcd34d"],
    "from-neutral-500 to-neutral-300": ["#737373", "#d4d4d4"],
    "from-cyan-500 to-cyan-300": ["#06b6d4", "#67e8f9"],
    "from-pink-500 to-purple-400": ["#ec4899", "#c084fc"],
  };
  return map[gradient] || ["#7ee066", "#7ee066"];
}

export default function LanguageDropdown({ languages }) {
  const t = useTranslations("Navbar");
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const { setPreviewLocale, previewLocale } = useLanguagePreview();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { currentTheme, allThemes } = useTheme();

  function ChangeLanguage(key: string | number) {
    Cookies.set("locale", String(key), { expires: 36500 });
    window.location.reload();
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setHoveredKey(null);
      setPreviewLocale(null);
    }, 150);
  };

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <PreviewLanguageBanner languages={languages} />
      <Button
        size="sm"
        startContent={
          <Languages
            size={16}
            className={`transition-transform duration-500 ${
              isOpen ? "rotate-[360deg]" : "rotate-0"
            }`}
          />
        }
        endContent={
          <ChevronDown
            size={16}
            className={`transform transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        }
        variant="light"
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
          }
        }}
      />
      <Dropdown
        className="bg-white dark:bg-black"
        isOpen={isOpen}
        onOpenChange={setIsOpen}
      >
        <DropdownTrigger>
          <div></div>
        </DropdownTrigger>
        <DropdownMenu
          aria-label={t("Language.Title")}
          onAction={ChangeLanguage}
        >
          {languages.map(
            ({ key, label, colorPrimary, colorSecondary, colorBg }) => {
              const isHovered = hoveredKey === key;
              const percent = coverage[key] ?? 0; // default to 0 if missing

              return (
                <DropdownItem
                  key={key}
                  className={`w-full transition-all duration-200`}
                  style={{
                    backgroundColor: isHovered ? colorBg : undefined,
                  }}
                  onMouseEnter={() => {
                    if (hoverTimeoutRef.current)
                      clearTimeout(hoverTimeoutRef.current);
                    setHoveredKey(key);
                    setPreviewLocale(key);
                  }}
                  onMouseLeave={() => {
                    hoverTimeoutRef.current = setTimeout(() => {
                      // Only reset if still on the same key
                      if (hoveredKey === key) {
                        setHoveredKey(null);
                        setPreviewLocale(null);
                      }
                    }, 300); // Adjust delay as needed
                  }}
                >
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span
                          className={`
                          absolute inline-flex h-full w-full rounded-full opacity-75
                          
                          ${isHovered ? "animate-[ping_1.2s_infinite]" : ""}
                        `}
                          style={{
                            backgroundColor: currentTheme.colors[colorPrimary],
                          }}
                        />
                        <div
                          className={`w-2.5 h-2.5 rounded-full relative z-10`}
                          style={{
                            backgroundColor: currentTheme.colors[colorPrimary],
                          }}
                        />
                      </div>
                      <span className="group">
                        {waveText(
                          label,
                          currentTheme.colors[colorPrimary],
                          currentTheme.colors[colorSecondary]
                        )}
                      </span>
                    </div>
                    <ProgressCircle
                      percent={percent}
                      hovered={isHovered}
                      baseGradient={getTailwindColors("a")}
                      hoverGradient={getTailwindColors("a")}
                    />
                  </div>
                </DropdownItem>
              );
            }
          )}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
