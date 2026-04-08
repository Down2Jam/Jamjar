import DocumentationSectionPage from "@/components/documentation/DocumentationSectionPage";

export default async function DocDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return (
    <DocumentationSectionPage
      section="DOCS"
      title="Documentation"
      description="Site documentation and guides."
      basePath="/docs"
      icon="bookcopy"
      selectedSlug={slug}
    />
  );
}
