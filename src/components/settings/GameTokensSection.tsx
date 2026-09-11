"use client";

import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { addToast, Button, Card, Hstack, Spinner, Text, Vstack } from "bioloom-ui";
import { getGameTokens, revokeGameToken } from "@/requests/auth";
import { readArray } from "@/requests/helpers";
import { GameAccessTokenType } from "@/types/GameAccessTokenType";

export default function GameTokensSection() {
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
        addToast({ title: data?.error?.message ?? "Failed to revoke game token" });
        return;
      }
      addToast({ title: "Game token revoked" });
      setTokens((prev) => prev.filter((token) => token.id !== id));
    } catch (error) {
      console.error(error);
      addToast({ title: "Failed to revoke game token" });
    } finally {
      setRevokingId(null);
    }
  }

  return (
    <Card>
      <Vstack align="start" className="gap-3">
        <div>
          <Text color="text">Game Tokens</Text>
          <Text color="textFaded" size="xs">
            Devices linked through the game client that can submit scores and
            achievements on your behalf. Revoke any you don't recognize.
          </Text>
        </div>

        {loading ? (
          <Hstack>
            <Spinner />
            <Text size="sm" color="textFaded">
              Loading game tokens...
            </Text>
          </Hstack>
        ) : tokens.length === 0 ? (
          <Text size="sm" color="textFaded">
            No game tokens linked yet.
          </Text>
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
                    Created {format(new Date(token.createdAt), "MMMM d, yyyy")} &middot;{" "}
                    {token.lastUsedAt
                      ? `Last used ${formatDistanceToNow(new Date(token.lastUsedAt), { addSuffix: true })}`
                      : "Never used"}
                  </Text>
                </Vstack>
                <Button
                  size="sm"
                  color="red"
                  variant="ghost"
                  loading={revokingId === token.id}
                  onClick={() => handleRevoke(token.id)}
                >
                  Revoke
                </Button>
              </Hstack>
            ))}
          </Vstack>
        )}
      </Vstack>
    </Card>
  );
}
