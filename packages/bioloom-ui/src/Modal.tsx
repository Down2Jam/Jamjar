"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import Popover from "./Popover";
import { Vstack, Hstack } from "./Stack";
import { Input } from "./Input";
import ImageInput from "./ImageInput";
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import Icon, { IconName } from "./Icon";
import Text from "./Text";

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

interface FormModalProps {
  shown: boolean;
  onClose: () => void;
  onSubmit: (formData: { [key: string]: string }) => void;
  fields: Field[];
  title?: string;
  icon?: IconName;
  confirm?: { icon?: IconName; label?: string };
  cancel?: { icon?: IconName; label?: string };
}

type OverlayModalSize = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

interface OverlayModalProps {
  isOpen: boolean;
  onOpenChange?: (open?: boolean) => void;
  hideCloseButton?: boolean;
  backdrop?: "transparent" | "opaque";
  size?: OverlayModalSize;
  className?: string;
  children: React.ReactNode;
}

type ModalProps = FormModalProps | OverlayModalProps;

const ModalOverlayContext = createContext<{
  onClose: () => void;
  size?: OverlayModalSize;
} | null>(null);

function FormModal({
  shown,
  onClose,
  onSubmit,
  fields,
  title,
  icon,
  confirm = { icon: "check", label: "Confirm" },
  cancel = { icon: "x", label: "Cancel" },
}: FormModalProps) {
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
              const ph = field.placeholder ?? "Select an image...";
              const phHeight = field.previewHeight ?? 240;

              return (
                <Vstack key={field.name} gap={2}>
                  {commonLabel}
                  <ImageInput
                    value={url}
                    accept={accepting}
                    placeholder={ph}
                    height={phHeight}
                    onSelect={async (file) => {
                      try {
                        setBusyField(field.name);
                        const uploadedUrl = await field.upload(file);
                        handleChange(field.name, uploadedUrl);
                      } finally {
                        setBusyField(null);
                      }
                    }}
                    disabled={busyField === field.name}
                  />
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

function OverlayModal({
  isOpen,
  onOpenChange,
  hideCloseButton = false,
  backdrop = "transparent",
  size,
  className = "",
  children,
}: OverlayModalProps) {
  const handleClose = () => {
    onOpenChange?.(false);
  };

  return (
    <ModalOverlayContext.Provider value={{ onClose: handleClose, size }}>
      <Popover
        shown={isOpen}
        anchorToScreen
        position="center"
        onClose={handleClose}
        showCloseButton={!hideCloseButton}
        backdrop={backdrop === "opaque"}
        backdropColor="rgba(0, 0, 0, 0.6)"
        padding={0}
        className={className}
      >
        {children}
      </Popover>
    </ModalOverlayContext.Provider>
  );
}

export interface ModalContentProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  children: ReactNode | ((onClose: () => void) => ReactNode);
}

const sizeClassMap: Record<OverlayModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-none w-[calc(100vw-2rem)]",
};

export function ModalContent({
  className = "",
  style,
  children,
  ...props
}: ModalContentProps) {
  const ctx = useContext(ModalOverlayContext);
  const size = ctx?.size ?? "md";
  const resolvedChildren =
    typeof children === "function" ? children(ctx?.onClose ?? (() => {})) : children;

  return (
    <div
      className={["w-full", sizeClassMap[size], className].join(" ")}
      style={style}
      {...props}
    >
      {resolvedChildren}
    </div>
  );
}

export interface ModalSectionProps extends HTMLAttributes<HTMLDivElement> {}

export function ModalHeader({ className = "", ...props }: ModalSectionProps) {
  return <div className={["px-4 pt-4", className].join(" ")} {...props} />;
}

export function ModalBody({ className = "", ...props }: ModalSectionProps) {
  return <div className={["px-4 py-3", className].join(" ")} {...props} />;
}

export function ModalFooter({ className = "", ...props }: ModalSectionProps) {
  return (
    <div
      className={["px-4 pb-4 pt-2 flex justify-end gap-2", className].join(
        " "
      )}
      {...props}
    />
  );
}

export default function Modal(props: ModalProps) {
  if ("fields" in props) {
    return <FormModal {...props} />;
  }

  return <OverlayModal {...props} />;
}
