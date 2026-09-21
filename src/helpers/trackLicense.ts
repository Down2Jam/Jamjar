export type TrackOrigin = "ORIGINAL" | "ASSET_PACK";

export type TrackLicenseCode =
  | "ALL_RIGHTS_RESERVED"
  | "CC0_1_0"
  | "CC_BY_3_0"
  | "CC_BY_4_0"
  | "CC_BY_SA_3_0"
  | "CC_BY_SA_4_0"
  | "CC_BY_ND_3_0"
  | "CC_BY_ND_4_0"
  | "CC_BY_NC_3_0"
  | "CC_BY_NC_4_0"
  | "CC_BY_NC_SA_3_0"
  | "CC_BY_NC_SA_4_0"
  | "CC_BY_NC_ND_3_0"
  | "CC_BY_NC_ND_4_0";

type TrackLicenseDefinition = {
  label: string;
  url: string;
  allowDownload: boolean;
};

const ccUrl = (path: string, version: "3.0" | "4.0") =>
  `https://creativecommons.org/licenses/${path}/${version}/`;

export const TRACK_LICENSES: Record<TrackLicenseCode, TrackLicenseDefinition> = {
  ALL_RIGHTS_RESERVED: { label: "All rights reserved", url: "https://en.wikipedia.org/wiki/All_rights_reserved", allowDownload: false },
  CC0_1_0: { label: "CC0 1.0", url: "https://creativecommons.org/publicdomain/zero/1.0/", allowDownload: true },
  CC_BY_3_0: { label: "CC BY 3.0", url: ccUrl("by", "3.0"), allowDownload: true },
  CC_BY_4_0: { label: "CC BY 4.0", url: ccUrl("by", "4.0"), allowDownload: true },
  CC_BY_SA_3_0: { label: "CC BY-SA 3.0", url: ccUrl("by-sa", "3.0"), allowDownload: true },
  CC_BY_SA_4_0: { label: "CC BY-SA 4.0", url: ccUrl("by-sa", "4.0"), allowDownload: true },
  CC_BY_ND_3_0: { label: "CC BY-ND 3.0", url: ccUrl("by-nd", "3.0"), allowDownload: true },
  CC_BY_ND_4_0: { label: "CC BY-ND 4.0", url: ccUrl("by-nd", "4.0"), allowDownload: true },
  CC_BY_NC_3_0: { label: "CC BY-NC 3.0", url: ccUrl("by-nc", "3.0"), allowDownload: true },
  CC_BY_NC_4_0: { label: "CC BY-NC 4.0", url: ccUrl("by-nc", "4.0"), allowDownload: true },
  CC_BY_NC_SA_3_0: { label: "CC BY-NC-SA 3.0", url: ccUrl("by-nc-sa", "3.0"), allowDownload: true },
  CC_BY_NC_SA_4_0: { label: "CC BY-NC-SA 4.0", url: ccUrl("by-nc-sa", "4.0"), allowDownload: true },
  CC_BY_NC_ND_3_0: { label: "CC BY-NC-ND 3.0", url: ccUrl("by-nc-nd", "3.0"), allowDownload: true },
  CC_BY_NC_ND_4_0: { label: "CC BY-NC-ND 4.0", url: ccUrl("by-nc-nd", "4.0"), allowDownload: true },
};

export const ASSET_TRACK_LICENSE_OPTIONS: TrackLicenseCode[] = [
  "CC0_1_0",
  "CC_BY_4_0",
  "CC_BY_3_0",
  "CC_BY_SA_4_0",
  "CC_BY_SA_3_0",
  "CC_BY_ND_4_0",
  "CC_BY_ND_3_0",
  "CC_BY_NC_4_0",
  "CC_BY_NC_3_0",
  "CC_BY_NC_SA_4_0",
  "CC_BY_NC_SA_3_0",
  "CC_BY_NC_ND_4_0",
  "CC_BY_NC_ND_3_0",
];

const LEGACY_LICENSES: Record<string, TrackLicenseCode> = {
  "": "ALL_RIGHTS_RESERVED",
  "ALL RIGHTS RESERVED": "ALL_RIGHTS_RESERVED",
  CC0: "CC0_1_0",
  "CC0 1.0": "CC0_1_0",
  "CC BY": "CC_BY_4_0",
  "CC BY 3.0": "CC_BY_3_0",
  "CC BY 4.0": "CC_BY_4_0",
  "CC BY-SA": "CC_BY_SA_4_0",
  "CC BY-SA 3.0": "CC_BY_SA_3_0",
  "CC BY-SA 4.0": "CC_BY_SA_4_0",
  "CC BY-ND": "CC_BY_ND_4_0",
  "CC BY-ND 3.0": "CC_BY_ND_3_0",
  "CC BY-ND 4.0": "CC_BY_ND_4_0",
  "CC BY-NC": "CC_BY_NC_4_0",
  "CC BY-NC 3.0": "CC_BY_NC_3_0",
  "CC BY-NC 4.0": "CC_BY_NC_4_0",
  "CC BY-NC-SA": "CC_BY_NC_SA_4_0",
  "CC BY-NC-SA 3.0": "CC_BY_NC_SA_3_0",
  "CC BY-NC-SA 4.0": "CC_BY_NC_SA_4_0",
  "CC BY-NC-ND": "CC_BY_NC_ND_4_0",
  "CC BY-NC-ND 3.0": "CC_BY_NC_ND_3_0",
  "CC BY-NC-ND 4.0": "CC_BY_NC_ND_4_0",
};

export function normalizeTrackLicense(value?: string | null): TrackLicenseCode {
  if (value && value in TRACK_LICENSES) return value as TrackLicenseCode;
  return LEGACY_LICENSES[(value ?? "").toUpperCase().replace(/\s+/g, " ").trim()] ?? "ALL_RIGHTS_RESERVED";
}

export function getTrackLicense(value?: string | null) {
  return TRACK_LICENSES[normalizeTrackLicense(value)];
}

export function getTrackLicenseVersion(value?: string | null): "3.0" | "4.0" {
  return normalizeTrackLicense(value).endsWith("_3_0") ? "3.0" : "4.0";
}
