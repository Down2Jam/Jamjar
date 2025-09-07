"use client";

import { useMemo, useState } from "react";
import Popover from "@/framework/Popover";
import { Vstack, Hstack } from "@/framework/Stack";
import { Input } from "@/framework/Input";
import { Textarea } from "@/framework/Textarea";
import { Button } from "@/framework/Button";
import Icon, { IconName } from "./Icon";
import Text from "./Text";
import Image from "next/image";

type BaseField = {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
};

type InputField = BaseField & {
  type?: "input" | "textarea";
};

type NumberField = BaseField & {
  type: "number";
  min?: number;
  max?: number;
  step?: number;
};

type ImageUploadField = BaseField & {
  type: "imageUpload";
  accept?: string;
  upload: (file: File) => Promise<string>;
  previewHeight?: number; // default 240
};

type Field = InputField | NumberField | ImageUploadField;

interface ModalProps {
  shown: boolean;
  onClose: () => void;
  onSubmit: (formData: { [key: string]: string }) => void;
  fields: Field[];
  title?: string;
  icon?: IconName;
  confirm?: { icon?: IconName; label?: string };
  cancel?: { icon?: IconName; label?: string };
}

export default function Modal({
  shown,
  onClose,
  onSubmit,
  fields,
  title,
  icon,
  confirm = { icon: "check", label: "Confirm" },
  cancel = { icon: "x", label: "Cancel" },
}: ModalProps) {
  const initialState = useMemo(() => {
    const seed: Record<string, string> = {};
    for (const f of fields) {
      if (f.defaultValue != null) seed[f.name] = f.defaultValue;
    }
    return seed;
  }, [fields]);

  const [formState, setFormState] =
    useState<Record<string, string>>(initialState);
  const [busyField, setBusyField] = useState<string | null>(null);

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
        <Vstack gap={3} className="p-3 min-w-[280px]" align="stretch">
          {(title || icon) && (
            <Hstack gap={2} align="center" justify="center">
              {icon && (
                <span className="inline-flex items-center justify-center">
                  <Icon name={icon} />
                </span>
              )}
              {title && (
                <Text size="xl" color="text">
                  {title}
                </Text>
              )}
            </Hstack>
          )}

          {fields.map((field) => {
            const commonLabel = (
              <Vstack gap={0}>
                <Text color="text">{field.label}</Text>
                {field.description && (
                  <Text color="textFaded" size="xs">
                    {field.description}
                  </Text>
                )}
              </Vstack>
            );

            if (field.type === "textarea") {
              return (
                <Vstack key={field.name}>
                  {commonLabel}
                  <Textarea
                    value={formState[field.name] || ""}
                    onValueChange={(v) => handleChange(field.name, v)}
                    fullWidth
                    placeholder={field.placeholder}
                  />
                </Vstack>
              );
            }

            if (field.type === "number") {
              return (
                <Vstack key={field.name}>
                  {commonLabel}
                  <Input
                    type="number"
                    value={formState[field.name] ?? ""}
                    onValueChange={(v) => handleChange(field.name, v)}
                    fullWidth
                    placeholder={field.placeholder}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                  />
                </Vstack>
              );
            }

            if (field.type === "imageUpload") {
              const url = formState[field.name];
              const accepting = field.accept ?? "image/*";
              const ph = field.placeholder ?? "Select an image…";
              const phHeight = field.previewHeight ?? 240;

              return (
                <Vstack key={field.name} gap={2}>
                  {commonLabel}
                  <input
                    type="file"
                    accept={accepting}
                    aria-label={ph}
                    onChange={async (e) => {
                      const file = e.currentTarget.files?.[0];
                      if (!file) return;
                      try {
                        setBusyField(field.name);
                        const uploadedUrl = await field.upload(file);
                        handleChange(field.name, uploadedUrl);
                      } finally {
                        setBusyField(null);
                        e.currentTarget.value = "";
                      }
                    }}
                    disabled={busyField === field.name}
                  />
                  {url && (
                    <div className="w-full">
                      <div
                        className="bg-[#222] w-full relative"
                        style={{ minHeight: phHeight }}
                      >
                        <Image
                          src={url}
                          alt={`${field.label} preview`}
                          className="object-cover"
                          fill
                        />
                      </div>
                    </div>
                  )}
                </Vstack>
              );
            }

            return (
              <Vstack key={field.name}>
                {commonLabel}
                <Input
                  value={formState[field.name] || ""}
                  onValueChange={(v) => handleChange(field.name, v)}
                  fullWidth
                  placeholder={field.placeholder}
                />
              </Vstack>
            );
          })}

          <Hstack justify="center" gap={2}>
            <Button
              type="button"
              icon={cancel.icon}
              color="default"
              onClick={onClose}
            >
              {cancel.label}
            </Button>
            <Button
              type="submit"
              icon={confirm.icon}
              color="green"
              disabled={!!busyField}
            >
              {confirm.label}
            </Button>
          </Hstack>
        </Vstack>
      </form>
    </Popover>
  );
}
