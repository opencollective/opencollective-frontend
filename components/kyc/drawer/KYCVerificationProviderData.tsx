import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { KycProvider, KycProviderData } from '@/lib/graphql/types/v2/graphql';

import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '@/components/ui/DataList';

type KYCVerificationProviderDataProps = {
  providerData: KycProviderData;
  provider: KycProvider;
};

export function KYCVerificationProviderData(props: KYCVerificationProviderDataProps) {
  const { providerData } = props;
  return (
    <React.Fragment>
      <DataList>
        <DataListItem>
          <DataListItemLabel className="min-w-auto sm:!basis-[180px]">
            <FormattedMessage defaultMessage="Notes" id="expense.notes" />
          </DataListItemLabel>
          <DataListItemValue className="grow overflow-hidden whitespace-pre-line text-slate-700">
            {providerData.notes ?? '-'}
          </DataListItemValue>
        </DataListItem>
      </DataList>
    </React.Fragment>
  );
}
