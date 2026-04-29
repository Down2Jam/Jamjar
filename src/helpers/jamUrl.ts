import type { JamType } from "@/types/JamType";

export type JamUrlOption = {
  id: string;
  slug?: string | null;
};

export function getJamUrlValue(
  jam?: (Pick<JamType, "id"> & { slug?: string | null }) | null,
) {
  if (!jam) return "";
  return jam.slug?.trim() || String(jam.id);
}

export function isAllJamsValue(value?: string | null) {
  return !value || value === "all";
}

export function resolveJamUrlValue(
  value: string | null | undefined,
  options: JamUrlOption[],
) {
  if (isAllJamsValue(value)) return "all";

  const normalized = String(value).trim();
  const match = options.find(
    (option) => option.slug === normalized || option.id === normalized,
  );

  return match?.slug?.trim() || match?.id || "all";
}

export function isNumericJamValue(value?: string | null) {
  return Boolean(value && /^\d+$/.test(value));
}
