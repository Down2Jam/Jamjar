"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { Button, Hstack, Icon, Input, Text, Vstack, addToast } from "bioloom-ui";
import { useState } from "react";

import { useRouter } from "@/compat/next-navigation";
import { importItchGame, previewItchGame } from "@/requests/game";

type ImportedGameResponse = {
  slug?: string;
  data?: { slug?: string };
  message?: string;
  error?: { message?: string };
};

type ItchGamePreview = {
  title: string;
  description: string;
  imageUrl: string | null;
  jams: Array<{ name: string; url: string }>;
  buildPlatforms: string[];
};

type ItchGamePreviewResponse = Partial<ItchGamePreview> & {
  data?: ItchGamePreview;
};

async function readResponse<T>(
  response: Response,
): Promise<T & { message?: string }> {
  const raw = await response.text();
  try {
    if (!raw) return {} as T & { message?: string };

    const body = JSON.parse(raw) as T & {
      message?: string;
      error?: { message?: string };
    };
    return {
      ...body,
      message: body.message ?? body.error?.message,
    };
  } catch {
    return { message: raw } as T & { message?: string };
  }
}

export default function ItchGameImport() {
  const uiText = useUiTranslations();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [jamUrl, setJamUrl] = useState("");
  const [preview, setPreview] = useState<ItchGamePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);

  const handlePreview = async () => {
    if (!url.trim()) {
      addToast({ title: uiText("AppStrings.PasteAnItchIoGameLinkFirst") });
      return;
    }

    setPreviewing(true);
    setPreview(null);
    setJamUrl("");
    try {
      const response = await previewItchGame(url.trim());
      const responseBody = await readResponse<ItchGamePreviewResponse>(response);
      if (!response.ok) {
        addToast({
          title: responseBody.message || uiText("AppStrings.TheItchGameCouldNotBeImported"),
        });
        return;
      }

      const body = responseBody.data ?? (responseBody as ItchGamePreview);
      setPreview(body);
      if (body.jams.length === 1) setJamUrl(body.jams[0].url);
    } catch {
      addToast({ title: uiText("AppStrings.TheItchGameCouldNotBeImported") });
    } finally {
      setPreviewing(false);
    }
  };

  const handleImport = async () => {
    if (!url.trim()) {
      addToast({ title: uiText("AppStrings.PasteAnItchIoGameLinkFirst") });
      return;
    }

    setImporting(true);
    try {
      const response = await importItchGame(url.trim(), jamUrl);
      const body = await readResponse<ImportedGameResponse>(response);

      if (!response.ok) {
        addToast({ title: body.message || uiText("AppStrings.TheItchGameCouldNotBeImported") });
        return;
      }

      const slug = body.slug ?? body.data?.slug;
      if (!slug) {
        addToast({ title: uiText("AppStrings.TheGameImportedButItsEditPageCouldNotBeOpened") });
        return;
      }

      addToast({ title: uiText("AppStrings.ItchGameImportedYouCanAddSongsAndDetailsNow") });
      router.push(`/g/${slug}/edit`);
    } catch {
      addToast({ title: uiText("AppStrings.TheItchGameCouldNotBeImported") });
    } finally {
      setImporting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-16">
      <Vstack align="stretch" gap={8}>
        <Vstack align="start" gap={3}>
          <Icon name="download" size={34} color="text" />
          <Text size="4xl" color="text" weight="semibold">
             {uiText("AppStrings.ImportAGame")} </Text>
          <Text size="lg" color="textFaded">
             {uiText("AppStrings.ImportAGameFromAnItchIoJamToBeDisplayedOnTheSiteToListTheGameAndItsMusicAlongsideYour")} </Text>
        </Vstack>

        <Vstack align="stretch" gap={6}>
          <Vstack align="stretch" gap={2}>
            <Text color="text" weight="semibold">
               {uiText("AppStrings.ItchIoGameLink")} </Text>
            <Input
              placeholder="https://creator.itch.io/game-name"
              value={url}
              onValueChange={(value) => {
                setUrl(value);
                setPreview(null);
                setJamUrl("");
              }}
            />
            <div>
              <Button
                size="lg"
                icon="download"
                loading={previewing}
                onClick={handlePreview}
              >
                 {uiText("AppStrings.ImportGame")} </Button>
            </div>
          </Vstack>

          {preview && (
            <Vstack align="stretch" gap={6} className="border-t pt-6">
              <div>
                <Text size="2xl" color="text" weight="semibold">
                  {preview.title}
                </Text>
                <Text size="sm" color="textFaded">
                   {uiText("AppStrings.Builds")} {preview.buildPlatforms.join(", ")}
                </Text>
              </div>

              {preview.jams.length > 1 ? (
                <Vstack align="stretch" gap={3}>
                  <div>
                    <Text color="text" weight="semibold">
                       {uiText("AppStrings.ChooseTheJamToAttach")} </Text>
                    <Text size="xs" color="textFaded">
                       {uiText("AppStrings.ThisControlsWhichJamArchiveTheGameAppearsUnder")} </Text>
                  </div>
                  <Hstack wrap className="gap-2">
                    {preview.jams.map((jam) => (
                      <Button
                        key={jam.url}
                        icon={jamUrl === jam.url ? "check" : "calendar"}
                        onClick={() => setJamUrl(jam.url)}
                      >
                        {jam.name}
                      </Button>
                    ))}
                  </Hstack>
                </Vstack>
              ) : preview.jams.length === 1 ? (
                <Vstack align="stretch" gap={2}>
                  <Text color="text" weight="semibold">
                     {uiText("AppStrings.Jam")} </Text>
                  <Hstack className="gap-2">
                    <Icon name="calendar" size={16} color="textFaded" />
                    <Text color="text">{preview.jams[0].name}</Text>
                  </Hstack>
                </Vstack>
              ) : (
                <Vstack align="stretch" gap={2}>
                  <Text color="text" weight="semibold">
                     {uiText("AppStrings.JamPageLink")} </Text>
                  <Text size="xs" color="textFaded">
                     {uiText("AppStrings.NoJamLinkWasFoundPasteTheItchIoJamPageManually")} </Text>
                  <Input
                    placeholder="https://itch.io/jam/jam-name"
                    value={jamUrl}
                    onValueChange={setJamUrl}
                  />
                </Vstack>
              )}
            </Vstack>
          )}
        </Vstack>

        <Hstack wrap className="gap-3">
          {preview && (
            <Button
              size="lg"
              icon="download"
              loading={importing}
              disabled={!jamUrl.trim()}
              onClick={handleImport}
            >
               {uiText("AppStrings.AddToProfile")} </Button>
          )}
        </Hstack>
      </Vstack>
    </main>
  );
}
