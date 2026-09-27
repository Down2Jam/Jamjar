import { useState } from "react";
import { Button, Hstack, Text, Vstack, addToast } from "bioloom-ui";
import { useTranslations } from "@/compat/next-intl";
import { useSelf } from "@/hooks/queries";
import { joinJam } from "@/helpers/jam";
import type { JamType } from "@/types/JamType";

export default function NextJamInvitation({ jams, recapJam, preview = false }: {
  jams: JamType[];
  recapJam?: JamType | null;
  preview?: boolean;
}) {
  const t = useTranslations();
  const { data: self, isLoading, refetch } = useSelf();
  const [joinedId, setJoinedId] = useState<number | null>(null);
  const [joining, setJoining] = useState(false);
  const cutoff = Math.max(Date.now(), new Date(recapJam?.startTime ?? 0).getTime());
  const nextJam = jams.filter((jam) => !jam.sourcePlatform && new Date(jam.startTime).getTime() > cutoff)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
  if (!nextJam) return null;

  const joined = joinedId === nextJam.id || self?.jams?.some((jam) => jam.id === nextJam.id);

  async function handleJoin() {
    if (!nextJam || joining) return;
    setJoining(true);
    try {
      if (!await joinJam(nextJam.id)) throw new Error("Could not join jam");
      setJoinedId(nextJam.id);
      void refetch();
      addToast({ title: t("AppStrings.JoinedJam") });
    } catch {
      addToast({ title: t("AppStrings.FailedToJoinJam") });
    } finally {
      setJoining(false);
    }
  }

  return (
    <section className="w-full py-12 text-center">
      <Vstack align="center" gap={4}>
        <Text color="textFaded">{t("AppStrings.NextJam")}</Text>
        <Text size="3xl" weight="bold">{nextJam.name}</Text>
        <Text color="textFaded">
          {new Date(nextJam.startTime).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        </Text>
        <Hstack justify="center" wrap>
          {joined ? (
            <Button icon="calendarplus" color="green" disabled>
              {t("AppStrings.JoinedJam")}
            </Button>
          ) : self ? (
            <Button icon="calendarplus" color="green" onClick={handleJoin} disabled={preview || joining || isLoading}>
              {t("Navbar.JoinJam.Title")}
            </Button>
          ) : (
            <Button href="/signup" icon="login" color="green" disabled={preview || isLoading}>
              {t("Navbar.JoinJam.Title")}
            </Button>
          )}
        </Hstack>
      </Vstack>
    </section>
  );
}
