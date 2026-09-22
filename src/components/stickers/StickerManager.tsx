"use client";

import { useMemo, useState } from "react";
import {
  addToast,
  Button,
  Hstack,
  ImageInput,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Text,
  Vstack,
  type ImageCropData,
} from "bioloom-ui";
import { getCookie } from "@/helpers/cookie";
import { useEmojis } from "@/providers/useEmojis";
import { BASE_URL } from "@/requests/config";
import {
  createGameSticker,
  createUserSticker,
  deleteEmoji,
  updateEmoji,
} from "@/requests/emoji";
import { useTheme } from "@/providers/useSiteTheme";

type StickerManagerProps = {
  scope: "USER" | "GAME";
  scopeId: number;
  prefix: string;
  gameSlug?: string;
  disabled?: boolean;
};

function cleanSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 44);
}

export default function StickerManager({
  scope,
  scopeId,
  prefix,
  gameSlug,
  disabled = false,
}: StickerManagerProps) {
  const { colors } = useTheme();
  const { stickers, refresh } = useEmojis();
  const ownedStickers = useMemo(
    () =>
      stickers.filter((sticker) =>
        scope === "USER"
          ? sticker.scopeType === "USER" && sticker.scopeUserId === scopeId
          : sticker.scopeType === "GAME" && sticker.scopeGameId === scopeId,
      ),
    [scope, scopeId, stickers],
  );
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [artistSlug, setArtistSlug] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setOpen(false);
    setEditingId(null);
    setSlug("");
    setImage(null);
    setArtistSlug("");
  };

  const uploadImage = async (file: File, crop?: ImageCropData) => {
    const formData = new FormData();
    formData.append("upload", file);
    if (crop) {
      formData.append("cropLeft", String(crop.left));
      formData.append("cropTop", String(crop.top));
      formData.append("cropWidth", String(crop.width));
      formData.append("cropHeight", String(crop.height));
    }
    const response = await fetch(`${BASE_URL}/image`, {
      method: "POST",
      body: formData,
      headers: { authorization: `Bearer ${getCookie("token")}` },
      credentials: "include",
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.data) {
      throw new Error(payload?.message || "Sticker image upload failed");
    }
    return payload.data as string;
  };

  const save = async () => {
    const cleanedSlug = cleanSlug(slug);
    if (!cleanedSlug || !image) {
      addToast({ title: "A sticker slug and image are required." });
      return;
    }
    if (scope === "GAME" && !gameSlug) {
      addToast({ title: "Save the game before adding stickers." });
      return;
    }

    setSaving(true);
    try {
      const response = editingId
        ? await updateEmoji(editingId, {
            slug: `${prefix}${cleanedSlug}`,
            image,
            artistSlug: artistSlug.trim() || null,
          })
        : scope === "USER"
          ? await createUserSticker(cleanedSlug, image, artistSlug.trim() || null)
          : await createGameSticker(gameSlug!, cleanedSlug, image, artistSlug.trim() || null);
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        addToast({ title: payload?.message ?? "The sticker could not be saved." });
        return;
      }
      addToast({ title: editingId ? "Sticker updated." : "Sticker added." });
      reset();
      await refresh();
    } catch (error) {
      console.error(error);
      addToast({ title: "The sticker could not be saved." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Vstack align="start" className="w-full gap-3">
      <div>
        <Text color="text" weight="semibold">
          {scope === "USER" ? "Your stickers" : "Game stickers"}
        </Text>
        <Text color="textFaded" size="xs">
          Stickers use the prefix <span className="font-semibold">{prefix}</span>, the <span className="font-semibold">::name::</span> syntax, and appear as large, standalone media in messages.
        </Text>
        <Text color="textFaded" size="xs">Only upload stickers you have permission to use.</Text>
      </div>
      <Button icon="plus" disabled={disabled} onClick={() => setOpen(true)}>Add sticker</Button>
      {disabled ? <Text size="xs" color="textFaded">Save the game before adding stickers.</Text> : null}

      {ownedStickers.length === 0 ? (
        <Text size="sm" color="textFaded">No stickers yet.</Text>
      ) : (
        <div className="w-full">
          {ownedStickers.map((sticker) => (
            <div
              key={sticker.id}
              className="flex flex-wrap items-center gap-3 border-b py-4 last:border-b-0"
              style={{ borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})` }}
            >
              <img src={sticker.image} alt={`::${sticker.slug}::`} className="h-16 w-16 object-contain" loading="lazy" decoding="async" />
              <div className="min-w-0 flex-1">
                <Text size="sm">::{sticker.slug}::</Text>
                {sticker.artistUser ? <Text size="xs" color="textFaded">{sticker.artistUser.name || sticker.artistUser.slug}</Text> : null}
              </div>
              <Button
                size="sm"
                variant="ghost"
                icon="pencil"
                onClick={() => {
                  setEditingId(sticker.id);
                  setSlug(sticker.slug.startsWith(prefix) ? sticker.slug.slice(prefix.length) : sticker.slug);
                  setImage(sticker.image);
                  setArtistSlug(sticker.artistUser?.slug ?? "");
                  setOpen(true);
                }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                color="red"
                variant="ghost"
                onClick={async () => {
                  const response = await deleteEmoji(sticker.id);
                  const payload = await response.json().catch(() => null);
                  if (!response.ok) {
                    addToast({ title: payload?.message ?? "The sticker could not be deleted." });
                    return;
                  }
                  addToast({ title: "Sticker deleted." });
                  await refresh();
                }}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={open} onOpenChange={(nextOpen) => { if (!nextOpen && !saving) reset(); }} size="2xl">
        <ModalContent>
          <ModalHeader className="pr-14 text-lg font-semibold">{editingId ? "Edit sticker" : "Add sticker"}</ModalHeader>
          <ModalBody className="max-h-[65dvh] overflow-y-auto">
            <div className="mb-5 flex items-center gap-3 rounded-lg border p-4" style={{ borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})` }}>
              {image ? <img src={image} alt="Sticker preview" className="h-24 w-24 object-contain" /> : null}
              <div><Text size="xs" color="textFaded">Preview</Text><Text size="sm">::{prefix}{cleanSlug(slug) || "sticker"}::</Text></div>
            </div>
            <Hstack className="items-end flex-wrap">
              <Input label="Sticker slug" labelPlacement="outside" placeholder="victory" value={slug} onValueChange={setSlug} />
              <Input label="Artist user slug" labelPlacement="outside" placeholder="username" value={artistSlug} onValueChange={setArtistSlug} />
              <Vstack align="start" gap={1}>
                <Text size="xs" color="textFaded">Upload image</Text>
                <ImageInput
                  value={image}
                  width={128}
                  height={128}
                  placeholder="Upload"
                  maxOutputSize={1024}
                  onSelect={async (file, crop) => {
                    try {
                      setImage(await uploadImage(file, crop));
                    } catch (error) {
                      console.error(error);
                      addToast({ title: "The sticker image could not be uploaded." });
                    }
                  }}
                />
              </Vstack>
            </Hstack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" disabled={saving} onClick={reset}>Cancel</Button>
            <Button color="blue" loading={saving} onClick={save}>{editingId ? "Save" : "Add sticker"}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Vstack>
  );
}
