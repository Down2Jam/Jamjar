"use client";

import TrackEditingForm from "@/components/track-editing-form/TrackEditingForm";
import { getTrack } from "@/requests/track";
import { getSelf } from "@/requests/user";
import { Card, Hstack, Icon, Spinner, Text, Vstack } from "bioloom-ui";
import { use, useEffect, useState } from "react";
import { TrackType } from "@/types/TrackType";
import { UserType } from "@/types/UserType";

export default function ClientTrackEditPage({
  params,
}: {
  params: Promise<{ trackSlug: string }>;
}) {
  const resolvedParams = use(params);
  const trackSlug = resolvedParams.trackSlug;
  const [loading, setLoading] = useState(true);
  const [track, setTrack] = useState<TrackType | null>(null);
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const [trackResponse, userResponse] = await Promise.all([
          getTrack(trackSlug),
          getSelf().catch(() => null),
        ]);

        if (cancelled) return;

        if (trackResponse.ok) {
          setTrack(await trackResponse.json());
        } else {
          setTrack(null);
        }

        if (userResponse?.ok) {
          setUser(await userResponse.json());
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
  }, [trackSlug]);

  if (loading) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">Loading</Text>
            </Hstack>
            <Text color="textFaded">Loading track edit page...</Text>
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
            <Text size="xl">Track not found</Text>
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
              <Text size="xl">Invalid Permissions</Text>
            </Hstack>
            <Text color="textFaded">
              You do not have access to editing this track
            </Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  return <TrackEditingForm track={track} />;
}
