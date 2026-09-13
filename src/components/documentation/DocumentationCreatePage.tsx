"use client";

import { useTranslations as useUiTranslations } from "@/compat/next-intl";


import { hasCookie } from "@/helpers/cookie";
import { createDocumentationDocument } from "@/requests/documentation";
import { useSelf } from "@/hooks/queries";
import type { DocumentationSection } from "@/types/DocumentationDocumentType";
import { addToast, Button, Card, Hstack, Icon, Spinner, Text, Vstack } from "bioloom-ui";
import { useRouter } from "@/compat/next-navigation";
import { useState } from "react";
import Editor from "@/components/editor";
import { Input } from "bioloom-ui";
import DocumentationIconPicker from "./DocumentationIconPicker";

type Props = {
  section: DocumentationSection;
  title: string;
  description: string;
  basePath: "/docs" | "/press-kit";
  icon: "bookcopy" | "newspaper";
};

export default function DocumentationCreatePage({
  section,
  title,
  description,
  basePath,
  icon,
}: Props) {
  const uiText = useUiTranslations();
  const hasToken = hasCookie("token");
  const { data: user, isLoading } = useSelf(hasToken);
  const router = useRouter();
  const [documentTitle, setDocumentTitle] = useState("");
  const [iconName, setIconName] = useState<string>(icon);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  if (hasToken && isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner />
      </div>
    );
  }

  if (!user?.admin) {
    return (
      <Card>
        <Text color="textFaded">
           {uiText("AppStrings.YouMustBeAnAdminToCreateDocuments")} </Text>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <Vstack align="start" gap={1}>
          <Hstack>
            <Icon name={icon} />
            <Text size="2xl" weight="bold">
              {title}
            </Text>
          </Hstack>
          <Text color="textFaded">{description}</Text>
        </Vstack>
      </Card>
      <Card>
        <Vstack align="start" gap={4}>
          <Input
            value={documentTitle}
            onChange={(event) => setDocumentTitle(event.target.value)}
            placeholder={uiText("AppStrings.DocumentTitle")}
          />
          <DocumentationIconPicker value={iconName} onChange={setIconName} />
          <Editor content={content} setContent={setContent} format="markdown" />
          <Hstack wrap>
            {saving ? (
              <Spinner />
            ) : (
              <Button
                color="blue"
                icon="plus"
                onClick={async () => {
                  if (!documentTitle.trim() || !content.trim()) {
                    addToast({ title: uiText("AppStrings.PleaseEnterATitleAndContent") });
                    return;
                  }

                  setSaving(true);
                  const response = await createDocumentationDocument(
                    documentTitle,
                    content,
                    section,
                    iconName,
                  );

                  if (!response.ok) {
                    addToast({ title: uiText("AppStrings.FailedToCreateDocument") });
                    setSaving(false);
                    return;
                  }

                  const json = await response.json();
                  router.push(`${basePath}/${json.data.slug}`);
                }}
              >
                 {uiText("AppStrings.CreateDocument")} </Button>
            )}
            <Button href={basePath}>{uiText("AppStrings.Cancel")}</Button>
          </Hstack>
        </Vstack>
      </Card>
    </div>
  );
}
