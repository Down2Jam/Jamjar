import { createAudioAnalysis } from "bioloom-miniplayer/core";
import { BASE_URL } from "@/requests/config";

function waitForAnalysis(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", abort); resolve(); }, 10_000);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) { signal.removeEventListener("abort", abort); abort(); }
  });
}

// The upload worker may still be generating analysis when playback begins.
export const audioAnalysis = createAudioAnalysis(async (source, signal) => {
  for (let attempt = 0; attempt < 30 && !signal.aborted; attempt++) {
    const response = await fetch(`${BASE_URL}/tracks/audio-analysis?source=${encodeURIComponent(source)}`, { credentials: "include", signal });
    if (!response.ok) return null;
    const { data } = await response.json();
    if (data) return data;
    if (attempt < 29) await waitForAnalysis(signal);
  }
  return null;
});
