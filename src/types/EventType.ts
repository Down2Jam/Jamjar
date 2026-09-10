export interface EventType {
  id: number;
  slug: string;
  name: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
  host: {
    id: number;
    slug: string;
    name: string;
    profilePicture?: string | null;
  };
  content?: string;
  icon?: string;
  link?: string;
}
