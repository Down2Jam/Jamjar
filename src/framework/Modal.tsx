"use client";

import { useState } from "react";
import Popover from "@/framework/Popover";
import { Vstack, Hstack } from "@/framework/Stack";
import { Input } from "@/framework/Input";
import { Textarea } from "@/framework/Textarea";
import { Button } from "@/framework/Button";
import { IconName } from "./Icon";
import Text from "./Text";

interface ModalProps {
  shown: boolean;
  onClose: () => void;
  onSubmit: (formData: { [key: string]: string }) => void;
  fields: {
    name: string;
    label: string;
    description: string;
    type?: "input" | "textarea";
  }[];
  confirm?: { icon?: IconName; label?: string };
  cancel?: { icon?: IconName; label?: string };
}

export default function Modal({
  shown,
  onClose,
  onSubmit,
  fields,
  confirm = { icon: "check", label: "Confirm" },
  cancel = { icon: "x", label: "Cancel" },
}: ModalProps) {
  const [formState, setFormState] = useState<{ [key: string]: string }>({});

  const handleChange = (name: string, value: string) => {
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formState);
    onClose();
  };

  return (
    <Popover
      shown={shown}
      anchorToScreen
      position="center"
      onClose={onClose}
      showCloseButton
    >
      <form onSubmit={handleSubmit}>
        <Vstack gap={3} className="p-2 min-w-[250px]">
          {fields.map(({ name, label, description, type = "input" }) =>
            type === "textarea" ? (
              <Vstack key={name}>
                <div>
                  <Text color="text">{label}</Text>
                  <Text color="textFaded" size="xs">
                    {description}
                  </Text>
                </div>
                <Textarea
                  value={formState[name] || ""}
                  onValueChange={(v) => handleChange(name, v)}
                  fullWidth
                />
              </Vstack>
            ) : (
              <Vstack key={name}>
                <div>
                  <Text color="text">{label}</Text>
                  <Text color="textFaded" size="xs">
                    {description}
                  </Text>
                </div>
                <Input
                  value={formState[name] || ""}
                  onValueChange={(v) => handleChange(name, v)}
                  fullWidth
                />
              </Vstack>
            )
          )}
          <Hstack justify="end" gap={2}>
            <Button
              type="button"
              icon={cancel.icon}
              color="default"
              onClick={onClose}
            >
              {cancel.label}
            </Button>
            <Button type="submit" icon={confirm.icon} color="green">
              {confirm.label}
            </Button>
          </Hstack>
        </Vstack>
      </form>
    </Popover>
  );
}
