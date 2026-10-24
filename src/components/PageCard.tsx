import type { CSSProperties, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/providers/useSiteTheme";

export default function PageCard({ title, description, icon: HeadingIcon, children, hasTabs = false }: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  hasTabs?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <div
      className="mx-auto box-border flex w-full max-w-[1200px] flex-col gap-[18px] rounded-[14px] bg-[var(--editor-surface)] p-8 text-[var(--editor-text)] shadow-[-22px_0_34px_-18px_rgb(0_0_0_/_78%),22px_0_34px_-18px_rgb(0_0_0_/_78%)] max-[700px]:min-h-[calc(100dvh_-_var(--site-navbar-height,0px)_-_5rem_-_env(safe-area-inset-bottom))] max-[700px]:rounded-none max-[700px]:p-[24px_max(16px,env(safe-area-inset-right))_24px_max(16px,env(safe-area-inset-left))] max-[700px]:gap-[14px] max-[700px]:shadow-none [&_.settings-editor-panel]:border-0! [&_.settings-editor-panel]:rounded-none! [&_.settings-editor-panel]:bg-transparent! [&_.settings-editor-panel]:px-2! sm:[&_.settings-editor-panel]:px-3! max-[700px]:[&_.settings-editor-panel]:px-0! [&_.game-editor-panel-heading]:mx-0! [&_.game-editor-panel-heading]:px-0!"
      style={{ "--editor-surface": colors.mantle, "--editor-text": colors.text, "--editor-muted": colors.textFaded, "--editor-accent": colors.blue } as CSSProperties}
    >
      <header className="flex flex-col items-start gap-2 px-2 pt-4 pb-1 sm:px-3 sm:pt-5 max-[700px]:items-center max-[700px]:p-[0_0_8px] max-[700px]:text-center">
        <h1 className="m-0 flex items-center gap-3 text-[clamp(36px,4vw,52px)] font-bold leading-[1.15] tracking-[-.035em] max-[700px]:text-[36px]">
          <HeadingIcon aria-hidden="true" strokeWidth={3} className="h-[1em] w-[1em] shrink-0" />
          {title}
        </h1>
        <p className="m-0 text-base text-[var(--editor-muted)] max-[700px]:text-sm">{description}</p>
      </header>
      {!hasTabs && <hr className="m-0 w-full border-0 border-t border-[color-mix(in_srgb,var(--editor-text)_9%,transparent)]" />}
      {children}
    </div>
  );
}
