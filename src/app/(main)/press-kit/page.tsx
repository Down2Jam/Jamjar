import DocumentationSectionPage from "@/components/documentation/DocumentationSectionPage";

export default function PressKitPage() {
  return (
    <DocumentationSectionPage
      section="PRESS_KIT"
      title="Press Kit"
      description="A collection of materials for promotional use."
      basePath="/press-kit"
      icon="newspaper"
      selectedSlug={undefined}
      defaultToFirstDocument={false}
      showPressKitGallery
    />
  );
}
