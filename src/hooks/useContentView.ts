import { useEffect } from "react";
import { recordContentView } from "@/requests/contentViews";

export function useContentView(kind: "game" | "track", id?: number) {
  useEffect(() => {
    if (!id) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let sent = false;
    const controller = new AbortController();
    const stop = () => { clearTimeout(timer); timer = undefined; };
    const start = () => {
      stop();
      if (sent || document.visibilityState !== "visible" || !document.hasFocus()) return;
      timer = setTimeout(() => {
        if (document.visibilityState !== "visible" || !document.hasFocus()) return;
        sent = true;
        void recordContentView(kind, id, "page", controller.signal);
      }, 2000);
    };
    document.addEventListener("visibilitychange", start);
    window.addEventListener("focus", start);
    window.addEventListener("blur", stop);
    start();
    return () => { stop(); controller.abort(); document.removeEventListener("visibilitychange", start); window.removeEventListener("focus", start); window.removeEventListener("blur", stop); };
  }, [kind, id]);
}
