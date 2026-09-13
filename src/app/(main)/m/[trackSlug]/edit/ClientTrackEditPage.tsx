"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import TrackEditingForm from "@/components/track-editing-form/TrackEditingForm";
import { getTrack } from "@/requests/track";
import { getSelf } from "@/requests/user";
import { Card, Hstack, Icon, Spinner, Text, Vstack } from "bioloom-ui";
import { use, useEffect, useState } from "react";
import { TrackType } from "@/types/TrackType";
import { UserType } from "@/types/UserType";
import { PageVersion } from "@/types/GameType";
import { readItem } from "@/requests/helpers";

export default function ClientTrackEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ trackSlug: string }>;
  searchParams: Promise<{ pageVersion?: PageVersion }>;
}) {
  const uiText = useUiTranslations();
  const resolvedParams = use(params);
  const resolvedSearchParams = use(searchParams);
  const trackSlug = resolvedParams.trackSlug;
  const pageVersion =
    resolvedSearchParams.pageVersion === "POST_JAM" ? "POST_JAM" : "JAM";
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<TrackType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [trackResponse, userResponse] = await Promise.all([
          getTrack(trackSlug, pageVersion),
          getSelf().catch(() => null),
        ]);

        if (cancelled) return;

        if (trackResponse.ok) {
          setTrack(await readItem<TrackType>(trackResponse));
        } else {
          setTrack(null);
        }

        if (userResponse?.ok) {
          setUser(await readItem<UserType>(userResponse));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [pageVersion, trackSlug]);

  if (loading) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">{uiText("AppStrings.Loading")}</Text>
            </Hstack>
            <Text color="textFaded">{uiText("AppStrings.LoadingTrackEditPage")}</Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (!track) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Hstack>
            <Icon name="x" />
            <Text size="xl">{uiText("AppStrings.TrackNotFound")}</Text>
          </Hstack>
        </Card>
      </Vstack>
    );
  }

  const isTeamMember = Boolean(
    user && track.game?.team?.users?.some((member) => member.id === user.id),
  );

  if (!isTeamMember) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Icon name="x" />
              <Text size="xl">{uiText("AppStrings.InvalidPermissions")}</Text>
            </Hstack>
            <Text color="textFaded">
               {uiText("AppStrings.YouDoNotHaveAccessToEditingThis2")} </Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  return <TrackEditingForm track={track} />;
}
