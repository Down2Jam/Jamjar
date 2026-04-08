export type DocumentationSection = "DOCS" | "PRESS_KIT";

export interface DocumentationDocumentType {
  id: number;
  slug: string;
  title: string;
  content: string;
  icon: string;
  order: number;
  section: DocumentationSection;
  createdAt: Date;
  updatedAt: Date;
  editedAt?: Date | null;
  author: {
    id: number;
    slug: string;
    name: string;
    profilePicture?: string | null;
  };
}
