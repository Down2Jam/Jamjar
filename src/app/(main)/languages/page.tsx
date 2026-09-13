"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useEffect, useState } from "react";
import { useLanguages } from "@/hooks/useLanguages";
import { useLanguageSelection } from "@/hooks/useLanguageSelection";
import { useTheme } from "@/providers/useSiteTheme";

export default function LanguagesPage() {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
  const { languages, isError, isPending: loadingUsage } = useLanguages();
  const { mutate, isPending, error, selectedLocale, setPreviewLocale } = useLanguageSelection();
  const [search, setSearch] = useState("");
  useEffect(() => () => setPreviewLocale(null), [setPreviewLocale]);
  const visible = languages.filter(({ label, key }) =>
    `${label} ${key}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()),
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8" style={{ color: colors.text }}>
      <header className="mb-8 py-2 text-center">
        <h1 className="text-3xl font-semibold">{uiText("AppStrings.Languages")}</h1>
        <p className="mx-auto mt-2 max-w-2xl text-sm">
           {uiText("AppStrings.ChooseYourSiteLanguageHoverOrFocusALanguageToPreviewItUntranslatedTextIsShownInEnglis")} </p>
        <input
          type="search"
          aria-label={uiText("AppStrings.SearchLanguages")}
          placeholder={uiText("AppStrings.SearchLanguages2")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="mt-5 w-full max-w-md rounded-lg border px-4 py-2 outline-none focus-visible:ring-2 focus-visible:ring-current"
          style={{ backgroundColor: colors.mantle, borderColor: colors.base }}
        />
      </header>
      {isError && <p role="status" className="mb-4 text-sm">{uiText("AppStrings.UserCountsAreTemporarilyUnavailableYouCanStillChooseAnyLanguage")}</p>}
      {error && <p role="alert" className="mb-4 text-sm" style={{ color: colors.red }}>{error.message}</p>}
      <section aria-label={uiText("AppStrings.AvailableLanguages")} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((language) => {
          const selected = selectedLocale === language.key;
          return (
            <button
              key={language.key}
              type="button"
              aria-pressed={selected}
              disabled={isPending}
              className="cursor-pointer rounded-2xl border p-5 text-left shadow-lg outline-none transition duration-200 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-current disabled:opacity-50"
              style={{ backgroundColor: colors.mantle, borderColor: selected ? colors.blue : colors.base }}
              onClick={() => mutate(language.key)}
              onMouseEnter={() => setPreviewLocale(language.key)}
              onMouseLeave={() => setPreviewLocale(null)}
              onFocus={() => setPreviewLocale(language.key)}
              onBlur={() => setPreviewLocale(null)}
            >
              <span className="flex items-center justify-between gap-3">
                <span lang={language.key} className="text-lg font-semibold">{language.label}</span>
                {selected && <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ backgroundColor: colors.green, color: colors.crust }}>{uiText("AppStrings.Selected2")}</span>}
              </span>
              <span className="mt-1 block text-xs" style={{ color: colors.textFaded }}>
                {language.key} · {isError || loadingUsage ? uiText("AppStrings.UserCountUnavailable") : uiText("AppStrings.Value0Value1", { value0: language.usageCount, value1: language.usageCount === 1 ? "user" : "users" })}
              </span>
              <span className="mt-6 mb-2 block text-sm">{language.coverage}{uiText("AppStrings.Translated")}</span>
              <span className="block h-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.base }}>
                <span className="block h-full rounded-full" style={{ width: `${language.coverage}%`, backgroundColor: colors[language.colorPrimary] ?? colors.blue }} />
              </span>
            </button>
          );
        })}
      </section>
      {visible.length === 0 && <p className="py-8 text-center">{uiText("AppStrings.NoLanguagesMatchYourSearch")}</p>}
    </main>
  );
}
