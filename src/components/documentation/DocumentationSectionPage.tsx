"use client";

import { hasCookie } from "@/helpers/cookie";
import {
  deleteDocumentationDocument,
  updateDocumentationDocument,
} from "@/requests/documentation";
import { useDocumentationDocuments, useSelf } from "@/hooks/queries";
import type {
  DocumentationDocumentType,
  DocumentationSection,
} from "@/types/DocumentationDocumentType";
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
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Editor from "@/components/editor";
import ThemedProse from "@/components/themed-prose";
import MentionedContent from "@/components/mentions/MentionedContent";
import DocumentationIconPicker from "./DocumentationIconPicker";
import PressKitGallery from "./PressKitGallery";

type Props = {
  section: DocumentationSection;
  title: string;
  description: string;
  basePath: "/docs" | "/press-kit";
  icon: "bookcopy" | "newspaper";
  selectedSlug?: string;
  defaultToFirstDocument?: boolean;
  showPressKitGallery?: boolean;
};

export default function DocumentationSectionPage({
  section,
  title,
  description,
  basePath,
  icon,
  selectedSlug,
  defaultToFirstDocument = true,
  showPressKitGallery = false,
}: Props) {
  const { data, isLoading } = useDocumentationDocuments(section);
  const { data: user } = useSelf(hasCookie("token"));
  const searchParams = useSearchParams();
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentationDocumentType[]>([]);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftIcon, setDraftIcon] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDocuments(
      [...(data ?? [])].sort((a, b) =>
        a.order === b.order ? a.id - b.id : a.order - b.order,
      ),
    );
  }, [data]);

  const activeSlug = useMemo(() => {
    if (selectedSlug) return selectedSlug;
    if (!defaultToFirstDocument) return null;
    return documents[0]?.slug ?? null;
  }, [defaultToFirstDocument, documents, selectedSlug]);

  const activeDocument = useMemo(
    () => documents.find((document) => document.slug === activeSlug) ?? null,
    [activeSlug, documents],
  );

  const isAdmin = Boolean(user?.admin);
  const isEditing = searchParams.get("edit") === "1" && isAdmin;

  async function swapDocumentOrder(
    document: DocumentationDocumentType,
    direction: -1 | 1,
  ) {
    const previousDocuments = documents;
    const currentIndex = previousDocuments.findIndex(
      (item) => item.id === document.id,
    );
    const targetIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= previousDocuments.length
    ) {
      return;
    }

    const targetDocument = previousDocuments[targetIndex];
    const nextDocuments = [...previousDocuments];

    nextDocuments[currentIndex] = {
      ...targetDocument,
      order: document.order,
    };
    nextDocuments[targetIndex] = {
      ...document,
      order: targetDocument.order,
    };

    setDocuments(nextDocuments);

    const [firstResponse, secondResponse] = await Promise.all([
      updateDocumentationDocument(document.id, {
        order: targetDocument.order,
      }),
      updateDocumentationDocument(targetDocument.id, {
        order: document.order,
      }),
    ]);

    if (!firstResponse.ok || !secondResponse.ok) {
      setDocuments(previousDocuments);
      addToast({ title: "Failed to reorder documents" });
      return;
    }
  }

  useEffect(() => {
    if (!activeDocument) return;
    setDraftTitle(activeDocument.title);
    setDraftIcon(activeDocument.icon || "book");
    setDraftContent(activeDocument.content);
  }, [activeDocument]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <Card className="overflow-hidden">
          <Vstack align="start" gap={0} className="w-full">
            <div className="w-full border-b border-white/10 p-5">
              <Vstack align="start" gap={1}>
                <Hstack>
                  <Icon name={icon} />
                  <Text size="xl" weight="bold">
                    {title}
                  </Text>
                </Hstack>
                <Text size="sm" color="textFaded">
                  {description}
                </Text>
              </Vstack>
            </div>

            <div className="w-full p-4">
              {isAdmin ? (
                <Button
                  href={`${basePath}/new`}
                  icon="fileplus2"
                  color="blue"
                  className="w-full justify-start"
                >
                  New document
                </Button>
              ) : null}
            </div>

            <div className="max-h-[70vh] w-full overflow-y-auto px-3 pb-4">
              <Vstack align="stretch" gap={1}>
                {documents.map((document) => {
                  const isActive = document.slug === activeSlug;
                  const documentIndex = documents.findIndex(
                    (item) => item.id === document.id,
                  );

                  return (
                    <div
                      key={document.id}
                      className="rounded-xl px-3 py-2 transition-colors"
                      style={{
                        backgroundColor: isActive
                          ? "rgba(76, 94, 255, 0.14)"
                          : "transparent",
                        border: isActive
                          ? "1px solid rgba(76, 94, 255, 0.35)"
                          : "1px solid transparent",
                      }}
                    >
                      <Vstack align="stretch" gap={2} className="w-full">
                        <Link
                          href={
                            showPressKitGallery && isActive
                              ? basePath
                              : `${basePath}/${document.slug}`
                          }
                          className="min-w-0 flex-1"
                        >
                          <Hstack className="min-w-0">
                            <Icon
                              name={(document.icon || "book") as any}
                              size={16}
                              color={isActive ? "blue" : "textFaded"}
                            />
                            <Text
                              weight={isActive ? "semibold" : "normal"}
                              color={isActive ? "blue" : "textFaded"}
                              className="truncate"
                            >
                              {document.title}
                            </Text>
                          </Hstack>
                        </Link>
                        {isAdmin ? (
                          <Hstack gap={1}>
                            <Button
                              icon="chevronup"
                              disabled={documentIndex === 0}
                              onClick={() => swapDocumentOrder(document, -1)}
                            />
                            <Button
                              icon="chevrondown"
                              disabled={documentIndex === documents.length - 1}
                              onClick={() => swapDocumentOrder(document, 1)}
                            />
                          </Hstack>
                        ) : null}
                      </Vstack>
                    </div>
                  );
                })}
                {documents.length === 0 ? (
                  <Text color="textFaded" size="sm">
                    No documents have been added here yet.
                  </Text>
                ) : null}
              </Vstack>
            </div>
          </Vstack>
        </Card>
      </aside>

      <section className="min-w-0">
        {!activeDocument ? (
          showPressKitGallery ? (
            <PressKitGallery />
          ) : (
            <Card>
              <Text color="textFaded">No document selected.</Text>
            </Card>
          )
        ) : (
          <Card padding={2}>
            <Vstack align="start" gap={4} className="w-full">
              {isEditing ? (
                <>
                  <Input
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    placeholder="Document title"
                  />
                  <DocumentationIconPicker
                    value={draftIcon}
                    onChange={setDraftIcon}
                  />
                  <Editor
                    content={draftContent}
                    setContent={setDraftContent}
                    format="markdown"
                  />
                  <Hstack wrap>
                    <Button
                      color="blue"
                      icon="save"
                      disabled={saving}
                      onClick={async () => {
                        if (!draftTitle.trim() || !draftContent.trim()) {
                          addToast({
                            title: "Please enter a title and content",
                          });
                          return;
                        }

                        setSaving(true);
                        const response = await updateDocumentationDocument(
                          activeDocument.id,
                          {
                            title: draftTitle,
                            icon: draftIcon,
                            content: draftContent,
                          },
                        );

                        if (!response.ok) {
                          addToast({ title: "Failed to update document" });
                          setSaving(false);
                          return;
                        }

                        const json = await response.json();
                        const updated = json.data as DocumentationDocumentType;
                        setDocuments((current) =>
                          current.map((document) =>
                            document.id === updated.id ? updated : document,
                          ),
                        );
                        addToast({ title: "Document updated" });
                        setSaving(false);
                        router.replace(`${basePath}/${updated.slug}`, {
                          scroll: false,
                        });
                      }}
                    >
                      Save
                    </Button>
                    <Button
                      onClick={() => {
                        setDraftTitle(activeDocument.title);
                        setDraftIcon(activeDocument.icon || "book");
                        setDraftContent(activeDocument.content);
                        router.replace(`${basePath}/${activeDocument.slug}`, {
                          scroll: false,
                        });
                      }}
                    >
                      Cancel
                    </Button>
                  </Hstack>
                </>
              ) : (
                <>
                  <Vstack align="start" gap={2} className="w-full">
                    <Hstack>
                      <Icon
                        name={(activeDocument.icon || "book") as any}
                        size={28}
                        color="blue"
                      />
                      <Text size="3xl" weight="bold" color="blue">
                        {activeDocument.title}
                      </Text>
                    </Hstack>
                    {isAdmin ? (
                      <Hstack wrap>
                        <Button
                          icon="squarepen"
                          onClick={() => {
                            router.replace(
                              `${basePath}/${activeDocument.slug}?edit=1`,
                              {
                                scroll: false,
                              },
                            );
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          color="red"
                          icon="trash"
                          onClick={async () => {
                            const response = await deleteDocumentationDocument(
                              activeDocument.id,
                            );

                            if (!response.ok) {
                              addToast({ title: "Failed to delete document" });
                              return;
                            }

                            const remainingDocuments = documents.filter(
                              (document) => document.id !== activeDocument.id,
                            );
                            setDocuments(remainingDocuments);
                            addToast({ title: "Document deleted" });
                            router.push(
                              remainingDocuments[0]
                                ? `${basePath}/${remainingDocuments[0].slug}`
                                : basePath,
                            );
                          }}
                        >
                          Delete
                        </Button>
                      </Hstack>
                    ) : null}
                  </Vstack>

                  <ThemedProse className="w-full">
                    <MentionedContent
                      html={activeDocument.content}
                      className="!duration-250 !ease-linear !transition-all max-w-full break-words"
                    />
                  </ThemedProse>
                </>
              )}
            </Vstack>
          </Card>
        )}
      </section>
    </div>
  );
}
