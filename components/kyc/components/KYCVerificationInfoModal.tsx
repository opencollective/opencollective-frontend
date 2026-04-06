import React from 'react';
import { Shield } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { KycVerificationFieldsFragment } from '@/lib/graphql/types/v2/graphql';
import { KycVerificationStatus } from '@/lib/graphql/types/v2/graphql';

import type { BaseModalProps } from '@/components/ModalContext';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

import { KYCVerificationData } from './KYCVerificationData';

type KYCVerificationInfoModalProps = {
  verification: KycVerificationFieldsFragment;
  onSubmitVerificationClick?: (verification: KycVerificationFieldsFragment) => void;
} & BaseModalProps;

export function KYCVerificationInfoModal(props: KYCVerificationInfoModalProps) {
  const { verification, open, setOpen, onSubmitVerificationClick } = props;
  if (!verification) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader className="mb-2">
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <FormattedMessage defaultMessage="KYC Verification Details" id="oEVEI7" />
          </DialogTitle>
        </DialogHeader>
        <KYCVerificationData verification={verification} />
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>
            <FormattedMessage defaultMessage="Close" id="Close" />
          </Button>
          {verification.status === KycVerificationStatus.PENDING && onSubmitVerificationClick && (
            <Button onClick={() => onSubmitVerificationClick(verification)}>
              <FormattedMessage defaultMessage="Submit verification" id="qVhytd" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
