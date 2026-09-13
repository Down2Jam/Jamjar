import { useTranslations as useUiTranslations } from "@/compat/next-intl";
import { useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from "bioloom-ui";
import { useTheme } from "@/providers/useSiteTheme";

export default function ItemEditor<T>({ item, title, summary, preview, onApply, onRemove, children, initiallyOpen = false, onClose, onOpen, discardNewOnCancel = false }: {
  item: T;
  title: string;
  summary: ReactNode;
  preview: (draft: T) => ReactNode;
  onApply: (draft: T) => void;
  onRemove: () => void;
  children: (draft: T, setDraft: Dispatch<SetStateAction<T>>) => ReactNode;
  initiallyOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  discardNewOnCancel?: boolean;
}) {
  const uiText = useUiTranslations();
  const { colors } = useTheme();
  const [draft, setDraft] = useState<T | null>(() => initiallyOpen ? structuredClone(item) : null);
  const close = (cancel = true) => {
    if (cancel && discardNewOnCancel) onRemove();
    setDraft(null);
    onClose?.();
  };
  const update: Dispatch<SetStateAction<T>> = next => setDraft(current => current === null ? null : typeof next === "function" ? (next as (v: T) => T)(current) : next);
  return (
    <div className="w-full border-b py-4 last:border-b-0" style={{ borderColor: colors.base }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">{summary}</div>
        <Button icon="pencil" variant="ghost" onClick={() => { onOpen?.(); setDraft(structuredClone(item)); }} aria-label={uiText("AppStrings.PreviewAndEditValue0", { value0: title })}>{uiText("AppStrings.PreviewEdit")}</Button>
      </div>
      <Modal isOpen={draft !== null} onOpenChange={open => { if (!open) close(); }} size="2xl">
        <ModalContent>
          <ModalHeader className="pr-14 text-lg font-semibold">{uiText("ThemeSuggestions.Edit.Title")} {title}</ModalHeader>
          {draft !== null && <ModalBody className="max-h-[65dvh] overflow-y-auto">
            <section className="mb-5 rounded-lg border p-4" style={{ backgroundColor: colors.crust, borderColor: colors.base }}>
              <p className="mb-3 text-xs" style={{ color: colors.textFaded }}>{uiText("AppStrings.Preview")}</p>
              {preview(draft)}
            </section>
            {children(draft, update)}
          </ModalBody>}
          <ModalFooter className="flex-wrap">
            <Button icon="trash" variant="ghost" style={{ color: colors.red }} onClick={() => { onRemove(); close(false); }}>{uiText("PostCard.Remove.Title")}</Button>
            <Button variant="ghost" onClick={() => close()}>{uiText("AppStrings.Cancel")}</Button>
            <Button icon="check" color="blue" onClick={() => { if (draft !== null) onApply(draft); close(false); }}>{uiText("AppStrings.ApplyChanges")}</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
