"use client";

import { useEffect, useState } from "react";
import {
  addToast,
  Button,
  Card,
  Hstack,
  Icon,
  Spinner,
  Text,
  Vstack,
} from "bioloom-ui";
import { hasCookie } from "@/helpers/cookie";
import { redirect, useSearchParams } from "@/compat/next-navigation";
import { getSelf } from "@/requests/user";
import { getGame } from "@/requests/game";
import { approveDeviceCode, denyDeviceCode } from "@/requests/auth";
import { readItem } from "@/requests/helpers";
import { UserType } from "@/types/UserType";
import { GameType } from "@/types/GameType";

type LinkStatus = "idle" | "approving" | "denying" | "approved" | "denied";

const AUTO_CLOSE_DELAY_MS = 2000;

function gameDisplayName(game: GameType | undefined, fallbackSlug: string) {
  return game?.postJamPage?.name ?? game?.jamPage?.name ?? fallbackSlug;
}

export default function LinkDevicePage() {
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserType>();
  const userCode = (searchParams.get("code") ?? "").trim().toUpperCase();
  const gameSlug = searchParams.get("game") ?? "";
  const [game, setGame] = useState<GameType>();
  const [status, setStatus] = useState<LinkStatus>("idle");

  useEffect(() => {
    async function loadUser() {
      if (!hasCookie("token")) {
        redirect("/login");
        return;
      }

      const response = await getSelf();
      if (response.status === 200) {
        setUser((await readItem<UserType>(response)) ?? undefined);
      } else {
        redirect("/login");
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    async function loadGame() {
      if (!gameSlug) return;
      const response = await getGame(gameSlug);
      if (response.status === 200) {
        setGame((await readItem<GameType>(response)) ?? undefined);
      }
    }

    loadGame();
  }, [gameSlug]);

  useEffect(() => {
    if (status !== "approved" && status !== "denied") return;
    const timer = setTimeout(() => window.close(), AUTO_CLOSE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status]);

  async function handleApprove() {
    if (!userCode) {
      addToast({ title: "No device code found in this link" });
      return;
    }
    setStatus("approving");
    try {
      const response = await approveDeviceCode(userCode);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        addToast({ title: data?.error?.message ?? "Failed to approve device" });
        setStatus("idle");
        return;
      }
      setStatus("approved");
    } catch (error) {
      console.error(error);
      addToast({ title: "Failed to approve device" });
      setStatus("idle");
    }
  }

  async function handleDeny() {
    if (!userCode) {
      addToast({ title: "No device code found in this link" });
      return;
    }
    setStatus("denying");
    try {
      const response = await denyDeviceCode(userCode);
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        addToast({ title: data?.error?.message ?? "Failed to deny device" });
        setStatus("idle");
        return;
      }
      setStatus("denied");
    } catch (error) {
      console.error(error);
      addToast({ title: "Failed to deny device" });
      setStatus("idle");
    }
  }

  if (!user) {
    return (
      <Vstack>
        <Card className="max-w-96">
          <Hstack>
            <Spinner />
            <Text size="xl">Loading</Text>
          </Hstack>
        </Card>
      </Vstack>
    );
  }

  return (
    <Vstack>
      <Card className="max-w-md">
        <Vstack align="start" className="gap-4">
          <Hstack>
            <Icon name="gamepad2" />
            <Text size="xl" weight="semibold" color="text">
              Link a Game
            </Text>
          </Hstack>

          {status === "approved" ? (
            <Text color="textFaded">
              Device linked. This tab will close automatically, or you can
              close it and return to the game.
            </Text>
          ) : status === "denied" ? (
            <Text color="textFaded">
              Request denied. This tab will close automatically, or you can
              close it now.
            </Text>
          ) : (
            <>
              <Text size="sm" color="textFaded">
                <span className="font-semibold">
                  {gameDisplayName(game, gameSlug || "A game")}
                </span>{" "}
                is requesting to link to your account as{" "}
                <span className="font-semibold">{user.name}</span>. This will
                let the game submit scores and achievements on your behalf.
              </Text>
              {userCode ? (
                <Vstack align="start" gap={1}>
                  <Text size="xs" color="textFaded">
                    Code
                  </Text>
                  <Text size="lg" weight="semibold" color="text">
                    {userCode}
                  </Text>
                </Vstack>
              ) : (
                <Text size="sm" color="textFaded">
                  This link is missing its device code. Go back to the game
                  and try again.
                </Text>
              )}
              <Hstack>
                <Button
                  color="red"
                  variant="ghost"
                  loading={status === "denying"}
                  disabled={!userCode}
                  onClick={handleDeny}
                >
                  Deny
                </Button>
                <Button
                  color="blue"
                  loading={status === "approving"}
                  disabled={!userCode}
                  onClick={handleApprove}
                >
                  Approve
                </Button>
              </Hstack>
            </>
          )}
        </Vstack>
      </Card>
    </Vstack>
  );
}
