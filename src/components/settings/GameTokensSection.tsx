"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { addToast, Button, Card, Hstack, Spinner, Text, Vstack } from "bioloom-ui";
import { getGameTokens, revokeGameToken } from "@/requests/auth";
import { readArray } from "@/requests/helpers";
import { GameAccessTokenType } from "@/types/GameAccessTokenType";

export default function GameTokensSection({ flat = false }: { flat?: boolean }) {
  const uiText = useUiTranslations();
  const [tokens, setTokens] = useState<GameAccessTokenType[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTokens() {
      try {
        const response = await getGameTokens();
        if (!active) return;
        if (response.status === 200) {
          setTokens(await readArray<GameAccessTokenType>(response));
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTokens();
    return () => {
      active = false;
    };
  }, []);

  async function handleRevoke(id: string) {
    setRevokingId(id);
    try {
      const response = await revokeGameToken(id);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        addToast({ title: data?.error?.message ?? uiText("AppStrings.FailedToRevokeGameToken") });
        return;
      }
      addToast({ title: uiText("AppStrings.GameTokenRevoked") });
      setTokens((prev) => prev.filter((token) => token.id !== id));
    } catch (error) {
      console.error(error);
      addToast({ title: uiText("AppStrings.FailedToRevokeGameToken") });
    } finally {
      setRevokingId(null);
    }
  }

  const Container = flat ? "div" : Card;

  return (
    <Container className={flat ? "game-editor-row" : undefined}>
      <Vstack align="start" className="gap-3">
        <div>
          <Text color="text">{uiText("AppStrings.GameTokens")}</Text>
          <Text color="textFaded" size="xs">
             {uiText("AppStrings.DevicesLinkedThroughTheGameClientThatCanSubmitScoresAndAchievementsOnYourBehalfRevoke")} </Text>
        </div>

        {loading ? (
          <Hstack>
            <Spinner />
            <Text size="sm" color="textFaded">
               {uiText("AppStrings.LoadingGameTokens")} </Text>
          </Hstack>
        ) : tokens.length === 0 ? (
          <Text size="sm" color="textFaded">
             {uiText("AppStrings.NoGameTokensLinkedYet")} </Text>
        ) : (
          <Vstack align="start" className="w-full gap-2">
            {tokens.map((token) => (
              <Hstack
                key={token.id}
                className="w-full items-center justify-between rounded-lg border border-gray-700 px-3 py-2"
              >
                <Vstack align="start" gap={0}>
                  <Text size="sm">{token.name}</Text>
                  <Text size="xs" color="textFaded">
                     {uiText("AppStrings.Created")} {format(new Date(token.createdAt), "MMMM d, yyyy")}  {uiText("AppStrings.Middot")}{" "}
                    {token.lastUsedAt
                      ? uiText("AppStrings.LastUsedValue0", { value0: formatDistanceToNow(new Date(token.lastUsedAt), { addSuffix: true }) })
                      : uiText("AppStrings.NeverUsed")}
                  </Text>
                </Vstack>
                <Button
                  size="sm"
                  color="red"
                  variant="ghost"
                  loading={revokingId === token.id}
                  onClick={() => handleRevoke(token.id)}
                >
                   {uiText("AppStrings.Revoke")} </Button>
              </Hstack>
            ))}
          </Vstack>
        )}
      </Vstack>
    </Container>
  );
}
