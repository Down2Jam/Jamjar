"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { useEffect, useState } from "react";
import Link from "@/compat/next-link";
import {
  addToast,
  Button,
  Card,
  Hstack,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Text,
  Textarea,
  Vstack,
  useDisclosure,
} from "bioloom-ui";
import { createQuilt, listQuilts, type QuiltSummary } from "@/requests/quilt";
import { readArray } from "@/requests/helpers";
import { hasCookie } from "@/helpers/cookie";
import { useSelf } from "@/hooks/queries";
import { useTheme } from "@/providers/useSiteTheme";

function formatTime(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function QuiltPreview({ quilt }: { quilt: QuiltSummary }) {
  const cells = quilt.canvas ?? [];
  return (
    <div
      className="grid aspect-video w-full overflow-hidden rounded-md bg-white/5"
      style={{
        gridTemplateColumns: `repeat(${quilt.width}, minmax(0, 1fr))`,
      }}
      aria-hidden="true"
    >
      {Array.from({ length: quilt.width * quilt.height }).map((_, index) => (
        <span
          key={index}
          style={{ backgroundColor: cells[index] ?? "transparent" }}
        />
      ))}
    </div>
  );
}

function toKebabSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function defaultEndsAt() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function QuiltsPage() {
  const uiText = useUiTranslations();
  const { colors, siteTheme } = useTheme();
  const headerColor = colors["text"];
  const [quilts, setQuilts] = useState<QuiltSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [description, setDescription] = useState("");
  const [width, setWidth] = useState("64");
  const [height, setHeight] = useState("36");
  const [reviewWindowMinutes, setReviewWindowMinutes] = useState("60");
  const [endsAt, setEndsAt] = useState(defaultEndsAt);
  const { data: user } = useSelf(hasCookie("token"));
  const isModerator = Boolean(user?.admin || user?.mod);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  async function loadQuilts() {
    setLoading(true);
    try {
      const response = await listQuilts();
      if (response.ok) {
        setQuilts(await readArray<QuiltSummary>(response));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQuilts();
  }, []);

  return (
    <>
      <main className="mx-auto w-full max-w-6xl px-4 pb-10">
        <Vstack align="stretch" className="gap-5">
          <header className="relative py-2 text-center">
            <p
              className="text-3xl font-semibold"
              style={{
                color: headerColor,
                textShadow:
                  siteTheme.type === "Light"
                    ? "none"
                    : "0 1px 5px rgba(0, 0, 0, 0.75)",
              }}
            >
               {uiText("Navbar.Quilts.Title")} </p>
            <p
              className="mt-1 text-sm"
              style={{
                color: headerColor,
                opacity: 0.82,
                textShadow:
                  siteTheme.type === "Light"
                    ? "none"
                    : "0 1px 4px rgba(0, 0, 0, 0.8)",
              }}
            >
               {uiText("AppStrings.CollaborativePixelArtCanvasesBuiltFromCommunitySubmissions")} </p>
            <Hstack className="mt-3 justify-center sm:absolute sm:right-0 sm:top-2 sm:mt-0" wrap>
              {isModerator && (
                <Button size="sm" icon="plus" color="blue" onClick={onOpen}>
                   {uiText("AppStrings.CreateQuilt")} </Button>
              )}
              <Button size="sm" icon="rotateccw" onClick={loadQuilts}>
                 {uiText("AppStrings.Refresh")} </Button>
            </Hstack>
          </header>

          {loading ? (
            <Hstack className="justify-center py-16">
              <Spinner />
              <Text color="textFaded">{uiText("AppStrings.LoadingQuilts")}</Text>
            </Hstack>
          ) : quilts.length === 0 ? (
            <Card>
              <Text color="textFaded">{uiText("AppStrings.NoQuiltsAreAvailableYet")}</Text>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {quilts.map((quilt) => (
                <Link key={quilt.id} href={`/quilts/${quilt.slug}`}>
                  <Card className="h-full transition-transform hover:-translate-y-0.5">
                    <Vstack align="start" className="h-full">
                      <QuiltPreview quilt={quilt} />
                      <Text size="xl" weight="semibold" color="text">
                        {quilt.name}
                      </Text>
                      {quilt.description && (
                        <Text color="textFaded" className="line-clamp-2">
                          {quilt.description}
                        </Text>
                      )}
                      <div className="mt-auto grid w-full grid-cols-2 gap-2 text-sm text-zinc-400">
                        <span>{quilt.width}  {uiText("AppStrings.X")} {quilt.height}</span>
                        <span className="text-right">{quilt.acceptedCount}  {uiText("AppStrings.Additions")}</span>
                        <span className="col-span-2">{uiText("AppStrings.Ends")} {formatTime(quilt.endsAt)}</span>
                      </div>
                    </Vstack>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </Vstack>
      </main>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} backdrop="opaque">
        <ModalContent>
          {(onClose) => (
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (!name.trim() || !slug.trim()) {
                  addToast({ title: uiText("AppStrings.NameAndSlugAreRequired") });
                  return;
                }
                setCreateLoading(true);
                try {
                  const response = await createQuilt({
                    name: name.trim(),
                    slug: slug.trim(),
                    description: description.trim() || null,
                    width: Number(width),
                    height: Number(height),
                    reviewWindowMinutes: Number(reviewWindowMinutes),
                    endsAt: new Date(endsAt).toISOString(),
                  });
                  if (response.ok) {
                    setName("");
                    setSlug("");
                    setSlugEdited(false);
                    setDescription("");
                    setWidth("64");
                    setHeight("36");
                    setReviewWindowMinutes("60");
                    setEndsAt(defaultEndsAt());
                    addToast({ title: uiText("AppStrings.QuiltCreated") });
                    onClose();
                    await loadQuilts();
                  } else {
                    addToast({ title: uiText("AppStrings.CouldNotCreateQuilt") });
                  }
                } finally {
                  setCreateLoading(false);
                }
              }}
            >
              <ModalHeader>{uiText("AppStrings.CreateQuilt2")}</ModalHeader>
              <ModalBody>
                <Vstack align="stretch" gap={3}>
                  <Input
                    value={name}
                    onValueChange={(value) => {
                      setName(value);
                      if (!slugEdited) setSlug(toKebabSlug(value));
                    }}
                    placeholder={uiText("Settings.Name.Title")}
                  />
                  <Input
                    value={slug}
                    onValueChange={(value) => {
                      setSlugEdited(true);
                      setSlug(toKebabSlug(value));
                    }}
                    placeholder={uiText("AppStrings.QuiltSlug")}
                  />
                  <Textarea
                    value={description}
                    onValueChange={setDescription}
                    placeholder={uiText("AppStrings.Description")}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      type="number"
                      min={8}
                      max={512}
                      value={width}
                      onValueChange={setWidth}
                      placeholder={uiText("AppStrings.Width")}
                    />
                    <Input
                      type="number"
                      min={8}
                      max={512}
                      value={height}
                      onValueChange={setHeight}
                      placeholder={uiText("AppStrings.Height")}
                    />
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={reviewWindowMinutes}
                    onValueChange={setReviewWindowMinutes}
                    placeholder={uiText("AppStrings.ReviewWindowMinutes")}
                  />
                  <Input
                    type="datetime-local"
                    value={endsAt}
                    onValueChange={setEndsAt}
                    placeholder={uiText("AppStrings.EndsAt")}
                  />
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onClick={onClose}>
                   {uiText("AppStrings.Cancel")} </Button>
                <Button type="submit" icon="plus" color="blue" disabled={createLoading}>
                   {uiText("CreateGame.Create.Title")} </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
