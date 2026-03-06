"use client";

import { useCallback, useState } from "react";

export function useDisclosure(defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const onOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onOpenChange = useCallback((next?: boolean) => {
    setIsOpen((prev) => (typeof next === "boolean" ? next : !prev));
  }, []);

  return { isOpen, onOpen, onClose, onOpenChange };
}
