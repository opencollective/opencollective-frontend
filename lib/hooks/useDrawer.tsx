import React from 'react';

export function useDrawer({ open, onOpen, onClose }) {
  const onCloseFocusRef = React.useRef<HTMLElement | null>(null);

  const onOpenChange = React.useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
      }
    },
    [onClose],
  );

  const onCloseAutoFocus = React.useCallback((e: React.FocusEvent) => {
    if (onCloseFocusRef.current) {
      e.preventDefault();
      onCloseFocusRef.current.focus();
    }
  }, []);

  const openDrawer = React.useCallback(
    (value, ref: React.RefObject<HTMLElement>) => {
      onOpen(value);
      onCloseFocusRef.current = ref.current;
    },
    [onOpen],
  );

  return {
    drawerProps: {
      open: open,
      onOpenChange,
      onClose: onClose,
      onCloseAutoFocus,
    },
    openDrawer: openDrawer,
  };
}
