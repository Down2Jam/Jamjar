import DocumentationSectionPage from "@/components/documentation/DocumentationSectionPage";

export default function DocsPage() {
  return (
    <DocumentationSectionPage
      section="DOCS"
      title="Documentation"
      description="Site documentation and guides."
      basePath="/docs"
      icon="bookcopy"
      selectedSlug={undefined}
    />
  );
}
