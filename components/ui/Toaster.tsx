import React from 'react';

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './Toast';
import { useToast } from './useToast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, message, action, ...props }) => {
        return (
          <Toast key={id} {...props}>
            <div className="flex gap-2">
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {message && <ToastDescription>{message}</ToastDescription>}
              </div>
            </div>

            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
