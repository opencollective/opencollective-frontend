import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { CollectiveType } from '@/lib/constants/collectives';
import type { Account } from '@/lib/graphql/types/v2/schema';

import CollectivePickerAsync from '@/components/CollectivePickerAsync';
import { Button } from '@/components/ui/Button';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

type KYCRequestPickUserProps = {
  onBack: () => void;
  onNext: () => void;
  onSelectedAccountChange: (selectedAccount: Account) => void;
  selectedAccount: Account;
};

export function KYCRequestPickUser(props: KYCRequestPickUserProps) {
  return (
    <React.Fragment>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          <FormattedMessage defaultMessage="Select an individual for verification" id="HowHcn" />
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <p className="text-sm text-slate-700">
          <FormattedMessage
            defaultMessage="Search for the individual you want to verify. Only individual accounts are eligible for KYC verification."
            id="7i6n2n"
          />
        </p>

        <CollectivePickerAsync
          inputId="kyc-request-pick-user"
          collective={props.selectedAccount}
          types={[CollectiveType.USER]}
          noCache
          limit={20}
          onChange={({ value }) => {
            props.onSelectedAccountChange(value);
          }}
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={props.onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          <FormattedMessage defaultMessage="Return to KYC Introduction" id="gL+IfB" />
        </Button>
        <Button onClick={props.onNext} disabled={!props.selectedAccount} data-cy="kyc-request-pick-user-next">
          <FormattedMessage defaultMessage="Next" id="Pagination.Next" />
        </Button>
      </DialogFooter>
    </React.Fragment>
  );
}
