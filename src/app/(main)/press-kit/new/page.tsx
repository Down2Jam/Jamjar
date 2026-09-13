import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import DocumentationCreatePage from "@/components/documentation/DocumentationCreatePage";

export default function NewPressKitPage() {
  const uiText = useUiTranslations();
  return (
    <DocumentationCreatePage
      section="PRESS_KIT"
      title={uiText("AppStrings.NewPressKitPage")}
      description={uiText("AppStrings.WriteANewPressKitDocumentUsingThe")}
      basePath="/press-kit"
      icon="newspaper"
    />
  );
}
