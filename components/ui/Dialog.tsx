import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { cn } from '../../lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const dialogOverlayVariants = cva(
  'fixed inset-0 z-3000 flex max-h-screen flex-col items-center overflow-y-auto bg-foreground/25 px-0 py-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0',
  {
    variants: {
      size: {
        default: 'sm:px-6 sm:py-20',
        fullscreen: '',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & VariantProps<typeof dialogOverlayVariants>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(dialogOverlayVariants({ size: props.size, className }))}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const dialogVariants = cva(
  'relative z-50 flex w-full grow flex-col gap-4 bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
  {
    variants: {
      size: {
        default: 'sm:max-w-lg sm:grow-0 sm:rounded-lg',
        fullscreen: 'sm:max-w-full',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> &
    VariantProps<typeof dialogVariants> & {
      hideCloseButton?: boolean;
      overlayClassName?: string;
      ignoreOutsideInteraction?: boolean;
    }
>(({ className, children, hideCloseButton, ignoreOutsideInteraction, onPointerDownOutside, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  const handlePointerDownOutside = React.useCallback(
    (
      e: Parameters<
        NonNullable<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>['onPointerDownOutside']>
      >[0],
    ) => {
      if (ignoreOutsideInteraction) {
        e.preventDefault();
        return;
      }

      // Check if click is specifically on the scrollbar (not overlay background)
      const originalEvent = e.detail?.originalEvent as PointerEvent | undefined;
      if (originalEvent && contentRef.current?.parentElement) {
        const overlayEl = contentRef.current.parentElement;
        const overlayRect = overlayEl.getBoundingClientRect();
        const { clientX: x, clientY: y } = originalEvent;

        // Calculate scrollbar width (difference between offsetWidth and clientWidth)
        const scrollbarWidth = overlayEl.offsetWidth - overlayEl.clientWidth;

        // Only check for scrollbar if one exists
        if (scrollbarWidth > 0) {
          // Check if click is in the scrollbar area (right edge of overlay)
          // The scrollbar extends the full height of the overlay, not just the content
          const isInScrollbarArea =
            x > overlayRect.right - scrollbarWidth - 5 && // Near right edge (5px tolerance)
            x <= overlayRect.right && // Within overlay right edge
            y >= overlayRect.top && // Within overlay vertical bounds
            y <= overlayRect.bottom; // Within overlay vertical bounds

          if (isInScrollbarArea) {
            // This is a scrollbar click, prevent closing
            e.preventDefault();
            return;
          }
        }
      }

      if (onPointerDownOutside) {
        onPointerDownOutside(e);
      }
    },
    [ignoreOutsideInteraction, onPointerDownOutside],
  );

  return (
    <DialogPortal>
      <DialogOverlay size={props.size} className={props.overlayClassName}>
        <DialogPrimitive.Content
          ref={node => {
            contentRef.current = node;
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }}
          className={cn(dialogVariants({ size: props.size, className }))}
          onInteractOutside={
            ignoreOutsideInteraction
              ? e => e.preventDefault()
              : (props as React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>).onInteractOutside
          }
          onPointerDownOutside={handlePointerDownOutside}
          {...props}
        >
          {children}
          {!hideCloseButton && (
            <DialogPrimitive.Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
              <X className="h-4 w-4" />
              <span className="sr-only">
                <FormattedMessage defaultMessage="Close" id="Close" />
              </span>
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogOverlay>
    </DialogPortal>
  );
});
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1.5', className)} {...props} />
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)} {...props} />
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg leading-none font-semibold tracking-tight', className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// ui library
// ts-unused-exports:disable-next-line
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
};
