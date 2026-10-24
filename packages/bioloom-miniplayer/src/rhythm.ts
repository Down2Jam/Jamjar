export type Rhythm = { period: number; phase: number; confidence: number; introConfidence: number; outroConfidence: number; phraseConfidence: number; phrases: number[] };

// Estimate a steady beat grid from short-window energy increases. Phrase anchors
// are guesses in four-beat meter, weighted toward changes in musical intensity.
export function analyzeRhythm(audio: AudioBuffer): Rhythm | null {
  const hop = Math.max(1, Math.round(audio.sampleRate * .01));
  const step = hop / audio.sampleRate;
  const length = Math.floor(audio.length / hop);
  if (length < 800) return null;
  const energy = new Float32Array(length);
  for (let channel = 0; channel < audio.numberOfChannels; channel++) {
    const samples = audio.getChannelData(channel);
    for (let frame = 0; frame < length; frame++) {
      let sum = 0;
      for (let i = frame * hop; i < (frame + 1) * hop; i += 4) sum += samples[i] * samples[i];
      energy[frame] += Math.sqrt(sum / Math.ceil(hop / 4)) / audio.numberOfChannels;
    }
  }
  const onset = new Float32Array(length);
  let total = 0;
  for (let i = 1; i < length; i++) {
    onset[i] = Math.max(0, energy[i] - energy[i - 1]);
    total += onset[i] * onset[i];
  }
  if (total < 1e-8) return null;
  let best = 0;
  let lag = 0;
  for (let candidate = Math.round(.333 / step); candidate <= Math.round(1 / step); candidate++) {
    let correlation = 0;
    let left = 0;
    let right = 0;
    for (let i = candidate; i < length; i++) {
      correlation += onset[i] * onset[i - candidate];
      left += onset[i] ** 2;
      right += onset[i - candidate] ** 2;
    }
    const score = correlation / Math.sqrt(left * right || 1);
    if (score > best) { best = score; lag = candidate; }
  }
  if (best < .18 || !lag) return null;
  // Refine period below frame resolution to avoid drifting across long tracks.
  let gridScore = -Infinity;
  let period = lag;
  let phase = 0;
  for (let candidate = lag - .5; candidate <= lag + .5; candidate += .025) {
    for (let offset = 0; offset < candidate; offset++) {
      let score = 0;
      let count = 0;
      for (let frame = offset; frame < length - 2; frame += candidate) {
        const i = Math.round(frame);
        score += Math.max(onset[i - 1] || 0, onset[i], onset[i + 1]);
        count++;
      }
      score /= Math.max(1, count);
      if (score > gridScore) { gridScore = score; period = candidate; phase = offset; }
    }
  }
  // Validate the fitted grid independently at each end. Correlation alone can
  // mistake noise, a few isolated hits, or a changing tempo for a steady beat.
  const gridConfidence = (from: number, to: number) => {
    let onBeat = 0;
    let offBeat = 0;
    let supported = 0;
    let count = 0;
    let localPower = 0;
    for (let i = from; i < to; i++) localPower += onset[i] ** 2;
    const threshold = Math.sqrt(localPower / Math.max(1, to - from)) * 1.5;
    const peakAt = (frame: number) => {
      const i = Math.round(frame);
      return Math.max(onset[i - 1] || 0, onset[i] || 0, onset[i + 1] || 0);
    };
    for (let frame = phase + Math.ceil((from - phase) / period) * period; frame + period * .75 < to; frame += period) {
      const peak = peakAt(frame);
      onBeat += peak;
      offBeat += (peakAt(frame + period * .25) + peakAt(frame + period * .75)) / 2;
      if (peak > Math.max(1e-5, threshold)) supported++;
      count++;
    }
    if (count < 8 || !onBeat) return 0;
    return Math.max(0, 1 - offBeat / onBeat) * supported / count;
  };
  const windowFrames = Math.min(length, Math.round(Math.max(16 / step, period * 16)));
  const introConfidence = gridConfidence(0, windowFrames);
  const outroConfidence = gridConfidence(length - windowFrames, length);
  const confidence = Math.min(best, gridConfidence(0, length));
  let phraseOffset = 0;
  let phraseScore = -Infinity;
  let secondPhraseScore = -Infinity;
  const strength = (frame: number) => {
    const i = Math.round(frame);
    let before = 0;
    let after = 0;
    const window = Math.round(period * 2);
    for (let j = 0; j < window; j++) {
      before += energy[Math.max(0, i - j - 1)] || 0;
      after += energy[Math.min(length - 1, i + j)] || 0;
    }
    return Math.abs(after - before) / window + (onset[i] || 0);
  };
  for (let offset = 0; offset < 16; offset++) {
    let score = 0;
    let count = 0;
    for (let frame = phase + offset * period; frame < length; frame += period * 16) { score += strength(frame); count++; }
    score /= Math.max(1, count);
    if (score > phraseScore) { secondPhraseScore = phraseScore; phraseScore = score; phraseOffset = offset; }
    else secondPhraseScore = Math.max(secondPhraseScore, score);
  }
  const phraseConfidence = length >= period * 48 && phraseScore > 0 ? Math.max(0, (phraseScore - secondPhraseScore) / phraseScore) : 0;
  const phrases: number[] = [];
  for (let frame = phase + phraseOffset * period; frame < length; frame += period * 16) phrases.push(frame * step);
  return { period: period * step, phase: phase * step, confidence, introConfidence, outroConfidence, phraseConfidence, phrases };
}
