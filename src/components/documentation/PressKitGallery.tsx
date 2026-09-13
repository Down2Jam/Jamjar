"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { hasCookie, getCookie } from "@/helpers/cookie";
import { usePressKitMedia, useSelf } from "@/hooks/queries";
import { createPressKitMedia, deletePressKitMedia } from "@/requests/documentation";
import { BASE_URL } from "@/requests/config";
import type { PressKitMediaType } from "@/types/PressKitMediaType";
import {
  addToast,
  Button,
  Card,
  Hstack,
  Icon,
  Input,
  Spinner,
  Text,
  Vstack,
} from "bioloom-ui";
import { useRef, useState } from "react";

export default function PressKitGallery() {
  const uiText = useUiTranslations();
  const { data, isLoading } = usePressKitMedia();
  const { data: user } = useSelf(hasCookie("token"));
  const isAdmin = Boolean(user?.admin);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [media, setMedia] = useState<PressKitMediaType[]>([]);

  const items = media.length > 0 ? media : data ?? [];

  async function handleUpload(file: File) {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("upload", file);

      const uploadResponse = await fetch(`${BASE_URL}/image`, {
        method: "POST",
        body: formData,
        headers: {
          authorization: `Bearer ${getCookie("token")}`,
        },
        credentials: "include",
      });

      if (!uploadResponse.ok) {
        throw new Error("upload failed");
      }

      const uploadJson = await uploadResponse.json();
      const image = uploadJson.data as string;
      const createResponse = await createPressKitMedia(image, altText);

      if (!createResponse.ok) {
        throw new Error("create failed");
      }

      const createJson = await createResponse.json();
      const created = createJson.data as PressKitMediaType;
      setMedia((current) => [created, ...(current.length > 0 ? current : data ?? [])]);
      setAltText("");
      addToast({ title: uiText("AppStrings.MediaUploaded") });
    } catch (error) {
      console.error(error);
      addToast({ title: uiText("AppStrings.FailedToUploadMedia") });
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <Card className="px-6 py-7 md:px-10 md:py-10 lg:px-12 lg:py-12">
      <Vstack align="stretch" gap={4}>
        <Vstack align="start" gap={1}>
          <Hstack>
            <Icon name="images" color="blue" />
            <Text size="2xl" weight="bold" color="blue">
               {uiText("AppStrings.PressAssets")} </Text>
          </Hstack>
          <Text color="textFaded">
             {uiText("AppStrings.BrowseLogosScreenshotsAndOtherVisualMaterialsFor")} </Text>
        </Vstack>

        {isAdmin ? (
          <Vstack align="stretch" gap={3}>
            <Input
              value={altText}
              onValueChange={setAltText}
              placeholder={uiText("AppStrings.OptionalAltText")}
            />
            <Hstack wrap>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleUpload(file);
                  }
                }}
              />
              <Button
                icon="upload"
                color="blue"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? uiText("AppStrings.Uploading") : uiText("AppStrings.UploadImage")}
              </Button>
            </Hstack>
          </Vstack>
        ) : null}

        {items.length === 0 ? (
          <Text color="textFaded">{uiText("AppStrings.NoPressKitMediaHasBeenUploadedYet")}</Text>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden p-0">
                <a href={item.image} target="_blank" rel="noreferrer">
                  <img
                    src={item.image}
                    alt={item.altText || uiText("AppStrings.PressKitMedia")}
                    className="h-56 w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </a>
                {isAdmin ? (
                  <div className="p-3">
                    <Button
                      color="red"
                      icon="trash"
                      onClick={async () => {
                        const response = await deletePressKitMedia(item.id);

                        if (!response.ok) {
                          addToast({ title: uiText("AppStrings.FailedToDeleteMedia") });
                          return;
                        }

                        setMedia((current) =>
                          (current.length > 0 ? current : items).filter(
                            (mediaItem) => mediaItem.id !== item.id,
                          ),
                        );
                        addToast({ title: uiText("AppStrings.MediaDeleted") });
                      }}
                    >
                       {uiText("ThemeSuggestions.Delete.Title")} </Button>
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </Vstack>
    </Card>
  );
}
