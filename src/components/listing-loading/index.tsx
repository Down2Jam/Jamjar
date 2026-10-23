import type { CSSProperties } from "react";
import { Star } from "lucide-react";

import { Card, Hstack, Vstack, Icon, Text } from "bioloom-ui";
import { useTranslations } from "@/compat/next-intl";
import { useTheme } from "@/providers/useSiteTheme";

export function ListingSkeleton({ kind, count = kind === "games" ? 12 : 8 }: {
  kind: "games" | "music";
  count?: number;
}) {
  const t = useTranslations();
  const { colors } = useTheme();
  const backgroundColor = `color-mix(in srgb, ${colors.text} 6%, ${colors.mantle})`;
  const block = (className: string) => (
    <div className={`rounded-md ${className}`} style={{ backgroundColor }} />
  );

  if (kind === "music") return (
    <div role="status" aria-label={t("AppStrings.Loading")} aria-busy="true" className="w-full">
      <div aria-hidden="true">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex min-h-24 min-w-0 flex-wrap items-center justify-between gap-4 p-3 sm:p-4" style={{ backgroundColor: index % 2 ? `color-mix(in srgb, ${colors.text} 4%, ${colors.mantle})` : colors.mantle }}>
            <div className="flex min-w-0 flex-1 items-center gap-3 motion-safe:animate-pulse">
              <div className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full" style={{ backgroundColor }}>
                <div className="grid h-5 w-5 place-items-center rounded-full border" style={{ borderColor: `color-mix(in srgb, ${colors.text} 12%, transparent)` }}>
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.mantle }}/>
                </div>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex h-7 items-center">{block(`h-4 ${index % 3 === 0 ? "w-44" : index % 3 === 1 ? "w-32" : "w-52"} max-w-full`)}</div>
                <div className="flex h-4 items-center">{block("h-2.5 w-24 max-w-full")}</div>
                <div className="flex h-5 items-center gap-1">{block("h-3 w-3 shrink-0 !rounded-full")}{block("h-3 w-20 max-w-full")}</div>
                {block("h-5 w-48 max-w-full !rounded")}
              </div>
            </div>
            <div className="ml-auto flex shrink-0 items-center gap-2 motion-safe:animate-pulse">
              <div className="mr-2 flex gap-1" style={{ color: backgroundColor }}>{Array.from({ length: 5 }, (_, star) => <Star key={star} size={16} fill="currentColor"/>)}</div>
              {block("h-9 w-14")}
              {block("h-9 w-14")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div role="status" aria-label={t("AppStrings.Loading")} aria-busy="true" className="w-full">
      <div aria-hidden="true" className="motion-safe:animate-pulse grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: count }, (_, index) => (
          <Card key={index} padding={0} shadow="none" className="overflow-hidden">
              <>
                {block("aspect-[9/5] w-full !rounded-none")}
                <div className="flex items-center justify-between gap-2 border-t px-4 pb-4 pt-2" style={{ borderColor: backgroundColor }}>
                  <div className="min-w-0 flex-1">
                    <div className="flex h-8 items-center">{block("h-6 w-3/4")}</div>
                    <div className="flex h-5 items-center">{block("h-3 w-full")}</div>
                    <div className="flex h-4 items-center">{block("h-3 w-1/2")}</div>
                  </div>
                  {block("h-4 w-4 shrink-0")}
                </div>
              </>


          </Card>
        ))}
      </div>
    </div>
  );
}

export function TrackCountSkeleton() {
  return (
    <div aria-hidden="true" className="flex h-5 items-center justify-center">
      <div className="h-4 w-16 rounded-md bg-current/10 motion-safe:animate-pulse" />
    </div>
  );
}

export function GamesListingHeading({ totalGames }: { totalGames?: number }) {
  const t = useTranslations();
  const { siteTheme } = useTheme();
  const textStyle = siteTheme.type === "Light" ? {} : {
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.85), 0 6px 14px rgba(0, 0, 0, 0.55), 0 18px 36px rgba(0, 0, 0, 0.35)",
  };
  return (
    <Vstack align="start" gap={1} className="col-span-2 min-w-0">
      <Hstack className="gap-3">
        <Icon name="gamepad2" color="text" size={40} style={siteTheme.type === "Light" ? {} : {
          filter: "drop-shadow(0 2px 3px rgba(0, 0, 0, 0.85)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.55)) drop-shadow(0 18px 30px rgba(0, 0, 0, 0.35))",
        }} />
        <Text size="4xl" color="text" weight="semibold" style={textStyle}>Games.Title</Text>
        {totalGames === undefined ? (
          <span aria-hidden="true" className="h-7 w-28 shrink-0 flex items-center motion-safe:animate-pulse">
            <span className="h-5 w-full rounded-md bg-current/10" />
          </span>
        ) : (
          <Text size="xl" color="text" className="shrink-0" style={{ ...textStyle, whiteSpace: "nowrap" }}>
            ({totalGames} {t("AppStrings.Results")})
          </Text>
        )}
      </Hstack>
      <Text size="md" color="text" align="left" style={textStyle}>Games.Description</Text>
    </Vstack>
  );
}

export default function ListingPageLoading({ kind }: { kind: "games" | "music" }) {
  const t = useTranslations();
  const { colors } = useTheme();
  if (kind === "games") {
    return (
      <>
        <Vstack align="stretch" className="p-4 gap-2">
          <div className="m-2 grid w-full grid-cols-[minmax(0,1fr)_auto] items-end gap-x-4 gap-y-2">
            <GamesListingHeading />
            <div aria-hidden="true" className="col-start-1 row-start-2 mx-1 mt-1 inline-flex items-center gap-2">
              <Icon name="settings2" color="text" size={16} />
              <Text size="sm" color="text" weight="semibold">{t("AppStrings.AdvancedSearch")}</Text>
              <Icon name="chevrondown" color="text" size={16} />
            </div>
            <div aria-hidden="true" className="col-start-2 row-start-2 h-9 w-32 rounded-md bg-current/10 motion-safe:animate-pulse" />
          </div>
          <Vstack align="stretch" className="mx-2 mt-0 mb-1 gap-2" />
        </Vstack>
        <ListingSkeleton kind="games" />
      </>
    );
  }
  return (
    <Vstack align="stretch" className={"music-library-shell box-border rounded-[14px] w-full max-w-[1200px] m-[0_auto] p-[32px] gap-[18px]! [background:var(--music-surface)] text-[var(--music-text)] [box-shadow:-22px_0_34px_-18px_rgb(0_0_0_/_78%),22px_0_34px_-18px_rgb(0_0_0_/_78%)] max-[700px]:p-[20px_12px] max-[700px]:gap-[14px]! "} style={{ "--music-surface": colors.mantle, "--music-text": colors.text, "--music-muted": colors.textFaded, "--music-accent": colors.blue, "--music-line": colors.base } as CSSProperties}>
      <header className={"music-library-heading [&_h1]:m-0 [&_h1]:text-[clamp(36px,4vw,52px)] [&_h1]:font-bold [&_h1]:leading-[1.15] [&_h1]:tracking-[-.035em] max-[700px]:[&_h1]:text-[36px] "}><h1>{t("Navbar.Music.Title")}</h1></header>
      <div aria-hidden="true" className={"music-library-tabs flex gap-[28px] [scrollbar-width:thin] [border-bottom:1px_solid_color-mix(in_srgb,var(--music-text)_9%,transparent)] m-[0_0_6px] p-0 flex-wrap overflow-visible justify-between gap-x-[24px] gap-y-0 [&_button]:relative [&_button]:flex-none [&_button]:p-[12px_0] [&_button]:[border:0] [&_button]:bg-transparent [&_button]:text-[var(--music-muted)] [&_button]:text-[15px] [&_button]:font-semibold [&_button]:whitespace-nowrap [&_button]:cursor-[pointer] [&_button:is(:hover,[aria-current=page])]:text-[var(--music-accent)] [&_button[aria-current=page]::after]:[content:''] [&_button[aria-current=page]::after]:absolute [&_button[aria-current=page]::after]:left-0 [&_button[aria-current=page]::after]:right-0 [&_button[aria-current=page]::after]:bottom-0 [&_button[aria-current=page]::after]:h-[2px] [&_button[aria-current=page]::after]:[background:var(--music-accent)] [&_button:focus-visible]:[outline:2px_solid_var(--music-accent)] [&_button:focus-visible]:outline-offset-[2px] [&_.music-library-more-sorts]:flex [&_.music-library-more-sorts]:items-center [&_.music-library-more-sorts]:justify-center [&_.music-library-more-sorts]:min-w-[28px] [&_.music-library-more-sorts]:px-[6px] [&_.music-library-jam-picker]:flex [&_.music-library-jam-picker]:items-center [&_.music-library-jam-picker]:justify-center [&_.music-library-jam-picker]:min-w-[28px] [&_.music-library-jam-picker]:px-[6px] [&_button:disabled]:opacity-[.45] [&_button:disabled]:cursor-[default]  motion-safe:animate-pulse"}>
        <div className="flex items-center gap-6 py-3"><span className="h-5 w-28 rounded bg-current/10"/><span className="h-5 w-16 rounded bg-current/10"/></div>
        <div className="ml-auto flex items-center gap-5 py-3"><span className="h-5 w-24 rounded bg-current/10"/><span className="h-5 w-16 rounded bg-current/10"/></div>
      </div>
      <div aria-hidden="true" className={"music-library-filters flex items-center justify-between flex-wrap gap-[14px_24px] w-full max-[700px]:justify-start max-[700px]:gap-[12px_20px]  motion-safe:animate-pulse"}>
        {[["Genre:", "w-32"], ["License:", "w-44"], ["Use Case:", "w-32"]].map(([label, width]) => <div key={label} className={"music-library-filter flex items-center gap-[10px] min-w-0 max-[700px]:flex-wrap max-[700px]:gap-[6px] "}><span className={"music-library-filter-label shrink-0 text-[var(--music-muted)] text-[13px] font-semibold "}>{label}</span><span className={`h-9 rounded-lg bg-current/10 ${width}`}/></div>)}
        <span className="h-8 w-32 rounded-lg bg-current/10"/>
      </div>
      <div className={"music-library-count text-[var(--music-muted)] mt-[2px] [&_*]:[text-shadow:none]!  flex min-h-5 items-center"}><TrackCountSkeleton/></div>
      <ListingSkeleton kind="music"/>
    </Vstack>
  );
}
