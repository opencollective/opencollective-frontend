import React from 'react';
import { Check, CheckCircle } from 'lucide-react';

import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './Toast';
import { useToast } from './useToast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, type, ...props }) => {
        return (
          <Toast key={id} {...props}>
            <div className="flex gap-2">
              {type && <CheckCircle className="-ml-1 place-self-start text-green-700" size={20} />}

              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
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
