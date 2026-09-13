import { useCallback, useEffect, useRef, useState } from "react";

/** Delay opening hover content, cancelling immediately when its trigger is left. */
export function useDelayedHover<T>(inactive: T, delay = 500) {
  const [value, setValue] = useState<T>(inactive);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current !== null) clearTimeout(timer.current);
  }, []);

  const setHovered = useCallback((next: T) => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    setValue(inactive);
    if (next !== inactive) {
      timer.current = setTimeout(() => {
        timer.current = null;
        setValue(next);
      }, delay);
    }
  }, [inactive, delay]);

  return [value, setHovered] as const;
}
