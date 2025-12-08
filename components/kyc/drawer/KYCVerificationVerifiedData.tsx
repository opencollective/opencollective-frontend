import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { KycVerifiedData } from '@/lib/graphql/types/v2/schema';

import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '@/components/ui/DataList';

type KYCVerificationVerifiedDataProps = {
  verifiedData: KycVerifiedData;
};

export function KYCVerificationVerifiedData(props: KYCVerificationVerifiedDataProps) {
  const { verifiedData } = props;
  return (
    <React.Fragment>
      <DataList>
        <DataListItem>
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Legal Name" id="LegalName" />
          </DataListItemLabel>
          <DataListItemValue>{verifiedData.legalName}</DataListItemValue>
        </DataListItem>
        <DataListItem>
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Legal Address" id="LegalAddress" />
          </DataListItemLabel>
          <DataListItemValue>{verifiedData.legalAddress}</DataListItemValue>
        </DataListItem>
      </DataList>
    </React.Fragment>
  );
}
