import { useState } from "react";

export const useDisclosure = (value = false) => {
  const [isOpen, setIsOpen] = useState(value);

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  const onOpen = () => {
    setIsOpen(true);
  };

  const onClose = () => {
    setIsOpen(false);
  };

  return {
    isOpen,
    onClose,
    onOpen,
    toggle,
  };
};
