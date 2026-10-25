import { useContext } from "react";
import { MusicContext } from "../context/MusicContext";

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error("useMusic must be used within MusicProvider");
  return ctx;
}
