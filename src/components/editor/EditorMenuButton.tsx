"use client";

import { Button } from "@heroui/react";

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
      variant="light"
      onPress={onClick}
      isDisabled={disabled}
      size="sm"
      isIconOnly
      className={`${
        isActive ? "bg-blue-500 data-[hover=true]:bg-blue-400" : ""
      }`}
    >
      {children}
    </Button>
  );
}
