import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import DocumentationCreatePage from "@/components/documentation/DocumentationCreatePage";

export default function NewDocPage() {
  const uiText = useUiTranslations();
  return (
    <DocumentationCreatePage
      section="DOCS"
      title={uiText("AppStrings.NewDocumentationPage")}
      description={uiText("AppStrings.WriteANewDocumentationDocumentUsingTheSame")}
      basePath="/docs"
      icon="bookcopy"
    />
  );
}
