"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { ChevronDown, Languages } from "lucide-react";
import { useEffect, useState, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { useTheme } from "@/providers/useSiteTheme";
import { Button, Dropdown } from "bioloom-ui";
import type { LanguageInfo } from "@/types/LanguageInfoType";
import { useLanguages } from "@/hooks/useLanguages";
import { useLanguageSelection } from "@/hooks/useLanguageSelection";
import ProgressCircle from "./ProgressCircle";

export default function LanguageDropdown({ languages }: { languages: LanguageInfo[] }) {
  const uiText = useUiTranslations();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const { languages: rankedLanguages } = useLanguages(languages);
  const { mutate, isPending, error, selectedLocale, setPreviewLocale } = useLanguageSelection();

  useEffect(() => () => setPreviewLocale(null), [setPreviewLocale]);

  function clearPreview() {
    setHoveredKey(null);
    setPreviewLocale(null);
  }

  function browseAll(event: MouseEvent) {
    clearPreview();
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    setIsOpen(false);
    navigate("/languages");
  }

  return (
    <Dropdown
      openOn="click"
      isOpen={isOpen}
      onOpenChange={(open) => { setIsOpen(open); if (!open) clearPreview(); }}
      className="min-w-[15rem]"
      menuStyle={{ maxHeight: "min(24rem, calc(100dvh - 32px))" }}
      trigger={
        <Button
          size="sm"
          variant="ghost"
          aria-label={uiText("AppStrings.ChooseLanguage")}
          leftSlot={<Languages size={16} className={`transition-transform duration-500 ${isOpen ? "rotate-[360deg]" : "rotate-0"}`} />}
          rightSlot={<ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`} />}
          style={{ color: colors.text }}
        />
      }
    >
      <div className="flex flex-col gap-1">
        {rankedLanguages.slice(0, 7).map((language) => (
          <button
            key={language.key}
            type="button"
            role="menuitemradio"
            aria-checked={selectedLocale === language.key}
            disabled={isPending}
            className="flex min-h-10 w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-current disabled:opacity-50"
            style={{ color: colors.text, backgroundColor: hoveredKey === language.key ? colors.base : "transparent" }}
            onClick={() => mutate(language.key, { onSuccess: () => { clearPreview(); setIsOpen(false); } })}
            onMouseEnter={() => { setHoveredKey(language.key); setPreviewLocale(language.key); }}
            onMouseLeave={clearPreview}
            onFocus={() => { setHoveredKey(language.key); setPreviewLocale(language.key); }}
            onBlur={clearPreview}
          >
            <span className="relative size-2.5 shrink-0">
              <span
                className={`absolute inline-flex size-full rounded-full opacity-75 ${hoveredKey === language.key ? "animate-[ping_1.2s_infinite]" : ""}`}
                style={{ backgroundColor: colors[language.colorPrimary] }}
              />
              <span className="relative block size-full rounded-full" style={{ backgroundColor: colors[language.colorPrimary] }} />
            </span>
            <span lang={language.key} className="min-w-0 flex-1 text-sm font-medium" aria-label={language.label}>
              {Array.from(language.label).map((char, index) => (
                <span
                  key={index}
                  aria-hidden="true"
                  className={`inline-block whitespace-pre bg-clip-text text-transparent transition-transform ${hoveredKey === language.key ? "animate-smallwave" : ""}`}
                  style={{
                    backgroundImage: `linear-gradient(to right, ${colors[language.colorPrimary]}, ${colors[language.colorSecondary]})`,
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  {char}
                </span>
              ))}
            </span>
            <ProgressCircle
              percent={language.coverage}
              hovered={hoveredKey === language.key}
              hoverPrimary={colors[language.colorPrimary]}
              hoverSecondary={colors[language.colorSecondary]}
            />
          </button>
        ))}
        {error && <p role="alert" className="px-3 py-2 text-sm" style={{ color: colors.red }}>{error.message}</p>}
        <div className="mt-1 border-t pt-1" style={{ borderColor: `color-mix(in srgb, ${colors.text} 12%, transparent)` }}>
          <Dropdown.Item value="view-all-languages" href="/languages" className="!min-h-10 !px-3 !py-2 focus-visible:!ring-2 focus-visible:!ring-current" onClick={browseAll}>
             {uiText("AppStrings.ViewAllLanguages")} </Dropdown.Item>
        </div>
      </div>
    </Dropdown>
  );
}
