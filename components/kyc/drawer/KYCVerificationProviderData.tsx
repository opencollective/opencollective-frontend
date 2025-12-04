import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { KycProvider, KycProviderData } from '@/lib/graphql/types/v2/schema';

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
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Notes" id="expense.notes" />
          </DataListItemLabel>
          <DataListItemValue>{providerData.notes ?? '-'}</DataListItemValue>
        </DataListItem>
      </DataList>
    </React.Fragment>
  );
}
