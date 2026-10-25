import type { Rhythm } from "./transitions";

export type AudioAnalysisData = {
  waveform: number[];
  duration?: number;
  rhythm?: Rhythm | null;
  loudnessGainDb?: number;
};
export type AudioAnalysisLoader = (source: string, signal: AbortSignal) => Promise<AudioAnalysisData | null>;
export type AudioAnalysis = ReturnType<typeof createAudioAnalysis>;

// Each host owns its loader and cache; the player never assumes an API endpoint.
export function createAudioAnalysis(load?: AudioAnalysisLoader) {
  const saved = new Map<string, AudioAnalysisData>();
  return {
    getAnalyzedDuration: (source: string) => saved.get(source)?.duration,
    getAnalyzedGain: (source: string) => saved.get(source)?.loudnessGainDb,
    getRhythm: (source: string) => saved.get(source)?.rhythm ?? null,
    async loadWaveform(source: string, signal: AbortSignal): Promise<number[] | null> {
      if (signal.aborted || !load) return null;
      if (saved.has(source)) return saved.get(source)!.waveform;
      try {
        const data = await load(source, signal);
        if (signal.aborted || !data || !Array.isArray(data.waveform) || !data.waveform.length ||
            !data.waveform.every(value => Number.isFinite(value) && value >= 0 && value <= 1)) return null;
        const rhythm = data.rhythm;
        saved.set(source, {
          waveform: data.waveform,
          duration: Number.isFinite(data.duration) && data.duration! > 0 ? data.duration : undefined,
          loudnessGainDb: Number.isFinite(data.loudnessGainDb) ? Math.max(-24, Math.min(12, data.loudnessGainDb!)) : undefined,
          rhythm: rhythm && Number.isFinite(rhythm.period) && rhythm.period > 0 && Number.isFinite(rhythm.phase) &&
            Array.isArray(rhythm.phrases) && rhythm.phrases.every(Number.isFinite) ? rhythm : null,
        });
        return data.waveform;
      } catch { return null; }
    },
  };
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
