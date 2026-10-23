import type { Rhythm } from "./rhythm";
import { BASE_URL } from "@/requests/config";

const saved = new Map<string, number[]>();
const rhythms = new Map<string, Rhythm | null>();
const durations = new Map<string, number>();
export function getAnalyzedDuration(source: string) { return durations.get(source); }
const gains = new Map<string, number>();
export function getRhythm(source: string) { return rhythms.get(source) ?? null; }
export function getAnalyzedGain(source: string) { return gains.get(source); }

// Analysis is generated once by the upload/backfill worker. Retry while it
// finishes, and cancel promptly when the listener switches tracks.
function waitForAnalysis(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, 10_000);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) { signal.removeEventListener("abort", abort); abort(); }
  });
}

export async function loadWaveform(source: string, signal: AbortSignal, _includeRhythm = false): Promise<number[] | null> {
  try {
    for (let attempt = 0; attempt < 30 && !signal.aborted; attempt++) {
      if (saved.has(source)) return saved.get(source)!;
      const response = await fetch(`${BASE_URL}/tracks/audio-analysis?source=${encodeURIComponent(source)}`, { credentials: "include", signal });
      if (!response.ok) return null;
      const { data } = await response.json();
      if (!data) {
        if (attempt < 29) await waitForAnalysis(signal);
        continue;
      }
      if (!Array.isArray(data.waveform) || data.waveform.length !== 240 || !data.waveform.every((value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1)) return null;
      saved.set(source, data.waveform);
      if (Number.isFinite(data.duration) && data.duration > 0) durations.set(source, data.duration);
      const rhythm = data.rhythm;
      rhythms.set(source, rhythm && Number.isFinite(rhythm.period) && rhythm.period > 0 && Number.isFinite(rhythm.phase) && Array.isArray(rhythm.phrases) && rhythm.phrases.every(Number.isFinite) ? rhythm : null);
      if (Number.isFinite(data.loudnessGainDb)) gains.set(source, Math.max(-24, Math.min(12, data.loudnessGainDb)));
      return data.waveform;
    }
  } catch { return null; }
  return null;
}
export function waveformPath(peaks: number[]): string {
  const upper = peaks.map((value, index) => {
    const amplitude = Math.max(1, Math.min(1, value) * 86);
    // Preserve small peaks and gently compress tall ones into the bottom 7px.
    const height = amplitude <= 6 ? amplitude : 6 + 7 * (1 - Math.exp(-(amplitude - 6) / 7));
    return "L" + (index * 960 / Math.max(1, peaks.length - 1)).toFixed(1) + "," + (100 - height).toFixed(1);
  }).join(" ");
  return "M0,100 " + upper + " L960,100 Z";
}

export function waveformMiniPath(peaks: number[]): string {
  if (!peaks.length) return "";
  const points = peaks.map((value, index) => ({ x: (index * 960 / Math.max(1, peaks.length - 1)).toFixed(1), height: Math.max(0, Math.min(1, value)) * 43 }));
  const upper = points.map(point => `L${point.x},${(50 - point.height).toFixed(1)}`).join(" ");
  const lower = [...points].reverse().map(point => `L${point.x},${(50 + point.height).toFixed(1)}`).join(" ");
  return `M0,50 ${upper} ${lower} Z`;
}
