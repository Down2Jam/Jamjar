export interface TrackTagCategoryType {
  id: number;
  name: string;
  priority: number;
}

export interface TrackTagType {
  id: number;
  name: string;
  description?: string | null;
  icon?: string | null;
  category: TrackTagCategoryType;
}
