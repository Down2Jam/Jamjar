"use client";

import { ReactNode } from "react";
import Popover from "@/framework/Popover";
import { Vstack, Hstack } from "@/framework/Stack";
import { Button } from "@/framework/Button";
import Text from "@/framework/Text";
import { IconName } from "./Icon";

interface DialogProps {
  shown: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children: ReactNode;
  confirm?: { icon?: IconName; label?: string };
  cancel?: { icon?: IconName; label?: string };
}

export function Dialog({
  shown,
  onClose,
  onConfirm,
  children,
  confirm = { icon: "check", label: "OK" },
  cancel = { icon: "x", label: "Close" },
}: DialogProps) {
  return (
    <Popover
      shown={shown}
      anchorToScreen
      position="center"
      onClose={onClose}
      showCloseButton
    >
      <Vstack gap={3} className="p-3 min-w-[250px]">
        {typeof children === "string" ? <Text>{children}</Text> : children}
        <Hstack justify="end" gap={2}>
          <Button
            type="button"
            icon={cancel.icon}
            color="default"
            onClick={onClose}
          >
            {cancel.label}
          </Button>
          <Button
            type="button"
            icon={confirm.icon}
            color="green"
            onClick={onConfirm}
          >
            {confirm.label}
          </Button>
        </Hstack>
      </Vstack>
    </Popover>
  );
}
