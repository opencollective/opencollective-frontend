import React from 'react';

import type { KycVerificationFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import type { BaseModalProps } from '@/components/ModalContext';
import { Dialog, DialogContent } from '@/components/ui/Dialog';

import { KYCVerificationData } from './KYCVerificationData';

type KYCVerificationInfoModalProps = {
  verification: KycVerificationFieldsFragment;
} & BaseModalProps;

export function KYCVerificationInfoModal(props: KYCVerificationInfoModalProps) {
  const { verification, open, setOpen } = props;
  if (!verification) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <KYCVerificationData verification={verification} />
      </DialogContent>
    </Dialog>
  );
}
