import React from 'react';
import { Overlay } from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import Avatar from '../../../Avatar';
import LinkCollective from '../../../LinkCollective';
import { Button } from '../../../ui/Button';
import { Dialog } from '../../../ui/Dialog';

import { TaxInformationForm } from './TaxInformationForm';

export const TaxInformationFormDialog = ({ account, open, onOpenChange, onSuccess }) => {
  const intl = useIntl();
  const [isFormDirty, setIsFormDirty] = React.useState(false);

  // Reset the dirty state when opening the dialog
  React.useEffect(() => {
    if (open) {
      setIsFormDirty(false);
    }
  }, [open]);

  const handleOpenChange = isOpen => {
    if (isOpen) {
      onOpenChange(true);
    } else if (
      !isFormDirty ||
      confirm(
        intl.formatMessage({
          defaultMessage: 'You have unsaved changes. Are you sure you want to close this?',
          id: 'srNsR3',
        }),
      )
    ) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Overlay className="fixed inset-0 z-[3000] max-h-screen min-h-full overflow-y-auto bg-white px-0 py-0 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out data-[state=open]:zoom-in">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-gray-100 bg-white px-6 py-4 shadow-md">
          <div className="text-sm">
            <h2 className="text-xl font-bold">
              <FormattedMessage defaultMessage="Update Tax Information" id="sVea7o" />
            </h2>
            <div className="mt-1 flex items-center gap-1 text-sm text-gray-600">
              <FormattedMessage
                defaultMessage="for {account}"
                id="bKMsE/"
                values={{
                  account: (
                    <LinkCollective openInNewTab collective={account} className="flex items-center gap-1">
                      <Avatar collective={account} size={18} />
                      {account.legalName || account.name}
                    </LinkCollective>
                  ),
                }}
              />
            </div>
          </div>
          <Button variant="secondary" className="text-base" onClick={() => handleOpenChange(false)}>
            <FormattedMessage id="Close" defaultMessage="Close" />
            <X className="ml-2" size={16} />
          </Button>
        </div>
        <div className="px-6 py-8 md:px-10">
          <TaxInformationForm
            accountId={account.id}
            setFormDirty={setIsFormDirty}
            onSuccess={() => {
              onOpenChange(false);
              onSuccess?.();
            }}
          />
        </div>
      </Overlay>
    </Dialog>
  );
};
