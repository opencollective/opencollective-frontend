import React from 'react';
import { X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { Button } from './ui/Button';
import { Dialog, DialogContent } from './ui/Dialog';
import Loading from './Loading';

export const FullscreenFlowLoadingPlaceholder = ({ handleOnClose }: { handleOnClose?: () => void }) => {
  return (
    <Dialog
      defaultOpen
      onOpenChange={open => {
        if (!open) {
          handleOnClose?.();
        }
      }}
    >
      <DialogContent
        hideCloseButton
        overlayClassName="p-0 sm:p-0"
        className="overflow-hidden rounded-none bg-[#F8FAFC]/90 p-0 sm:max-w-screen sm:min-w-screen sm:rounded-none sm:p-0"
        onEscapeKeyDown={e => {
          e.preventDefault();
          if (open) {
            handleOnClose?.();
          }
        }}
      >
        <div className="flex max-h-screen min-h-screen max-w-screen min-w-screen flex-col overflow-hidden">
          {Boolean(handleOnClose) && (
            <header className="flex min-w-screen items-center justify-end px-4 py-3">
              <Button
                onClick={() => handleOnClose()}
                variant="ghost"
                className="flex cursor-pointer items-center gap-2 px-4 py-3 text-base leading-5 font-medium text-slate-800"
                asChild
              >
                <span>
                  <FormattedMessage id="Close" defaultMessage="Close" />
                  <X />
                </span>
              </Button>
            </header>
          )}
          <div className="flex w-full grow items-center justify-center">
            <div className="mt-[-64px]">
              <Loading />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
