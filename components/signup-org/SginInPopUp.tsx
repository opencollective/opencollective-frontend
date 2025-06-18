import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';

import SignInMiniform from './SignInMiniform';

export default function SignInPopUp({
  open,
  setOpen,
  email,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  email?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        // We ignore outside interaction to prevent closing the login dialog when user interacts with Password managers
        ignoreOutsideInteraction
      >
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage id="actions.signin" defaultMessage="Sign In" />
          </DialogTitle>
        </DialogHeader>
        <SignInMiniform email={email} />
      </DialogContent>
    </Dialog>
  );
}
