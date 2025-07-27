/**
 * @file Allows the user to change the language of the site.
 * Shows in the PC navbar.
 *
 * @author Ategon
 * @created 2025-7-22
 */
"use client";

import Cookies from "js-cookie";
import { ChevronDown, Languages } from "lucide-react";
import ProgressCircle from "./ProgressCircle";
import { useRef, useState } from "react";
import { useLanguagePreview } from "@/providers/LanguagePreviewProvider";
import rawCoverage from "../../../messages/coverage.json";
import { useTheme } from "@/providers/SiteThemeProvider";
import Popover from "@/components/popover";
import Dropdown from "@/components/dropdown";
import { Button } from "@heroui/react";
import { LanguageInfo } from "@/types/LanguageInfoType";

type CoverageMap = {
  [key: string]: number;
};

const coverage = rawCoverage as CoverageMap;

function waveText(label: string, shouldAnimate: boolean) {
  return (
    <div className="flex">
      {label.split("").map((char, i) => (
        <span
          key={i}
          className={`inline-block transition-transform ${
            shouldAnimate ? "animate-smallwave" : ""
          }`}
          style={shouldAnimate ? { animationDelay: `${i * 60}ms` } : {}}
        >
          {char}
        </span>
      ))}
    </div>
  );
}

export default function LanguageDropdown({
  languages,
}: {
  languages: LanguageInfo[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const { setPreviewLocale, previewLocale } = useLanguagePreview();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { siteTheme } = useTheme();

  function handleChange(key: string) {
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
      <Popover shown={!!previewLocale}>Previewing {previewLocale}</Popover>
      <Dropdown
        onOpenChange={setIsOpen}
        openOn="hover"
        trigger={
          <Button
            size="sm"
            startContent={
              <Languages
                size={16}
                className={`transition-transform duration-500 ${
                  isOpen ? "rotate-[360deg]" : "rotate-0"
                }`}
                style={{
                  color: siteTheme.colors["text"],
                }}
              />
            }
            endContent={
              <ChevronDown
                size={16}
                className={`transform transition-transform duration-200 ${
                  isOpen ? "rotate-180" : "rotate-0"
                }`}
                style={{
                  color: siteTheme.colors["text"],
                }}
              />
            }
            variant="light"
            onClick={() => {
              if (isOpen) {
                setIsOpen(false);
              }
            }}
          />
        }
      >
        {languages.map(
          ({ key, label, colorPrimary, colorSecondary, colorBg }) => {
            const isHovered = hoveredKey === key;
            const percent = coverage[key] ?? 0; // default to 0 if missing

            return (
              <div
                key={key}
                className={`w-full transition-all duration-200 cursor-pointer`}
                style={{
                  backgroundColor: isHovered ? colorBg : undefined,
                }}
                onClick={() => handleChange(key)}
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
                <div
                  className="w-full flex items-center justify-between gap-2 p-2 rounded-lg"
                  style={{
                    backgroundColor:
                      hoveredKey === key
                        ? siteTheme.colors["mantle"]
                        : undefined,
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span
                        className={`
                          absolute inline-flex h-full w-full rounded-full opacity-75
                          
                          ${isHovered ? "animate-[ping_1.2s_infinite]" : ""}
                        `}
                        style={{
                          backgroundColor: siteTheme.colors[colorPrimary],
                        }}
                      />
                      <div
                        className={`w-2.5 h-2.5 rounded-full relative z-10`}
                        style={{
                          backgroundColor: siteTheme.colors[colorPrimary],
                        }}
                      />
                    </div>
                    <span
                      className="text-transparent bg-clip-text"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${siteTheme.colors[colorPrimary]}, ${siteTheme.colors[colorSecondary]})`,
                      }}
                    >
                      {waveText(label, hoveredKey === key)}
                    </span>
                  </div>
                  <ProgressCircle
                    percent={percent}
                    hovered={isHovered}
                    hoverPrimary={siteTheme.colors[colorPrimary]}
                    hoverSecondary={siteTheme.colors[colorSecondary]}
                  />
                </div>
              </div>
            );
          }
        )}
      </Dropdown>
    </div>
  );
}
