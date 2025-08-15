"use client";

import { Button } from "@/framework/Button";

type EditorMenuButtonProps = {
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

export default function EditorMenuButton({
  onClick,
  isActive,
  disabled,
  children,
}: EditorMenuButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      size="sm"
      color={isActive ? "blue" : "default"}
    >
      {children}
    </Button>
  );
}
