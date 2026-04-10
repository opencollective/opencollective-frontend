import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { KycVerifiedData } from '@/lib/graphql/types/v2/graphql';

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
          <DataListItemLabel className="min-w-auto sm:!basis-[180px]">
            <FormattedMessage defaultMessage="Legal Name" id="LegalName" />
          </DataListItemLabel>
          <DataListItemValue className="grow overflow-hidden whitespace-pre-line">
            {verifiedData.legalName}
          </DataListItemValue>
        </DataListItem>
        <DataListItem>
          <DataListItemLabel className="min-w-auto sm:!basis-[180px]">
            <FormattedMessage defaultMessage="Legal Address" id="LegalAddress" />
          </DataListItemLabel>
          <DataListItemValue className="grow overflow-hidden whitespace-pre-line">
            {verifiedData.legalAddress}
          </DataListItemValue>
        </DataListItem>
      </DataList>
    </React.Fragment>
  );
}
