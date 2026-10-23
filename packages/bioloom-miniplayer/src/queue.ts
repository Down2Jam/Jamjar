export type QueueTrack = {
  id?: number;
  url?: string;
  pageVersion?: string;
  composer?: { id?: number; slug?: string; name?: string };
  externalAuthorName?: string | null;
  game?: { id?: number; slug?: string; name?: string };
  tags?: Array<{ id?: number; name: string; category?: { name: string } }>;
  bpm?: number | null;
};

export const queueTrackKey = (track: QueueTrack) => `${track.id ?? track.url}:${track.pageVersion ?? "JAM"}`;
export type ShufflePreferences = {
  blocked?: ReadonlySet<number>;
  plays?: ReadonlyMap<string, number>;
  recent?: readonly QueueTrack[];
  automix?: boolean;
  tempo?: (track: QueueTrack, edge: "intro" | "outro") => number | null;
};

function identity(value: QueueTrack["composer"]) {
  return value?.id != null ? `id:${value.id}` : (value?.slug || value?.name)?.trim().toLowerCase();
}

function tagWeights(track: QueueTrack) {
  const weights = new Map<string, number>();
  for (const tag of track.tags ?? []) {
    const category = tag.category?.name.trim().toLowerCase() ?? "";
    const key = tag.id != null ? String(tag.id) : `${category}:${tag.name.trim().toLowerCase()}`;
    weights.set(key, category === "genre" || category === "mood" ? 3 : 1);
  }
  return weights;
}

function similarity(previous: QueueTrack, candidate: QueueTrack) {
  const left = tagWeights(previous);
  const right = tagWeights(candidate);
  let shared = 0;
  let total = 0;
  for (const key of new Set([...left.keys(), ...right.keys()])) {
    shared += Math.min(left.get(key) ?? 0, right.get(key) ?? 0);
    total += Math.max(left.get(key) ?? 0, right.get(key) ?? 0);
  }
  const tags = total ? shared / total : 0;
  const a = previous.bpm;
  const b = candidate.bpm;
  const tempo = a && b && Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0
    ? Math.max(0, 1 - Math.abs(Math.log2(a / b)) / .4)
    : 0;
  return 1 + tags * 6 + tempo * 1.5;
}

function randomUnqueued(size: number, excluded: Set<number>, random: () => number) {
  let index = Math.floor(random() * (size - excluded.size));
  for (const blocked of [...excluded].sort((a, b) => a - b)) {
    if (blocked <= index) index++;
  }
  return index;
}

function shuffledChoice(tracks: readonly QueueTrack[], size: number, previous: number | null, excluded: Set<number>, random: () => number, recent: readonly QueueTrack[], preferences: ShufflePreferences) {
  const reference = previous == null ? null : tracks[previous];
  // Discovery drops the similarity bias, but still respects spacing and repeats.
  const discovery = random() < .25;
  // Sample a bounded shortlist rather than ranking the entire playback scope.
  const sampled = new Set(excluded);
  const candidates: Array<{ index: number; weight: number }> = [];
  const count = Math.min(24, size - excluded.size);
  for (let i = 0; i < count; i++) {
    const index = randomUnqueued(size, sampled, random);
    sampled.add(index);
    const track = tracks[index];
    let weight = track && reference && !discovery ? similarity(reference, track) : 1;
    if (track) {
      // Repeated genre runs gradually loosen the similarity preference.
      if (!discovery && reference && recent.length >= 3 && recent.slice(-3).every(last => similarity(last, track) >= 6)) weight = 1 + (weight - 1) * .35;
      const artist = identity(track.composer) || track.externalAuthorName?.trim().toLowerCase();
      const game = identity(track.game);
      for (const [distance, last] of [...recent].reverse().slice(0, 3).entries()) {
        if (artist && artist === (identity(last.composer) || last.externalAuthorName?.trim().toLowerCase())) weight *= distance === 0 ? .12 : .5;
        if (game && game === identity(last.game)) weight *= distance === 0 ? .18 : .6;
        if (queueTrackKey(track) === queueTrackKey(last)) weight *= .05;
      }
      // Prefer tempos that stay aligned during an overlap; never time-stretch here.
      if (preferences.automix && reference) {
        const a = preferences.tempo?.(reference, "outro") ?? reference.bpm;
        const b = preferences.tempo?.(track, "intro") ?? track.bpm;
        if (a && b && Number.isFinite(a) && Number.isFinite(b) && a > 0 && b > 0) {
          const drift = Math.abs(a - b) / 60 * 4;
          weight *= 1 + 3 * Math.max(0, 1 - drift / .5);
        }
      }
    }
    candidates.push({ index, weight });
  }
  let choice = random() * candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  for (const candidate of candidates) {
    choice -= candidate.weight;
    if (choice < 0) return candidate.index;
  }
  return candidates[candidates.length - 1].index;
}

// Keep only the next ten choices; the full scope stays in the track library.
export function fillQueue(scope: number | readonly QueueTrack[], current: number | null, pending: number[], shuffle: boolean, random = Math.random, preferences: ShufflePreferences = {}) {
  const tracks = typeof scope === "number" ? [] : scope;
  const size = typeof scope === "number" ? scope : scope.length;
  if (!size) return [];
  if (size === 1) return preferences.blocked?.has(0) ? [] : [0];
  const excluded = new Set([...preferences.blocked ?? []].filter(index => index >= 0 && index < size));
  if (current != null) excluded.add(current);
  const limit = Math.min(10, size - excluded.size);
  const queue: number[] = [];
  const counts = tracks.map(track => preferences.plays?.get(queueTrackKey(track)) ?? 0);
  const recent = [...(preferences.recent ?? []).slice(-3)];
  // The current track may not have been recorded yet when a new scope starts.
  if (current != null && tracks[current]) {
    counts[current] = Math.max(1, counts[current]);
    if (queueTrackKey(recent[recent.length - 1] ?? {}) !== queueTrackKey(tracks[current])) recent.push(tracks[current]);
  }
  for (const index of pending) {
    if (queue.length === limit) break;
    if (index < 0 || index >= size || excluded.has(index)) continue;
    queue.push(index);
    excluded.add(index);
    if (tracks[index]) { counts[index]++; recent.push(tracks[index]); }
  }
  while (queue.length < limit) {
    let index: number;
    if (shuffle) {
      // Reserve pending tracks in the play counts so refills cross cycle boundaries
      // without repeating a track before the rest of the scope has had a turn.
      const eligible = new Set(excluded);
      if (tracks.length) {
        let minimum = Infinity;
        for (let i = 0; i < size; i++) if (!excluded.has(i)) minimum = Math.min(minimum, counts[i]);
        for (let i = 0; i < size; i++) if (counts[i] > minimum) eligible.add(i);
      }
      index = shuffledChoice(tracks, size, queue[queue.length - 1] ?? current, eligible, random, recent, preferences);
    } else {
      index = ((queue[queue.length - 1] ?? current ?? -1) + 1) % size;
      while (excluded.has(index)) index = (index + 1) % size;
    }
    queue.push(index);
    excluded.add(index);
    if (tracks[index]) { counts[index]++; recent.push(tracks[index]); }
  }
  return queue;
}
