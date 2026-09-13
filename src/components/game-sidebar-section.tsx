import { useEffect, useState, type ReactNode } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody } from "bioloom-ui";

export default function GameSidebarSection({ name, selected, onClose, children, directMobile = false }: {
  name: string;
  selected: string | null;
  onClose: () => void;
  children: ReactNode | ((mobile: boolean) => ReactNode);
  directMobile?: boolean;
}) {
  const [desktop, setDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  const content = typeof children === "function" ? children(!desktop) : children;
  if (desktop) return <>{content}</>;
  if (selected !== name) return null;
  if (directMobile) return <>{content}</>;
  return <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }} size="lg">
    <ModalContent className="!w-[480px] !max-w-[calc(100vw-24px)]">
      <ModalHeader className="pr-14 text-base font-semibold">{name}</ModalHeader>
      <ModalBody className="max-h-[75dvh] overflow-y-auto !px-0 [&>div>div]:!border-0 [&>div>div]:!shadow-none">
        {content}
      </ModalBody>
    </ModalContent>
  </Modal>;
}
