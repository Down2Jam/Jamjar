import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "bioloom-ui";
import useBreakpoint from "@/hooks/useBreakpoint";

export default function MusicFilters({ children, open, onOpenChange }: {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { width } = useBreakpoint();
  const mobile = width <= 700;
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!mobile || !open || !element) return;

    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [mobile, open]);

  if (!mobile) return children;

  return <>
    <dialog ref={dialog} className="music-filter-sheet fixed inset-[auto_0_0] m-0 p-0 w-full max-w-none max-h-[90dvh] border-0 rounded-t-[20px] bg-[var(--music-surface)] text-[var(--music-text)] backdrop:bg-black/65 [&_.music-desktop-filter-toggle]:hidden" aria-labelledby="music-filter-title"
      onCancel={() => onOpenChange(false)}
      onClick={event => { if (event.target === event.currentTarget) onOpenChange(false); }}>
      <div className="music-filter-sheet-content p-[20px_max(20px,env(safe-area-inset-right))_max(20px,env(safe-area-inset-bottom))_max(20px,env(safe-area-inset-left))]">
        <div className="music-filter-sheet-header flex items-center justify-between mb-5 [&_h2]:text-[22px] [&_h2]:font-bold [&_button]:min-h-11">
          <h2 id="music-filter-title">Filters</h2>
          <Button variant="ghost" icon="x" aria-label="Close filters" onClick={() => onOpenChange(false)} />
        </div>
        <div className="music-filter-sheet-body [&>div]:gap-4">{children}</div>
        <div className="music-filter-sheet-footer flex justify-end pt-5 [&_button]:min-h-11">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </div>
    </dialog>
  </>;
}
