"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Button, Spinner, Hstack, Vstack, Text, Icon } from "bioloom-ui";
import { createPostJamVersion, getGame } from "@/requests/game";
import { GameType, PageVersion } from "@/types/GameType";
import { use, useEffect, useMemo, useState } from "react";
import GameEditingForm from "../../../../../components/game-editing-form/GameEditingForm";
import { useCurrentJam } from "@/hooks/queries";
import PageCard from "@/components/PageCard";
import { Gamepad2 } from "lucide-react";
import { addToast } from "bioloom-ui";
import { getSelectedGamePage, materializeGamePage } from "@/helpers/gamePages";
import { getApiErrorMessage, readItem } from "@/requests/helpers";

export default function ClientGameEditPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
  const uiText = useUiTranslations();
  const resolvedParams = use(params);
  const gameSlug = resolvedParams.gameSlug;
  const [loading, setLoading] = useState<boolean>(true);
  const [creatingPostJamVersion, setCreatingPostJamVersion] =
    useState<boolean>(false);
  const [game, setGame] = useState<GameType>();
  const [selectedVersion, setSelectedVersion] = useState<PageVersion>("JAM");
  const { data: activeJamResponse } = useCurrentJam();

  useEffect(() => {
    const load = async () => {
      try {
        const gameResponse = await getGame(gameSlug);

        if (gameResponse.ok) {
          const payload = await readItem<GameType>(gameResponse);
          if (!payload) return;
          setGame(payload);
          setSelectedVersion(
            payload.category !== "EXTERNAL" && payload.postJamPage
              ? "POST_JAM"
              : "JAM",
          );
        }

        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    };
    load();
  }, [gameSlug]);

  const canCreateOrEditPostJamVersion =
    !!game &&
    game.category !== "EXTERNAL" &&
    (!activeJamResponse?.jam ||
      activeJamResponse.jam.id !== game.jamId ||
      activeJamResponse.phase === "Post-Jam Refinement" ||
      activeJamResponse.phase === "Post-Jam Rating");

  const formGame = useMemo(() => {
    if (!game) return undefined;
    const selectedPage = getSelectedGamePage(game, selectedVersion);
    if (selectedPage) {
      return materializeGamePage(game, selectedPage, false);
    }
    return game;
  }, [game, selectedVersion]);

  if (loading) {
    return (
      <PageCard icon={Gamepad2} title={uiText("CreateGame.Edit.Title")} description={uiText("CreateGame.Edit.Description")}>
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">{uiText("AppStrings.Loading")}</Text>
            </Hstack>
            <Text color="textFaded">{uiText("AppStrings.LoadingEditPage")}</Text>
          </Vstack>
      </PageCard>
    );
  }

  if (!game || !formGame) {
    return (
      <PageCard icon={Gamepad2} title={uiText("CreateGame.Edit.Title")} description={uiText("CreateGame.Edit.Description")}>
          <Vstack>
            <Hstack>
              <Icon name="x" />
              <Text size="xl">{uiText("AppStrings.InvalidPermissions")}</Text>
            </Hstack>
            <Text color="textFaded">
               {uiText("AppStrings.YouDoNotHaveAccessToEditingThis")} </Text>
          </Vstack>
      </PageCard>
    );
  }

  return (
    <PageCard hasTabs icon={Gamepad2} title={uiText(selectedVersion === "POST_JAM" ? "AppStrings.EditPostJamPage" : "CreateGame.Edit.Title")} description={uiText(selectedVersion === "POST_JAM" ? "AppStrings.EditThePostJamVersionOfYourGamePage" : "CreateGame.Edit.Description")}>
      {canCreateOrEditPostJamVersion && !game.postJamPage && (
        <Vstack>
            <Button
              icon="plus"
              disabled={creatingPostJamVersion}
              onClick={async () => {
                setCreatingPostJamVersion(true);
                const response = await createPostJamVersion(game.slug);

                if (response.ok) {
                  const nextGame = await getGame(game.slug);
                  if (nextGame.ok) {
                    const payload = await readItem<GameType>(nextGame);
                    if (payload) {
                      setGame(payload);
                      setSelectedVersion("POST_JAM");
                    }
                  }
                } else {
                  addToast({
                    title:
                      getApiErrorMessage(await response.json().catch(() => null)) ||
                      uiText("AppStrings.FailedToCreatePostJamVersion"),
                  });
                }

                setCreatingPostJamVersion(false);
              }}
            >
               {uiText("AppStrings.CreateAPostJamVersionOfThePage")} </Button>
        </Vstack>
      )}

      <div className="min-w-0 [&_.game-editor-tabs]:w-full [&_.game-editor-tabs>[role=tabpanel]]:border-0! [&_.game-editor-tabs>[role=tabpanel]]:rounded-none! [&_.game-editor-tabs>[role=tabpanel]]:bg-transparent! [&_.game-editor-tabs>[role=tabpanel]]:px-2! sm:[&_.game-editor-tabs>[role=tabpanel]]:px-3! max-[700px]:[&_.game-editor-tabs>[role=tabpanel]]:px-0!">
        <GameEditingForm hideHeading musicTabs game={formGame} pageVersion={selectedVersion} onPageVersionChange={canCreateOrEditPostJamVersion && game.postJamPage ? setSelectedVersion : undefined} />
      </div>
    </PageCard>
  );
}
