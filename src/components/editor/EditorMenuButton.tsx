"use client";

import { Button } from "@/framework/Button";

type EditorMenuButtonProps = {
  onClick: () => void;
  isActive: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  size?: "xs" | "sm";
};

export default function EditorMenuButton({
  onClick,
  isActive,
  disabled,
  children,
  size = "sm",
}: EditorMenuButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      size={size}
      color={isActive ? "blue" : "default"}
    >
      {children}
    </Button>
  );
}
