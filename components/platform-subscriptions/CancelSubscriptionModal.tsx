import React from 'react';
import { FormattedMessage } from 'react-intl';

import { I18nSupportLink } from '../I18nFormatters';
import type { BaseModalProps } from '../ModalContext';
import { Dialog, DialogContent, DialogHeader } from '../ui/Dialog';

type CancelSubscriptionModalProps = {} & BaseModalProps;

export function CancelSubscriptionModal(props: CancelSubscriptionModalProps) {
  return (
    <Dialog open={props.open} onOpenChange={isOpen => props.setOpen(isOpen)}>
      <DialogContent>
        <DialogHeader className="mb-4 font-bold">
          <FormattedMessage defaultMessage="Cancel Subscription" id="SKFWE+" />
        </DialogHeader>
        <div>
          <FormattedMessage
            defaultMessage="You can downgrade to our free 'Discover 1' plan at any time using 'Modify Subscription'. If you need to cancel your subscription renewal, please <SupportLink>contact support</SupportLink>."
            id="vBQwI8"
            values={{
              SupportLink: I18nSupportLink,
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
