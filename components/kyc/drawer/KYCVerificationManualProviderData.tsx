import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { ManualKycProviderData } from '@/lib/graphql/types/v2/schema';

import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '@/components/ui/DataList';

type KYCVerificationManualProviderDataProps = {
  providerData: ManualKycProviderData;
};

export function KYCVerificationManualProviderData(props: KYCVerificationManualProviderDataProps) {
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
