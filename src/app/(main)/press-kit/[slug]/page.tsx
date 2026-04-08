import DocumentationSectionPage from "@/components/documentation/DocumentationSectionPage";

export default async function PressKitDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <DocumentationSectionPage
      section="PRESS_KIT"
      title="Press Kit"
      description="A collection of materials for promotional use."
      basePath="/press-kit"
      icon="newspaper"
      selectedSlug={slug}
      defaultToFirstDocument={false}
      showPressKitGallery
    />
  );
}
