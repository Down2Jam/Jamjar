export type EventIcon =
  | "gamepad2"
  | "code"
  | "palette"
  | "filecode"
  | "trophy"
  | "calendar";

const STREAM_EVENT_ICONS = new Set<EventIcon>([
  "gamepad2",
  "code",
  "palette",
  "filecode",
  "trophy",
]);

export function isStreamEventIcon(icon?: string): boolean {
  return Boolean(icon && STREAM_EVENT_ICONS.has(icon as EventIcon));
}
