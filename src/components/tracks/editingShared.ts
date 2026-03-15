export const SINGLE_TRACK_TAG_CATEGORIES = new Set(["Looping"]);

export const TRACK_TAG_CATEGORY_HELPERS: Record<string, string> = {
  Genre:
    "What kind of music this is stylistically, like chiptune, orchestral, or electronic.",
  Mood:
    "How the track feels emotionally, like calm, tense, triumphant, or dreamy.",
  "Use Case":
    "What part of a game this best fits, like menu, battle, boss, town, or credits.",
  Looping:
    "Whether this track is meant to loop cleanly, play through once, or act as a short stinger.",
};

export const TRACK_CREDIT_ROLE_OPTIONS = [
  "Composer",
  "Vocalist",
  "Lyricist",
  "Producer",
  "Mixing",
  "Mastering",
  "Instrumentalist",
  "Sound Designer",
  "Arranger",
] as const;

export type LicenseFlags = {
  attribution: boolean;
  commercial: boolean;
  derivatives: boolean;
  shareAlike: boolean;
};

export type LicenseMode = "ARR" | "CC0" | "CC_BY";

export const licenseModeForFlags = (flags: LicenseFlags): LicenseMode => {
  if (!flags.attribution && !flags.commercial && !flags.derivatives) {
    return "ARR";
  }
  if (!flags.attribution && flags.commercial) {
    return "CC0";
  }
  return "CC_BY";
};

export const licenseFlagsToLabel = (flags: LicenseFlags) => {
  if (
    !flags.attribution &&
    !flags.commercial &&
    !flags.derivatives &&
    !flags.shareAlike
  ) {
    return "All rights reserved";
  }

  if (!flags.attribution && flags.commercial) return "CC0";
  const prefix = "CC BY";
  const suffixParts: string[] = [];
  if (!flags.commercial) suffixParts.push("NC");
  if (!flags.derivatives) {
    suffixParts.push("ND");
  } else if (flags.shareAlike) {
    suffixParts.push("SA");
  }
  return suffixParts.length > 0 ? `${prefix}-${suffixParts.join("-")}` : prefix;
};

export const backgroundUsageAllowedByDefault = (flags: LicenseFlags) => {
  if (!flags.attribution && flags.commercial && flags.derivatives) {
    return true;
  }

  return (
    flags.attribution &&
    flags.commercial &&
    flags.derivatives &&
    !flags.shareAlike
  );
};

export const backgroundUsageRequiredByLicense = (flags: LicenseFlags) =>
  backgroundUsageAllowedByDefault(flags);

export const backgroundUsageAttributionAllowedByDefault = (
  flags: LicenseFlags,
) => licenseModeForFlags(flags) !== "CC0";

export const backgroundUsageWithLicenseDefaults = (
  currentValue: boolean,
  previousFlags: LicenseFlags,
  nextFlags: LicenseFlags,
) => {
  const previousDefault = backgroundUsageAllowedByDefault(previousFlags);
  const nextDefault = backgroundUsageAllowedByDefault(nextFlags);

  return currentValue === previousDefault ? nextDefault : currentValue;
};

export const backgroundUsageAttributionWithLicenseDefaults = (
  currentValue: boolean,
  previousFlags: LicenseFlags,
  nextFlags: LicenseFlags,
) => {
  const previousDefault =
    backgroundUsageAttributionAllowedByDefault(previousFlags);
  const nextDefault = backgroundUsageAttributionAllowedByDefault(nextFlags);

  return currentValue === previousDefault ? nextDefault : currentValue;
};

export const parseLicenseFlags = (license?: string | null): LicenseFlags => {
  const normalized = (license ?? "").toUpperCase().replace(/\s+/g, " ").trim();
  if (!normalized || normalized === "ALL RIGHTS RESERVED") {
    return {
      attribution: false,
      commercial: false,
      derivatives: false,
      shareAlike: false,
    };
  }
  if (normalized.startsWith("CC0")) {
    return {
      attribution: false,
      commercial: true,
      derivatives: true,
      shareAlike: false,
    };
  }

  const hasNc = normalized.includes("NC");
  const hasNd = normalized.includes("ND");
  const hasSa = normalized.includes("SA");
  return {
    attribution: true,
    commercial: !hasNc,
    derivatives: !hasNd,
    shareAlike: !hasNd && hasSa,
  };
};
