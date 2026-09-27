import type { ReactNode } from "react";
import { Hstack } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";
import "./game-editor.css";

type EditorFooterProps = {
  floating: boolean;
  compact?: boolean;
  status: ReactNode;
  description: ReactNode;
  children?: ReactNode;
};

export default function EditorFooter({ floating, compact = false, status, description, children }: EditorFooterProps) {
  const { colors } = useTheme();

  return (
    <footer
      className={`game-editor-footer ${floating ? "game-editor-footer-floating" : ""} ${compact ? "game-editor-footer-compact" : ""}`}
      style={{
        backgroundColor: colors.mantle,
        borderColor: `color-mix(in srgb, ${colors.text} 5%, ${colors.mantle})`,
        color: colors.text,
      }}
    >
      <div className="game-editor-footer-content">
        <div className="game-editor-save-status">
          <strong>{status}</strong>
          <span style={{ color: colors.text }}>{description}</span>
        </div>
        {children && <Hstack wrap justify="end">{children}</Hstack>}
      </div>
    </footer>
  );
}
