"use client";

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
          <Hstack justify="between" className="flex-wrap gap-3">
            <Vstack align="start" gap={0}>
              <Text size="3xl" weight="bold" color="text">
                Quilts
              </Text>
              <Text color="textFaded">
                Collaborative pixel art canvases built from community submissions.
              </Text>
            </Vstack>
            <Hstack wrap>
              {isModerator && (
                <Button size="sm" icon="plus" color="blue" onClick={onOpen}>
                  Create quilt
                </Button>
              )}
              <Button size="sm" icon="rotateccw" onClick={loadQuilts}>
                Refresh
              </Button>
            </Hstack>
          </Hstack>

          {loading ? (
            <Hstack className="justify-center py-16">
              <Spinner />
              <Text color="textFaded">Loading quilts...</Text>
            </Hstack>
          ) : quilts.length === 0 ? (
            <Card>
              <Text color="textFaded">No quilts are available yet.</Text>
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
                        <span>{quilt.width} x {quilt.height}</span>
                        <span className="text-right">{quilt.acceptedCount} additions</span>
                        <span className="col-span-2">Ends {formatTime(quilt.endsAt)}</span>
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
                  addToast({ title: "Name and slug are required" });
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
                    addToast({ title: "Quilt created" });
                    onClose();
                    await loadQuilts();
                  } else {
                    addToast({ title: "Could not create quilt" });
                  }
                } finally {
                  setCreateLoading(false);
                }
              }}
            >
              <ModalHeader>Create Quilt</ModalHeader>
              <ModalBody>
                <Vstack align="stretch" gap={3}>
                  <Input
                    value={name}
                    onValueChange={(value) => {
                      setName(value);
                      if (!slugEdited) setSlug(toKebabSlug(value));
                    }}
                    placeholder="Name"
                  />
                  <Input
                    value={slug}
                    onValueChange={(value) => {
                      setSlugEdited(true);
                      setSlug(toKebabSlug(value));
                    }}
                    placeholder="quilt-slug"
                  />
                  <Textarea
                    value={description}
                    onValueChange={setDescription}
                    placeholder="Description"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input
                      type="number"
                      min={8}
                      max={512}
                      value={width}
                      onValueChange={setWidth}
                      placeholder="Width"
                    />
                    <Input
                      type="number"
                      min={8}
                      max={512}
                      value={height}
                      onValueChange={setHeight}
                      placeholder="Height"
                    />
                  </div>
                  <Input
                    type="number"
                    min={0}
                    value={reviewWindowMinutes}
                    onValueChange={setReviewWindowMinutes}
                    placeholder="Review window minutes"
                  />
                  <Input
                    type="datetime-local"
                    value={endsAt}
                    onValueChange={setEndsAt}
                    placeholder="Ends at"
                  />
                </Vstack>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" icon="plus" color="blue" disabled={createLoading}>
                  Create
                </Button>
              </ModalFooter>
            </form>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
