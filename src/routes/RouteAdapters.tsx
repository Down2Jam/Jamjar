import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { lazy, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import type { PageVersion } from "@/types/GameType";
import type { RadioStation } from "@/requests/radio";
import { getRandomGame } from "@/requests/game";
import { readItem } from "@/requests/helpers";

// Keep each detail page independent: viewing a game must not load the editors,
// profile, documentation, track, and recap pages alongside it.
const CollectionPage = lazy(() => import("@/app/(main)/c/[collectionId]/page"));
const DocumentationSectionPage = lazy(() => import("@/components/documentation/DocumentationSectionPage"));
const ClientGamePage = lazy(() => import("@/app/(main)/g/[gameSlug]/ClientGamePage"));
const ClientGameEditPage = lazy(() => import("@/app/(main)/g/[gameSlug]/edit/ClientGameEditPage"));
const ClientTrackPage = lazy(() => import("@/app/(main)/m/[trackSlug]/ClientTrackPage"));
const ClientTrackEditPage = lazy(() => import("@/app/(main)/m/[trackSlug]/edit/ClientTrackEditPage"));
const RadioStationPage = lazy(() => import("@/app/(main)/radio/page").then(module => ({ default: module.RadioStationPage })));
const RecapPage = lazy(() => import("@/components/recap"));
const ClientUserPage = lazy(() => import("@/app/(main)/u/[slug]/ClientUserPage"));

function usePromiseParams<T extends Record<string, string | undefined>>() {
  const params = useParams<T>();
  const paramsKey = JSON.stringify(params);
  return useMemo(() => Promise.resolve(params), [paramsKey]);
}

export function CollectionRoute() {
  const params = usePromiseParams<{ collectionId: string }>();
  return <CollectionPage params={params as Promise<{ collectionId: string }>} />;
}

export function DocsDetailRoute() {
  const uiText = useUiTranslations();
  const { slug = "" } = useParams();
  return (
    <DocumentationSectionPage
      section="DOCS"
      title={uiText("AppStrings.Documentation")}
      description={uiText("AppStrings.SiteDocumentationAndGuides")}
      basePath="/docs"
      icon="bookcopy"
      selectedSlug={slug}
    />
  );
}

export function GameRoute() {
  const params = usePromiseParams<{ gameSlug: string }>();
  return <ClientGamePage params={params as Promise<{ gameSlug: string }>} />;
}

export function GameEditRoute() {
  const params = usePromiseParams<{ gameSlug: string }>();
  return <ClientGameEditPage params={params as Promise<{ gameSlug: string }>} />;
}

export function PressKitDetailRoute() {
  const uiText = useUiTranslations();
  const { slug = "" } = useParams();
  return (
    <DocumentationSectionPage
      section="PRESS_KIT"
      title={uiText("Navbar.PressKit.Title")}
      description={uiText("AppStrings.ACollectionOfMaterialsForPromotionalUse")}
      basePath="/press-kit"
      icon="newspaper"
      selectedSlug={slug}
      defaultToFirstDocument={false}
      showPressKitGallery
    />
  );
}

export function LuckyRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    async function loadRandomGame() {
      const response = await getRandomGame();
      const game = await readItem<{ slug: string }>(response);
      if (!active) {
        return;
      }
      navigate(game?.slug ? `/g/${game.slug}` : "/games", { replace: true });
    }

    loadRandomGame();

    return () => {
      active = false;
    };
  }, [navigate]);

  return null;
}

export function RadioStationRoute() {
  const { station } = useParams();
  const normalizedStation: RadioStation = station === "safe" ? "safe" : "all";
  return <RadioStationPage station={normalizedStation} />;
}

export function RecapUserRoute() {
  const { userSlug = "" } = useParams();
  return <RecapPage targetUserSlug={userSlug} />;
}

export function TrackRoute() {
  const params = usePromiseParams<{ trackSlug: string }>();
  const [searchParams] = useSearchParams();
  const version = searchParams.get("pageVersion") as PageVersion | undefined;
  const nextSearchParams = useMemo(
    () => Promise.resolve({ pageVersion: version }),
    [version],
  );

  return (
    <ClientTrackPage
      params={params as Promise<{ trackSlug: string }>}
      searchParams={nextSearchParams}
    />
  );
}

export function TrackEditRoute() {
  const params = usePromiseParams<{ trackSlug: string }>();
  const [searchParams] = useSearchParams();
  const version = searchParams.get("pageVersion") as PageVersion | undefined;
  const nextSearchParams = useMemo(
    () => Promise.resolve({ pageVersion: version }),
    [version],
  );

  return (
    <ClientTrackEditPage
      params={params as Promise<{ trackSlug: string }>}
      searchParams={nextSearchParams}
    />
  );
}

export function UserRoute() {
  const params = usePromiseParams<{ slug: string }>();
  const { slug = "" } = useParams();
  return <ClientUserPage key={slug} params={params as Promise<{ slug: string }>} />;
}
