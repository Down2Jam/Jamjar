import DocumentationCreatePage from "@/components/documentation/DocumentationCreatePage";

export default function NewDocPage() {
  return (
    <DocumentationCreatePage
      section="DOCS"
      title="New Documentation Page"
      description="Write a new documentation document using the same editor style as posts."
      basePath="/docs"
      icon="bookcopy"
    />
  );
}
