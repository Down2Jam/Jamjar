import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import DocumentationSectionPage from "@/components/documentation/DocumentationSectionPage";

export default function DocsPage() {
  const uiText = useUiTranslations();
  return (
    <DocumentationSectionPage
      section="DOCS"
      title={uiText("AppStrings.Documentation")}
      description={uiText("AppStrings.SiteDocumentationAndGuides")}
      basePath="/docs"
      icon="bookcopy"
      selectedSlug={undefined}
    />
  );
}
