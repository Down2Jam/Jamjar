import DocumentationCreatePage from "@/components/documentation/DocumentationCreatePage";

export default function NewPressKitPage() {
  return (
    <DocumentationCreatePage
      section="PRESS_KIT"
      title="New Press Kit Page"
      description="Write a new press kit document using the same editor style as posts."
      basePath="/press-kit"
      icon="newspaper"
    />
  );
}
