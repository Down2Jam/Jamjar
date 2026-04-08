import { useQuery } from "@tanstack/react-query";
import {
  getDocumentationDocument,
  getDocumentationDocuments,
  getPressKitMedia,
} from "@/requests/documentation";
import { queryKeys } from "./queryKeys";
import { unwrapArray, unwrapItem } from "./helpers";
import type {
  DocumentationDocumentType,
  DocumentationSection,
} from "@/types/DocumentationDocumentType";
import type { PressKitMediaType } from "@/types/PressKitMediaType";

export function useDocumentationDocuments(section: DocumentationSection) {
  return useQuery<DocumentationDocumentType[]>({
    queryKey: queryKeys.documentation.list(section),
    queryFn: async () => {
      const res = await getDocumentationDocuments(section);
      const json = await res.json();
      return unwrapArray<DocumentationDocumentType>(json);
    },
  });
}

export function useDocumentationDocument(
  slug: string,
  section: DocumentationSection,
) {
  return useQuery<DocumentationDocumentType | null>({
    queryKey: queryKeys.documentation.detail(slug, section),
    queryFn: async () => {
      const res = await getDocumentationDocument(slug, section);
      if (!res.ok) return null;
      const json = await res.json();
      return unwrapItem<DocumentationDocumentType>(json);
    },
    enabled: Boolean(slug),
  });
}

export function usePressKitMedia() {
  return useQuery<PressKitMediaType[]>({
    queryKey: queryKeys.documentation.pressKitMedia(),
    queryFn: async () => {
      const res = await getPressKitMedia();
      const json = await res.json();
      return unwrapArray<PressKitMediaType>(json);
    },
  });
}
