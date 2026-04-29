"use client";

import { Button, Card, Spinner, Hstack, Vstack, Text, Icon } from "bioloom-ui";
import { createPostJamVersion, getGame } from "@/requests/game";
import { GameType, PageVersion } from "@/types/GameType";
import { use, useEffect, useMemo, useState } from "react";
import GameEditingForm from "../../../../../components/game-editing-form/GameEditingForm";
import { useCurrentJam } from "@/hooks/queries";
import PageVersionToggle from "@/components/page-version-toggle/PageVersionToggle";
import { addToast } from "bioloom-ui";
import { getSelectedGamePage, materializeGamePage } from "@/helpers/gamePages";
import { readItem } from "@/requests/helpers";

export default function ClientGameEditPage({
  params,
}: {
  params: Promise<{ gameSlug: string }>;
}) {
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
          setSelectedVersion(payload?.postJamPage ? "POST_JAM" : "JAM");
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
    (!activeJamResponse?.jam ||
      activeJamResponse.jam.id !== game.jamId ||
      activeJamResponse.phase === "Post-Jam Refinement" ||
      activeJamResponse.phase === "Post-Jam Rating");

  const formGame = useMemo(() => {
    if (!game) return undefined;
    const selectedPage = getSelectedGamePage(game, selectedVersion);
    if (selectedPage) {
      return materializeGamePage(game, selectedPage);
    }
    return game;
  }, [game, selectedVersion]);

  if (loading) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Spinner />
              <Text size="xl">Loading</Text>
            </Hstack>
            <Text color="textFaded">Loading edit page...</Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  if (!game || !formGame) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Vstack>
            <Hstack>
              <Icon name="x" />
              <Text size="xl">Invalid Permissions</Text>
            </Hstack>
            <Text color="textFaded">
              You do not have access to editing this game
            </Text>
          </Vstack>
        </Card>
      </Vstack>
    );
  }

  return (
    <Vstack align="stretch">
      {canCreateOrEditPostJamVersion && (
        <Vstack>
          {!game.postJamPage ? (
            <Button
              icon="plus"
              disabled={creatingPostJamVersion}
              onClick={async () => {
                setCreatingPostJamVersion(true);
                const response = await createPostJamVersion(game.slug);

                if (response.ok) {
                  const nextGame = await getGame(game.slug);
                  if (nextGame.ok) {
                    const payload = await nextGame.json();
                    setGame(payload);
                    setSelectedVersion("POST_JAM");
                  }
                } else {
                  addToast({
                    title:
                      (await response.text()) ||
                      "Failed to create post-jam version",
                  });
                }

                setCreatingPostJamVersion(false);
              }}
            >
              Create a post jam version of the page
            </Button>
          ) : (
            <PageVersionToggle
              value={selectedVersion}
              onChange={setSelectedVersion}
            />
          )}
        </Vstack>
      )}

      <GameEditingForm game={formGame} pageVersion={selectedVersion} />
    </Vstack>
  );
}
