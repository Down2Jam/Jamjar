"use client";

import { ChevronDown, PaintBucket } from "lucide-react";
import { useRef, useState } from "react";
import { useTheme } from "@/providers/useSiteTheme";
import { Button, Dropdown, Popover } from "bioloom-ui"; // <-- your custom Dropdown

function waveText(label: string, shouldAnimate: boolean) {
  return (
    <span className="flex">
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
    </span>
  );
}

export default function SiteThemeDropdown() {
  const { siteTheme, allSiteThemes, setSiteTheme, setPreviewedSiteTheme } =
    useTheme();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(false);

  isOpenRef.current = isOpen;

  function handleChange(filename: string) {
    setSiteTheme(filename);
    setIsOpen(false);
    setHoveredKey(null);
  }

  return (
    <>
      <Popover shown={!!hoveredKey}>Previewing {hoveredKey}</Popover>
      <Dropdown
        openOn="hover"
        onOpenChange={setIsOpen}
        isOpen={isOpen}
        className="gap-1 flex flex-col"
        trigger={
          <Button
            size="sm"
            variant="ghost"
            leftSlot={
              <PaintBucket
                size={16}
                className={`transition-transform duration-500 ${
                  isOpen ? "rotate-[360deg]" : "rotate-0"
                }`}
                style={{ color: siteTheme.colors["text"] }}
              />
            }
            rightSlot={
              <ChevronDown
                size={16}
                className={`transform transition-transform duration-200 ${
                  isOpen ? "rotate-180" : "rotate-0"
                }`}
                style={{ color: siteTheme.colors["text"] }}
              />
            }
            style={{ color: siteTheme.colors["text"] }}
          />
        }
      >
        {allSiteThemes.map((siteThemeOption) => (
          <div
            key={siteThemeOption.name}
            className="cursor-pointer hover:bg-opacity-20 rounded px-2 py-1 duration-200 transition-colors flex items-center justify-between"
            onClick={() => handleChange(siteThemeOption.name)}
            onMouseMove={() => {
              if (!isOpenRef.current) return;

              if (hoverTimeoutRef.current)
                clearTimeout(hoverTimeoutRef.current);
              setPreviewedSiteTheme(siteThemeOption.name);
              setHoveredKey(siteThemeOption.name);
            }}
            onMouseLeave={() => {
              if (!isOpenRef.current) return;

              hoverTimeoutRef.current = setTimeout(() => {
                if (hoveredKey === siteThemeOption.name) {
                  setPreviewedSiteTheme(null);
                  setHoveredKey(null);
                }
              }, 300);
            }}
            style={{
              backgroundColor:
                hoveredKey === siteThemeOption.name
                  ? siteThemeOption.colors["mantle"]
                  : siteThemeOption.colors["crust"],
            }}
          >
            <p style={{ color: siteThemeOption.colors["text"] }}>
              {waveText(
                siteThemeOption.name,
                hoveredKey === siteThemeOption.name
              )}
            </p>
            <div className="flex gap-1 ml-10">
              {["crust", "mantle", "base", "text"].map((key) => (
                <div
                  key={key}
                  className="w-4 h-4 border"
                  style={{
                    backgroundColor: siteThemeOption.colors[key],
                    borderColor: siteThemeOption.colors["gray"],
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </Dropdown>
    </>
  );
}
