"use client";

import { Button } from "bioloom-ui";

type EditorMenuButtonProps = {
  label?: string;
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  size?: "xs" | "sm";
};

export default function EditorMenuButton({
  label,
  onClick,
  isActive,
  disabled,
  children,
  size = "sm",
}: EditorMenuButtonProps) {
  return (
    <Button
      data-editor-toolbar-action
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      onClick={onClick}
      disabled={disabled}
      size={size}
      color={isActive ? "blue" : "default"}
    >
      {children}
    </Button>
  );
}
