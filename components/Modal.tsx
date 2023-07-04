import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { VariantProps } from 'class-variance-authority';
import { cva, cx } from 'class-variance-authority';
import { FormattedMessage } from 'react-intl';

type ModalFooterProps = {
  children: React.ReactNode;
  dividerMargin?: string;
  isFullWidth?: boolean;
  showDivider?: boolean;
};

export const ModalFooter = ({ children, isFullWidth = true, showDivider = true, ...props }: ModalFooterProps) => (
  <div {...props}>
    {showDivider && <hr className={cx('my-6 h-[1px] bg-gray-200', isFullWidth ? '-mx-20 w-screen' : 'w-full')} />}
    {children}
  </div>
);

// type ModalHeader = {
//   children: React.ReactNode;
//   dividerMargin?: string;
//   isFullWidth?: boolean;
//   showDivider?: boolean;
// };

// export const ModalHeader = ({ children, title, icon }) => (
//   <div className="flex items-center gap-3">
//     {icon}
//     {title && (
//       <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900">
//         {title}
//       </Dialog.Title>
//     )}
//   </div>
// );

const modalStyles = cva(
  'relative w-full transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all',
  {
    variants: {
      width: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
      },
    },
    defaultVariants: {
      width: 'md',
    },
  },
);

type ModalProps = {
  show: boolean;
  onClose: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  footer?: React.ReactNode;
  hideCloseIcon?: boolean;
} & VariantProps<typeof modalStyles>;

export default function Modal({ show, onClose, icon, title, footer, hideCloseIcon, children, width }: ModalProps) {
  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="relative z-[3000]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className={modalStyles({ width })}>
                {!hideCloseIcon && (
                  <div className="absolute right-0 top-0 hidden pr-3 pt-3 sm:block">
                    <button
                      type="button"
                      className="rounded-full bg-white p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
                      onClick={onClose}
                    >
                      <span className="sr-only">
                        <FormattedMessage defaultMessage="Close" />
                      </span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                )}
                {(icon || title) && (
                  <div className="flex items-center gap-3">
                    {icon}
                    {title && (
                      <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-gray-900">
                        {title}
                      </Dialog.Title>
                    )}
                  </div>
                )}
                {children}
                {footer && <ModalFooter>{footer}</ModalFooter>}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
