export type PlatformType =
  | "Windows"
  | "MacOS"
  | "Linux"
  | "Web"
  | "Mobile"
  | "Other"
  | "SourceCode";
export interface DownloadLinkType {
  id: number;
  url: string;
  platform: PlatformType;
}
