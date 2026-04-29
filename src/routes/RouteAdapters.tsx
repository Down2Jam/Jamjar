import { useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import type { PageVersion } from "@/types/GameType";
import CollectionPage from "@/app/(main)/collections/[collectionId]/page";
import DocumentationSectionPage from "@/components/documentation/DocumentationSectionPage";
import ClientGamePage from "@/app/(main)/g/[gameSlug]/ClientGamePage";
import ClientGameEditPage from "@/app/(main)/g/[gameSlug]/edit/ClientGameEditPage";
import ClientTrackPage from "@/app/(main)/m/[trackSlug]/ClientTrackPage";
import ClientTrackEditPage from "@/app/(main)/m/[trackSlug]/edit/ClientTrackEditPage";
import { RadioStationPage } from "@/app/(main)/radio/page";
import type { RadioStation } from "@/requests/radio";
import RecapPage from "@/components/recap";
import ClientUserPage from "@/app/(main)/u/[slug]/ClientUserPage";
import { getRandomGame } from "@/requests/game";
import { readItem } from "@/requests/helpers";

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
  const { slug = "" } = useParams();
  return (
    <DocumentationSectionPage
      section="DOCS"
      title="Documentation"
      description="Site documentation and guides."
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
  const { slug = "" } = useParams();
  return (
    <DocumentationSectionPage
      section="PRESS_KIT"
      title="Press Kit"
      description="A collection of materials for promotional use."
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
  return <ClientUserPage params={params as Promise<{ slug: string }>} />;
}
