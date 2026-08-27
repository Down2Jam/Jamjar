import { TagCategoryType } from "./TagCategoryType";

export interface TagType {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  autoRegex: string | null;
  modOnly: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
  alwaysAdded: boolean;
  icon: string | null;
  gameTag: boolean;
  postTag: boolean;
  category: TagCategoryType;
}
