import { getTrackLicense } from "@/helpers/trackLicense";
import {
  FaCopyright,
  FaCreativeCommons,
  FaCreativeCommonsBy,
  FaCreativeCommonsNc,
  FaCreativeCommonsNd,
  FaCreativeCommonsSa,
  FaCreativeCommonsZero,
} from "react-icons/fa";

export default function LicenseMark({ license }: { license: string }) {
  const normalized = getTrackLicense(license).label.toUpperCase().replace(/\s+/g, " ").trim();

  if (normalized === "ALL RIGHTS RESERVED") {
    return (
      <span aria-hidden="true" className="flex shrink-0 items-center">
        <FaCopyright size={18} />
      </span>
    );
  }

  if (normalized.startsWith("CC0")) {
    return (
      <span
        aria-hidden="true"
        className="flex shrink-0 items-center -space-x-0.5"
      >
        <FaCreativeCommons size={16} />
        <FaCreativeCommonsZero size={16} />
      </span>
    );
  }

  const terms = new Set(normalized.split(/[\s-]+/));

  return (
    <span
      aria-hidden="true"
      className="flex shrink-0 items-center -space-x-0.5"
    >
      <FaCreativeCommons size={16} />
      {terms.has("BY") && <FaCreativeCommonsBy size={16} />}
      {terms.has("NC") && <FaCreativeCommonsNc size={16} />}
      {terms.has("ND") && <FaCreativeCommonsNd size={16} />}
      {terms.has("SA") && <FaCreativeCommonsSa size={16} />}
    </span>
  );
}
