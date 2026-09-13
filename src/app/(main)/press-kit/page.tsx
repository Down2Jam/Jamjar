import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import DocumentationSectionPage from "@/components/documentation/DocumentationSectionPage";

export default function PressKitPage() {
  const uiText = useUiTranslations();
  return (
    <DocumentationSectionPage
      section="PRESS_KIT"
      title={uiText("Navbar.PressKit.Title")}
      description={uiText("AppStrings.ACollectionOfMaterialsForPromotionalUse")}
      basePath="/press-kit"
      icon="newspaper"
      selectedSlug={undefined}
      defaultToFirstDocument={false}
      showPressKitGallery
    />
  );
}
