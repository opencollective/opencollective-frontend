import React from 'react';

import type { GetActions } from '@/lib/actions/types';

import { Sheet, SheetContent } from '@/components/ui/Sheet';

import type { KYCVerificationRow } from '../dashboard/KYCVerificationRequestsTable';

import { KYCVerificationDrawerContent } from './KYCVerificationDrawerContent';

type KYCVerificationDrawerProps = {
  open: boolean;
  onClose: () => void;
  verification: KYCVerificationRow;
  getActions: GetActions<KYCVerificationRow>;
};

export function KYCVerificationDrawer(props: KYCVerificationDrawerProps) {
  const { open, onClose, verification, getActions } = props;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent>
        {verification && <KYCVerificationDrawerContent verification={verification} getActions={getActions} />}
      </SheetContent>
    </Sheet>
  );
}
