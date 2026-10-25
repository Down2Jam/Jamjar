const legacyKeys = {
  session: "music_session_v1",
  position: "music_position_v1",
  history: "music_history_v1_guest",
  volume: "music_volume",
  shuffle: "music_shuffle",
  transition: "music_transition",
  repeat: "music_repeat",
  minimized: "music_minimized",
  corner: "music_corner",
} as const;

export function storageKeys(namespace = "") {
  return Object.fromEntries(
    Object.entries(legacyKeys).map(([name, key]) => [
      name,
      namespace ? namespace + ":" + key : key,
    ]),
  ) as Record<keyof typeof legacyKeys, string>;
}

export const readStorage = (key: string) => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const writeStorage = (key: string, value: string) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {}
};
