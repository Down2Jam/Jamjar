"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { ChevronDown, PaintBucket } from "lucide-react";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "@/providers/useSiteTheme";
import { Button, Dropdown, Popover } from "bioloom-ui";

const NAVBAR_THEME_LIMIT = 7;
const HOVER_PREVIEW_DELAY = 500;
const THEME_TRANSITION_DURATION = 250;

const THEME_SWATCHES = ["crust", "base", "text", "blue"] as const;

export default function SiteThemeDropdown() {
  const uiText = useUiTranslations();
  const navigate = useNavigate();
  const { siteTheme, allSiteThemes, setSiteTheme, setPreviewedSiteTheme } =
    useTheme();
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const hoveredKeyRef = useRef<string | null>(null);
  const previewDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const [previewedKey, setPreviewedKey] = useState<string | null>(null);
  const previewedKeyRef = useRef<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isOpenRef = useRef(false);
  const [selectedThemeName, setSelectedThemeName] = useState(siteTheme.name);
  const navbarThemes = allSiteThemes.slice(0, NAVBAR_THEME_LIMIT);

  isOpenRef.current = isOpen;

  useEffect(
    () => () => {
      if (previewDelayRef.current) clearTimeout(previewDelayRef.current);
      if (previewResetRef.current) clearTimeout(previewResetRef.current);
      if (transitionTimeoutRef.current)
        clearTimeout(transitionTimeoutRef.current);
      document.documentElement.classList.remove("theme-preview-transitioning");
      setPreviewedSiteTheme(null);
    },
    [setPreviewedSiteTheme],
  );

  function beginThemeTransition() {
    document.documentElement.classList.add("theme-preview-transitioning");
    if (transitionTimeoutRef.current)
      clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      document.documentElement.classList.remove("theme-preview-transitioning");
    }, THEME_TRANSITION_DURATION);
  }

  function clearPreviewTimers() {
    if (previewDelayRef.current) clearTimeout(previewDelayRef.current);
    if (previewResetRef.current) clearTimeout(previewResetRef.current);
  }

  function handleChange(filename: string) {
    clearPreviewTimers();
    beginThemeTransition();
    setSiteTheme(filename);
    setSelectedThemeName(filename);
    setPreviewedSiteTheme(null);
    previewedKeyRef.current = null;
    setPreviewedKey(null);
    setIsOpen(false);
    hoveredKeyRef.current = null;
    setHoveredKey(null);
  }

  function previewTheme(filename: string, immediate = false) {
    if (!isOpenRef.current) return;
    clearPreviewTimers();
    hoveredKeyRef.current = filename;
    setHoveredKey(filename);

    const applyPreview = () => {
      if (!isOpenRef.current || hoveredKeyRef.current !== filename) return;
      beginThemeTransition();
      setPreviewedSiteTheme(filename);
      previewedKeyRef.current = filename;
      setPreviewedKey(filename);
    };

    if (immediate) {
      applyPreview();
      return;
    }

    previewDelayRef.current = setTimeout(applyPreview, HOVER_PREVIEW_DELAY);
  }

  function clearThemePreview(filename: string, delay = 0) {
    if (!isOpenRef.current) return;
    if (hoveredKeyRef.current !== filename) return;
    if (previewDelayRef.current) clearTimeout(previewDelayRef.current);
    hoveredKeyRef.current = null;
    setHoveredKey(null);

    previewResetRef.current = setTimeout(() => {
      if (hoveredKeyRef.current === null) {
        if (previewedKeyRef.current) beginThemeTransition();
        setPreviewedSiteTheme(null);
        previewedKeyRef.current = null;
        setPreviewedKey(null);
      }
    }, delay);
  }

  function handleBrowseAllThemes(event: MouseEvent) {
    clearPreviewTimers();
    setPreviewedSiteTheme(null);
    previewedKeyRef.current = null;
    setPreviewedKey(null);
    hoveredKeyRef.current = null;
    setHoveredKey(null);

    if (
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    event.preventDefault();
    setIsOpen(false);
    navigate("/themes");
  }

  return (
    <>
      <Popover shown={!!previewedKey} showArrow={false}>
         {uiText("AppStrings.Previewing")} {previewedKey}
      </Popover>
      <Dropdown
        openOn="click"
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open) setSelectedThemeName(siteTheme.name);
          if (!open) {
            clearPreviewTimers();
            if (previewedKeyRef.current) beginThemeTransition();
            hoveredKeyRef.current = null;
            setHoveredKey(null);
            setPreviewedSiteTheme(null);
            previewedKeyRef.current = null;
            setPreviewedKey(null);
          }
        }}
        isOpen={isOpen}
        className="min-w-[15rem]"
        menuStyle={{ maxHeight: "min(24rem, calc(100dvh - 32px))" }}
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
        <div className="flex flex-col gap-1">
          {navbarThemes.map((siteThemeOption) => {
            const isSelected = selectedThemeName === siteThemeOption.name;
            const isHovered = hoveredKey === siteThemeOption.name;

            return (
              <button
                key={siteThemeOption.name}
                type="button"
                role="menuitemradio"
                aria-checked={isSelected}
                className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-current"
                onClick={() => handleChange(siteThemeOption.name)}
                onMouseEnter={() => previewTheme(siteThemeOption.name)}
                onMouseLeave={() => clearThemePreview(siteThemeOption.name)}
                onFocus={() => previewTheme(siteThemeOption.name, true)}
                onBlur={() => clearThemePreview(siteThemeOption.name, 0)}
                style={{
                  color: siteTheme.colors["text"],
                  backgroundColor: isHovered
                    ? siteTheme.colors["base"]
                    : "transparent",
                }}
              >
                <span className="min-w-0 flex-1 truncate text-sm font-medium">
                  {siteThemeOption.name}
                </span>
                <span className="flex shrink-0 gap-1" aria-hidden="true">
                  {THEME_SWATCHES.map((key) => (
                    <span
                      key={key}
                      className="size-[18px] rounded-[4px]"
                      style={{
                        backgroundColor: siteThemeOption.colors[key],
                        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${siteTheme.colors["text"]} 20%, transparent)`,
                      }}
                    />
                  ))}
                </span>
              </button>
            );
          })}
          <div
            className="mt-1 border-t pt-1"
            style={{
              borderColor: `color-mix(in srgb, ${siteTheme.colors["text"]} 12%, transparent)`,
            }}
          >
            <Dropdown.Item
              value="view-more-themes"
              href="/themes"
              icon="palette"
              kbd="G Y"
              className="!min-h-10 !px-3 !py-2 focus-visible:!ring-2 focus-visible:!ring-current"
              onClick={handleBrowseAllThemes}
            >
               {uiText("AppStrings.BrowseAllThemes")} </Dropdown.Item>
          </div>
        </div>
      </Dropdown>
    </>
  );
}
