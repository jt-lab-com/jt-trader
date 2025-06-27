'use client';
import { useCallback, useState, MouseEvent } from 'react';

export const usePopover = () => {
  const [open, setOpen] = useState<HTMLElement | null>(null);

  const onOpen = useCallback((event: MouseEvent<HTMLElement>) => {
    setOpen(event.currentTarget);
  }, []);

  const onClose = useCallback(() => {
    setOpen(null);
  }, []);

  return {
    open,
    onOpen,
    onClose,
    setOpen,
  };
};
