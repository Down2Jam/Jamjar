"use client";

import { useEffect, useState } from "react";

import { useTheme } from "@/providers/useSiteTheme";
import type { SiteThemeType } from "@/types/SiteThemeType";

const previewAccents = ["blue", "green", "yellow", "pink"];

function ThemePreview({ theme }: { theme: SiteThemeType }) {
  const colors = theme.colors;

  return (
    <div
      className="overflow-hidden rounded-xl border"
      style={{
        backgroundColor: colors["crust"],
        borderColor: colors["base"],
      }}
    >
      <div
        className="flex h-10 items-center justify-between border-b px-3"
        style={{ borderColor: colors["base"] }}
      >
        <div className="flex items-center gap-2">
          <span
            className="h-4 w-4 rounded-md"
            style={{ backgroundColor: colors["blue"] }}
          />
          <span
            className="h-2.5 w-20 rounded-full"
            style={{ backgroundColor: colors["text"] }}
          />
        </div>
        <div className="flex gap-1.5">
          {previewAccents.map((accent) => (
            <span
              key={accent}
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: colors[accent] }}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_5rem] gap-3 p-3">
        <div className="space-y-2">
          <div
            className="rounded-lg border p-3"
            style={{
              backgroundColor: colors["mantle"],
              borderColor: colors["base"],
            }}
          >
            <div
              className="mb-2 h-2.5 w-2/3 rounded-full"
              style={{ backgroundColor: colors["text"] }}
            />
            <div
              className="h-2 w-full rounded-full"
              style={{ backgroundColor: colors["textFaded"] }}
            />
            <div
              className="mt-1.5 h-2 w-4/5 rounded-full"
              style={{ backgroundColor: colors["textFaded"] }}
            />
          </div>
          <div className="flex gap-2">
            <span
              className="h-7 grow rounded-md border"
              style={{
                backgroundColor: colors["blue"],
                borderColor: colors["blueDark"] ?? colors["blue"],
              }}
            />
            <span
              className="h-7 grow rounded-md border"
              style={{
                backgroundColor: colors["mantle"],
                borderColor: colors["base"],
              }}
            />
          </div>
        </div>
        <div
          className="rounded-lg border p-2"
          style={{
            backgroundColor: colors["mantle"],
            borderColor: colors["base"],
          }}
        >
          <div
            className="mx-auto mb-2 h-9 w-9 rounded-full"
            style={{ backgroundColor: colors["pink"] }}
          />
          <div
            className="mx-auto h-2 w-full rounded-full"
            style={{ backgroundColor: colors["text"] }}
          />
          <div
            className="mx-auto mt-1.5 h-2 w-3/4 rounded-full"
            style={{ backgroundColor: colors["textFaded"] }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ThemesPage() {
  const { siteTheme, allSiteThemes, setSiteTheme, setPreviewedSiteTheme } =
    useTheme();
  const headerColor = siteTheme.colors["text"];
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTheme && siteTheme.name !== "Dummy") {
      setSelectedTheme(siteTheme.name);
    }
  }, [selectedTheme, siteTheme.name]);

  useEffect(
    () => () => {
      setPreviewedSiteTheme(null);
    },
    [setPreviewedSiteTheme],
  );

  const selectTheme = (themeName: string) => {
    setPreviewedSiteTheme(null);
    setSiteTheme(themeName);
    setSelectedTheme(themeName);
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8 py-2 text-center">
        <p
          className="text-3xl font-semibold"
          style={{
            color: headerColor,
            textShadow:
              siteTheme.type === "Light"
                ? "none"
                : "0 1px 5px rgba(0, 0, 0, 0.75)",
          }}
        >
          Site themes
        </p>
        <p
          className="mx-auto mt-1 max-w-2xl text-sm"
          style={{
            color: headerColor,
            opacity: 0.82,
            textShadow:
              siteTheme.type === "Light"
                ? "none"
                : "0 1px 4px rgba(0, 0, 0, 0.8)",
          }}
        >
          Browse every available theme. Hover or focus a card to preview it
          across the page, then select it to save the choice to your account.
        </p>
      </header>

      <section
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        aria-label="Available site themes"
        role="radiogroup"
      >
        {allSiteThemes.map((theme) => {
          const isSelected = selectedTheme === theme.name;

          return (
            <article
              key={theme.name}
              tabIndex={0}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${theme.name}, ${theme.type} theme${isSelected ? ", selected" : ""}`}
              className="cursor-pointer rounded-2xl border p-4 shadow-lg outline-none transition duration-200 hover:-translate-y-1 focus-visible:-translate-y-1"
              style={{
                color: theme.colors["text"],
                backgroundColor: theme.colors["mantle"],
                borderColor: isSelected
                  ? theme.colors["blue"]
                  : theme.colors["base"],
                boxShadow: "0 14px 30px -16px rgba(0, 0, 0, 0.55)",
              }}
              onClick={() => selectTheme(theme.name)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                selectTheme(theme.name);
              }}
              onMouseEnter={() => setPreviewedSiteTheme(theme.name)}
              onMouseLeave={() => setPreviewedSiteTheme(null)}
              onFocus={() => setPreviewedSiteTheme(theme.name)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                  setPreviewedSiteTheme(null);
                }
              }}
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{theme.name}</h2>
                  <p
                    className="text-xs"
                    style={{ color: theme.colors["textFaded"] }}
                  >
                    {theme.type} theme · {theme.usageCount ?? 0}{" "}
                    {(theme.usageCount ?? 0) === 1 ? "user" : "users"}
                  </p>
                </div>
                {isSelected && (
                  <span
                    className="rounded-full px-2 py-1 text-xs font-bold"
                    style={{
                      color: theme.colors["crust"],
                      backgroundColor: theme.colors["green"],
                    }}
                  >
                    Selected
                  </span>
                )}
              </div>

              <ThemePreview theme={theme} />

              <div className="mt-4 flex items-center gap-3">
                <div className="flex gap-1.5" aria-label={`${theme.name} palette`}>
                  {["crust", "mantle", "base", "blue", "green", "pink"].map(
                    (color) => (
                      <span
                        key={color}
                        className="h-5 w-5 rounded border"
                        title={`${color}: ${theme.colors[color]}`}
                        style={{
                          backgroundColor: theme.colors[color],
                          borderColor: theme.colors["gray"],
                        }}
                      />
                    ),
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
