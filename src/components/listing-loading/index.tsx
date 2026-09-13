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

  return (
    <div role="status" aria-label={t("AppStrings.Loading")} aria-busy="true" className="w-full">
      <div aria-hidden="true" className={`motion-safe:animate-pulse ${kind === "games" ? "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4" : "mx-auto flex max-w-4xl flex-col gap-2"}`}>
        {Array.from({ length: count }, (_, index) => (
          <Card key={index} padding={0} shadow="none" className="overflow-hidden">
            {kind === "games" ? (
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
            ) : (
              <div className="flex min-h-24 min-w-0 items-center justify-between gap-4 p-3 sm:p-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {block("h-24 w-24 shrink-0")}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    {block("h-7 w-2/3")}
                    {block("h-4 w-1/2")}
                    {block("h-5 w-1/3")}
                    {block("h-5 w-3/4")}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {block("h-9 w-14")}
                  {block("h-9 w-14")}
                </div>
              </div>
            )}
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
    <div className="mx-auto w-full max-w-7xl">
      <header className="py-2 text-center">
        <h1 className="text-3xl font-semibold">{t("Navbar.Music.Title")}</h1>
        <p className="mt-1 text-sm">{t("AppStrings.AllTheMusicUploadedToTheSite")}</p>
      </header>
      <div aria-hidden="true" className={`mb-4 flex gap-2 motion-safe:animate-pulse ${kind === "music" ? "justify-center" : "px-6"}`}>
        {[0, 1, 2].map((index) => <div key={index} className="h-10 w-24 rounded-md bg-current/10" />)}
      </div>
      {kind === "music" && <div className="mb-2"><TrackCountSkeleton /></div>}
      <ListingSkeleton kind={kind} />
    </div>
  );
}
