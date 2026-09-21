"use client";

import { useEffect, useRef } from "react";
import type { RefObject } from "react";

import { getCookie } from "@/helpers/cookie";
import { getApiErrorMessage } from "@/requests/helpers";
import { BASE_URL } from "@/requests/config";
import type { GameType, PageVersion } from "@/types/GameType";
import type { UserType } from "@/types/UserType";

const BRIDGE_CHANNEL = "d2jam";

type BridgeMessage = {
  channel: typeof BRIDGE_CHANNEL;
  type: string;
  requestId?: string;
  [key: string]: unknown;
};

type EmbeddedGameBridgeProps = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  buildUrl: string;
  game: GameType;
  pageVersion: PageVersion;
  signedIn: boolean;
  user: UserType | null;
  achievements?: Array<Pick<GameType["achievements"][number], "id" | "name" | "description" | "image">>;
  leaderboards?: Array<Pick<GameType["leaderboards"][number], "id" | "name" | "type" | "decimalPlaces" | "onlyBest">>;
};

type BridgeResult =
  | { ok: true; data?: unknown }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBridgeMessage(value: unknown): value is BridgeMessage {
  return isRecord(value) && value.channel === BRIDGE_CHANNEL && typeof value.type === "string";
}

function positiveInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

function publicContext({
  game,
  pageVersion,
  signedIn,
  user,
  achievements,
  leaderboards,
}: Omit<EmbeddedGameBridgeProps, "iframeRef" | "buildUrl">) {
  const contextAchievements = achievements ?? game.achievements ?? [];
  const contextLeaderboards = leaderboards ?? game.leaderboards ?? [];

  return {
    signedIn,
    user: signedIn && user
      ? {
          id: user.id,
          slug: user.slug,
          name: user.name,
          profilePicture: user.profilePicture,
        }
      : null,
    game: {
      id: game.id,
      slug: game.slug,
      pageVersion,
    },
    achievements: contextAchievements.map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      image: achievement.image,
    })),
    leaderboards: contextLeaderboards.map((leaderboard) => ({
      id: leaderboard.id,
      name: leaderboard.name,
      type: leaderboard.type,
      decimalPlaces: leaderboard.decimalPlaces,
      onlyBest: leaderboard.onlyBest,
    })),
  };
}

function postToGame(
  iframe: HTMLIFrameElement,
  message: Record<string, unknown>,
  targetOrigin = "*",
) {
  iframe.contentWindow?.postMessage(
    { channel: BRIDGE_CHANNEL, ...message },
    targetOrigin,
  );
}

function responseToGame(
  iframe: HTMLIFrameElement,
  requestId: string,
  targetOrigin: string,
  result: { ok: true; data?: unknown } | { ok: false; error: string },
) {
  postToGame(iframe, { type: "response", requestId, ...result }, targetOrigin);
}

async function postAuthenticatedJson(
  path: string,
  body: Record<string, unknown>,
  idempotencyKey: string,
): Promise<BridgeResult> {
  const token = getCookie("token");
  if (!token) {
    return {
      ok: false as const,
      error: "Sign in to save game progress.",
    };
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false as const,
      error: getApiErrorMessage(payload) ?? "The game progress could not be saved.",
    };
  }

  return { ok: true as const, data: payload };
}

async function uploadEvidenceImage(dataUrl: string): Promise<BridgeResult> {
  const token = getCookie("token");
  if (!token) {
    return {
      ok: false as const,
      error: "Sign in to save game progress.",
    };
  }

  const match = /^data:(image\/(?:png|jpeg|gif|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl);
  if (!match) {
    return {
      ok: false as const,
      error: "The evidence image is invalid.",
    };
  }

  const mimeType = match[1];
  const extension = mimeType === "image/jpeg"
    ? "jpg"
    : mimeType.slice("image/".length);
  const binary = atob(match[2]);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const formData = new FormData();
  formData.append(
    "upload",
    new Blob([bytes], { type: mimeType }),
    `d2jam-evidence.${extension}`,
  );

  const response = await fetch(`${BASE_URL}/image`, {
    method: "POST",
    credentials: "include",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    return {
      ok: false as const,
      error: getApiErrorMessage(payload) ?? "The evidence image could not be uploaded.",
    };
  }

  const evidenceUrl = isRecord(payload) && typeof payload.data === "string"
    ? payload.data
    : "";
  if (!evidenceUrl) {
    return {
      ok: false as const,
      error: "The evidence image upload returned no URL.",
    };
  }

  return { ok: true as const, data: evidenceUrl };
}

export default function EmbeddedGameBridge({
  iframeRef,
  buildUrl,
  game,
  pageVersion,
  signedIn,
  user,
  achievements,
  leaderboards,
}: EmbeddedGameBridgeProps) {
  const didHandshakeRef = useRef(false);

  useEffect(() => {
    didHandshakeRef.current = false;
  }, [buildUrl, game.id, pageVersion]);

  useEffect(() => {
    let disposed = false;
    const iframeOrigin = (() => {
      try {
        return new URL(buildUrl, window.location.origin).origin;
      } catch {
        return null;
      }
    })();

    const context = () => publicContext({
      game,
      pageVersion,
      signedIn,
      user,
      achievements,
      leaderboards,
    });
    const sendSession = (targetOrigin = "*") => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !didHandshakeRef.current) return;

      postToGame(iframe, { type: "session", ...context() }, targetOrigin);
    };

    const isTrustedMessage = (event: MessageEvent) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || event.source !== iframe.contentWindow) return false;

      return event.origin === "null" || !iframeOrigin || event.origin === iframeOrigin;
    };

    const onMessage = async (event: MessageEvent) => {
      if (!isTrustedMessage(event) || !isBridgeMessage(event.data)) return;

      const iframe = iframeRef.current;
      if (!iframe) return;
      const targetOrigin = event.origin === "null" ? "*" : event.origin;
      const message = event.data;

      if (message.type === "ready" || message.type === "get-session") {
        didHandshakeRef.current = true;
        sendSession(targetOrigin);
        return;
      }

      if (message.type === "get-context") {
        if (typeof message.requestId === "string") {
          responseToGame(iframe, message.requestId, targetOrigin, {
            ok: true,
            data: context(),
          });
        }
        return;
      }

      if (typeof message.requestId !== "string") return;

      try {
        if (message.type === "unlock-achievement") {
          const achievementId = positiveInteger(message.achievementId);
          if (!achievementId || !game.achievements.some((achievement) => achievement.id === achievementId)) {
            responseToGame(iframe, message.requestId, targetOrigin, {
              ok: false,
              error: "That achievement does not belong to this game.",
            });
            return;
          }

          const result = await postAuthenticatedJson(
            "/achievement",
            { achievementId },
            message.requestId,
          );
          if (!disposed) responseToGame(iframe, message.requestId, targetOrigin, result);
          return;
        }

        if (message.type === "submit-score") {
          const leaderboardId = positiveInteger(message.leaderboardId);
          const score = message.score;
          if (
            !leaderboardId ||
            !game.leaderboards.some((leaderboard) => leaderboard.id === leaderboardId) ||
            typeof score !== "number" ||
            !Number.isFinite(score)
          ) {
            responseToGame(iframe, message.requestId, targetOrigin, {
              ok: false,
              error: "That score request is invalid for this game.",
            });
            return;
          }

          const evidenceImage = typeof message.evidenceImage === "string"
            ? message.evidenceImage.trim()
            : "";
          let evidence = typeof message.evidence === "string"
            ? message.evidence.trim().slice(0, 2000)
            : undefined;
          if (evidenceImage) {
            const uploadedEvidence = await uploadEvidenceImage(evidenceImage);
            if (!uploadedEvidence.ok) {
              responseToGame(iframe, message.requestId, targetOrigin, uploadedEvidence);
              return;
            }
            if (typeof uploadedEvidence.data !== "string") {
              responseToGame(iframe, message.requestId, targetOrigin, {
                ok: false,
                error: "The evidence image upload returned no URL.",
              });
              return;
            }
            evidence = uploadedEvidence.data;
          }
          const result = await postAuthenticatedJson(
            "/score",
            {
              leaderboardId,
              score,
              ...(evidence ? { evidence } : {}),
            },
            message.requestId,
          );
          if (!disposed) responseToGame(iframe, message.requestId, targetOrigin, result);
          return;
        }

        responseToGame(iframe, message.requestId, targetOrigin, {
          ok: false,
          error: "Unknown embedded game request.",
        });
      } catch {
        if (!disposed) {
          responseToGame(iframe, message.requestId, targetOrigin, {
            ok: false,
            error: "The embedded game request failed.",
          });
        }
      }
    };

    window.addEventListener("message", onMessage);

    return () => {
      disposed = true;
      window.removeEventListener("message", onMessage);
    };
  }, [achievements, buildUrl, game, iframeRef, leaderboards, pageVersion, signedIn, user]);

  return null;
}
