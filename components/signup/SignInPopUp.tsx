import React from 'react';
import { FormattedMessage } from 'react-intl';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';

import type { SignInMiniformProps } from './SignInMiniform';
import SignInMiniform from './SignInMiniform';

type SignInPopUpProps = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
} & SignInMiniformProps;

export default function SignInPopUp({ open, setOpen, ...formProps }: SignInPopUpProps) {
  const [isWaitingForConfirmation, setIsWaitingForConfirmation] = React.useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        // We ignore outside interaction to prevent closing the login dialog when user interacts with Password managers
        ignoreOutsideInteraction
        hideCloseButton={isWaitingForConfirmation}
      >
        <DialogHeader>
          <DialogTitle>
            <FormattedMessage id="signIn" defaultMessage="Sign In" />
          </DialogTitle>
        </DialogHeader>
        <SignInMiniform {...formProps} setWaitingForEmail={setIsWaitingForConfirmation} />
      </DialogContent>
    </Dialog>
  );
}
