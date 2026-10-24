import type { Rhythm } from "./rhythm";

export type TransitionMode = "off" | "crossfade" | "automix";

export function automixFadeCurves() {
  const outgoing = new Float32Array(129);
  const incoming = new Float32Array(129);
  for (let i = 0; i < incoming.length; i++) {
    const progress = i / (incoming.length - 1);
    // Smooth the endpoints while keeping combined power constant for unrelated tracks.
    const angle = progress * progress * (3 - 2 * progress) * Math.PI / 2;
    outgoing[i] = Math.cos(angle);
    incoming[i] = Math.sin(angle);
  }
  outgoing[outgoing.length - 1] = 0;
  return { outgoing, incoming };
}

export function planTransition(mode: TransitionMode, duration: number, nextDuration: number, outgoing: number[] | null = null, incoming: number[] | null = null, outRhythm: Rhythm | null = null, inRhythm: Rhythm | null = null) {
  if (mode === "off" || !Number.isFinite(duration) || !Number.isFinite(nextDuration) || duration <= 0 || nextDuration <= 0) return { overlap: 0, intro: 0, beatAligned: false };
  const maximum = Math.min(8, duration * .2, nextDuration * .2);
  let overlap = Math.min(4, maximum);
  let intro = 0;
  if (mode === "automix") {
    if (outgoing?.length) {
      let best = Infinity;
      for (let seconds = Math.min(2, maximum); seconds <= maximum; seconds += .25) {
        const index = Math.min(outgoing.length - 1, Math.floor((duration - seconds) / duration * outgoing.length));
        const energy = (outgoing[index] + (outgoing[index + 1] ?? outgoing[index])) / 2;
        // Prefer a quieter ending, with a small bias toward a four-second overlap.
        const score = energy + Math.abs(seconds - 4) * .015;
        if (score < best) { best = score; overlap = seconds; }
      }
    }
    if (incoming?.length) {
      const limit = Math.min(3, nextDuration * .1);
      const threshold = Math.max(.025, Math.max(...incoming) * .08);
      for (let index = 0; index < incoming.length; index++) {
        const time = index / incoming.length * nextDuration;
        if (time > limit || incoming[index] >= threshold) break;
        intro = Math.min(limit, (index + 1) / incoming.length * nextDuration);
      }
    }
  }
  let beatAligned = false;
  if (mode === "automix" && outRhythm && inRhythm && outRhythm.confidence >= .3 && inRhythm.confidence >= .3 && outRhythm.outroConfidence >= .6 && inRhythm.introConfidence >= .6 && outRhythm.period > 0 && inRhythm.period > 0) {
    const limit = Math.min(16, duration * .2, nextDuration * .2);
    const firstPhrase = inRhythm.phraseConfidence >= .15 ? inRhythm.phrases.find(time => time >= intro && time <= Math.min(5, nextDuration * .1)) : undefined;
    // Keep the intro intact if a phrase anchor would skip too much music.
    const alignedIntro = firstPhrase ?? Math.max(inRhythm.phase, inRhythm.phase + Math.ceil((intro - inRhythm.phase) / inRhythm.period) * inRhythm.period);
    const candidates = outRhythm.phraseConfidence >= .15 ? outRhythm.phrases.filter(time => duration - time >= 2 && duration - time <= limit) : [];
    // Without clear phrase evidence, use beats rather than inventing a downbeat.
    if (!candidates.length) {
      const anchor = outRhythm.phase;
      const bar = outRhythm.period;
      for (let time = anchor + Math.ceil((duration - limit - anchor) / bar) * bar; time <= duration - 2; time += bar) candidates.push(time);
    }
    // We do not time-stretch: reject blends that would drift over a fifth of a beat.
    const compatible = candidates.filter(time => Math.abs(1 / outRhythm.period - 1 / inRhythm.period) * (duration - time) <= .2);
    if (compatible.length && alignedIntro <= Math.min(5, nextDuration * .1)) {
      const target = outRhythm.period * 8;
      const energyAt = (time: number) => outgoing?.[Math.min(outgoing.length - 1, Math.floor(time / duration * outgoing.length))] ?? 0;
      compatible.sort((a, b) => (energyAt(a) + Math.abs(duration - a - target) * .025) - (energyAt(b) + Math.abs(duration - b - target) * .025));
      overlap = duration - compatible[0];
      intro = alignedIntro;
      beatAligned = true;
    }
  }
  return { overlap, intro, beatAligned };
}
