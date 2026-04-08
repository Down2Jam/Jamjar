import { getCookie } from "@/helpers/cookie";
import { BASE_URL } from "./config";
import type { DocumentationSection } from "@/types/DocumentationDocumentType";

export async function getDocumentationDocuments(section: DocumentationSection) {
  return fetch(`${BASE_URL}/documentation-documents?section=${section}`);
}

export async function getDocumentationDocument(
  slug: string,
  section: DocumentationSection,
) {
  return fetch(
    `${BASE_URL}/documentation-document?slug=${slug}&section=${section}`,
  );
}

export async function createDocumentationDocument(
  title: string,
  content: string,
  section: DocumentationSection,
  icon: string,
) {
  return fetch(`${BASE_URL}/documentation-document`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      title,
      content,
      section,
      icon,
      username: getCookie("user"),
    }),
  });
}

export async function updateDocumentationDocument(
  documentId: number,
  updates: {
    title?: string;
    content?: string;
    icon?: string;
    order?: number;
  },
) {
  return fetch(`${BASE_URL}/documentation-document`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      documentId,
      username: getCookie("user"),
      ...updates,
    }),
  });
}

export async function deleteDocumentationDocument(documentId: number) {
  return fetch(`${BASE_URL}/documentation-document`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      documentId,
      username: getCookie("user"),
    }),
  });
}

export async function getPressKitMedia() {
  return fetch(`${BASE_URL}/press-kit-media`);
}

export async function createPressKitMedia(image: string, altText?: string) {
  return fetch(`${BASE_URL}/press-kit-media`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      image,
      altText: altText?.trim() || undefined,
      username: getCookie("user"),
    }),
  });
}

export async function deletePressKitMedia(mediaId: number) {
  return fetch(`${BASE_URL}/press-kit-media`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      authorization: `Bearer ${getCookie("token")}`,
    },
    credentials: "include",
    body: JSON.stringify({
      mediaId,
      username: getCookie("user"),
    }),
  });
}
