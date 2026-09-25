"use client";

import { useState } from "react";
import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { useTheme } from "@/providers/useSiteTheme";
import {
  addToast,
  Button,
  Card,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
  Textarea,
  Vstack,
} from "bioloom-ui";
import {
  buildRecommendationsShareDraft,
  openSharedPostDraft,
  type RecommendationSharePick,
} from "@/helpers/shareToPost";

type ShareItem = RecommendationSharePick & { id: number };

export default function ShareRecommendationsModal({
  category,
  games,
  tracks,
  jamName,
  userName,
  onClose,
}: {
  category: "games" | "tracks";
  games: ShareItem[];
  tracks: ShareItem[];
  jamName: string;
  userName: string;
  onClose: () => void;
}) {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
  const [selectedGames, setSelectedGames] = useState<number[]>(
    category === "games" ? games.map((game) => game.id) : [],
  );
  const [selectedTracks, setSelectedTracks] = useState<number[]>(
    category === "tracks" ? tracks.map((track) => track.id) : [],
  );
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [sharing, setSharing] = useState(false);

  const toggle = (kind: "games" | "tracks", id: number) => {
    const update = (current: number[]) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id];
    if (kind === "games") setSelectedGames(update);
    else setSelectedTracks(update);
  };

  const share = async () => {
    setSharing(true);
    try {
      const draft = await buildRecommendationsShareDraft({
        jamName,
        userName,
        games: games
          .filter((game) => selectedGames.includes(game.id))
          .map(({ id, ...game }) => ({
            ...game,
            reason: reasons[`games-${id}`]?.trim(),
          })),
        tracks: tracks
          .filter((track) => selectedTracks.includes(track.id))
          .map(({ id, ...track }) => ({
            ...track,
            reason: reasons[`tracks-${id}`]?.trim(),
          })),
      });
      openSharedPostDraft(draft);
    } catch (error) {
      console.error("Error creating recommendations share image:", error);
      addToast({ title: uiText("AppStrings.CouldNotShareRecommendations") });
      setSharing(false);
    }
  };

  const renderItems = (kind: "games" | "tracks", items: ShareItem[]) => {
    if (items.length === 0) return null;
    const selected = kind === "games" ? selectedGames : selectedTracks;

    return (
      <Vstack align="stretch" gap={2} className="w-full">
        <Text weight="semibold">
          {uiText(kind === "games" ? "AppStrings.RecommendedGames" : "AppStrings.RecommendedMusic")}
        </Text>
        {items.map((item) => {
          const key = `${kind}-${item.id}`;
          const checked = selected.includes(item.id);
          const fallbackThumbnail = "/images/game-thumbnail.png";
          return (
            <Card
              key={key}
              padding={0}
              shadow="none"
              className="overflow-hidden"
              style={{
                border: 0,
                backgroundColor: `color-mix(in srgb, ${colors.base} 40%, ${colors.mantle})`,
              }}
            >
              <label className="flex min-w-0 cursor-pointer items-center gap-3 p-3">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(kind, item.id)}
                  className="h-4 w-4 shrink-0 cursor-pointer"
                  style={{ accentColor: colors.blue }}
                />
                <img
                  src={item.thumbnail || fallbackThumbnail}
                  alt=""
                  className={kind === "games"
                    ? "h-[54px] w-24 shrink-0 rounded-md object-cover"
                    : "h-16 w-16 shrink-0 rounded-md object-cover"}
                  style={{ backgroundColor: colors.crust }}
                  onError={(event) => {
                    if (!event.currentTarget.src.endsWith(fallbackThumbnail)) {
                      event.currentTarget.src = fallbackThumbnail;
                    }
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold leading-5">{item.name}</span>
                  {item.detail ? (
                    <span className="block truncate text-sm leading-5" style={{ color: colors.textFaded }}>
                      {item.detail}
                    </span>
                  ) : null}
                </span>
              </label>
              {checked ? (
                <div className="px-3 pb-3">
                  <Textarea
                    fullWidth
                    size="md"
                    value={reasons[key] ?? ""}
                    onValueChange={(value) =>
                      setReasons((current) => ({
                        ...current,
                        [key]: value,
                      }))
                    }
                    maxLength={220}
                    rows={2}
                    placeholder={uiText("AppStrings.WhyDoYouLikeThisOptional")}
                    aria-label={`${uiText("AppStrings.WhyDoYouLikeThisOptional")} ${item.name}`}
                    className="[&_textarea]:text-sm"
                  />
                </div>
              ) : null}
            </Card>
          );
        })}
      </Vstack>
    );
  };

  return (
    <Modal
      isOpen
      onOpenChange={(open) => {
        if (!open && !sharing) onClose();
      }}
      backdrop="opaque"
      size="2xl"
    >
      <ModalContent className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden">
        <>
          <ModalHeader>{uiText("AppStrings.ShareJamFavorites")}</ModalHeader>
          <ModalBody className="min-h-0 flex-1 overflow-y-auto">
            <Vstack align="stretch" gap={4} className="min-w-0">
              <Text size="sm" color="textFaded" className="w-full pr-2">
                {uiText("AppStrings.ChooseFavoritesForShareImage")}
              </Text>
              {renderItems("games", games)}
              {renderItems("tracks", tracks)}
            </Vstack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose} disabled={sharing}>
              {uiText("AppStrings.Cancel")}
            </Button>
            <Button
              color="blue"
              onClick={() => void share()}
              disabled={sharing || selectedGames.length + selectedTracks.length === 0}
            >
              {sharing ? uiText("AppStrings.CreatingImage") : uiText("AppStrings.CreateShareImage")}
            </Button>
          </ModalFooter>
        </>
      </ModalContent>
    </Modal>
  );
}
