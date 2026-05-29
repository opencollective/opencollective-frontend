import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { KycVerificationFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import { AccountHoverCard } from '@/components/AccountHoverCard';
import Avatar from '@/components/Avatar';
import DateTime from '@/components/DateTime';
import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '@/components/ui/DataList';

import { KYCVerificationStatusBadge } from '../KYCVerificationStatusBadge';

import { KYCVerificationProviderBadge } from './KYCVerificationProviderBadge';
import { KYCVerificationProviderData } from './KYCVerificationProviderData';
import { KYCVerificationVerifiedData } from './KYCVerificationVerifiedData';

type KYCVerificationDataProps = {
  verification: KycVerificationFieldsFragment;
};

export function KYCVerificationData(props: KYCVerificationDataProps) {
  const { verification } = props;
  if (!verification) {
    return null;
  }

  return (
    <React.Fragment>
      <DataList>
        <DataListItem>
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Status" id="Status" />
          </DataListItemLabel>
          <DataListItemValue>
            <KYCVerificationStatusBadge status={verification.status} />
          </DataListItemValue>
        </DataListItem>
        <DataListItem>
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Provider" id="xaj9Ba" />
          </DataListItemLabel>
          <DataListItemValue>
            <KYCVerificationProviderBadge provider={verification.provider} />
          </DataListItemValue>
        </DataListItem>
        <DataListItem>
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Requested at" id="LegalDocument.RequestedAt" />
          </DataListItemLabel>
          <DataListItemValue>
            <DateTime dateStyle="medium" timeStyle="short" value={verification.requestedAt} />
          </DataListItemValue>
        </DataListItem>
        {verification.createdByUser && (
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage defaultMessage="Added by" id="KYC.AddedBy" />
            </DataListItemLabel>
            <DataListItemValue>
              <AccountHoverCard
                account={verification.createdByUser}
                trigger={
                  <div className="flex items-center gap-2 truncate">
                    <Avatar collective={verification.createdByUser} radius={20} />
                    <span className="max-w-[200px] truncate">{verification.createdByUser.name}</span>
                  </div>
                }
              />
            </DataListItemValue>
          </DataListItem>
        )}
        <DataListItem>
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Verified at" id="CJrQQ0" />
          </DataListItemLabel>
          <DataListItemValue>
            {verification.verifiedAt ? (
              <DateTime dateStyle="medium" timeStyle="short" value={verification.verifiedAt} />
            ) : (
              '-'
            )}
          </DataListItemValue>
        </DataListItem>
        <DataListItem>
          <DataListItemLabel>
            <FormattedMessage defaultMessage="Revoked at" id="PDbgKg" />
          </DataListItemLabel>
          <DataListItemValue>
            {verification.revokedAt ? (
              <DateTime dateStyle="medium" timeStyle="short" value={verification.revokedAt} />
            ) : (
              '-'
            )}
          </DataListItemValue>
        </DataListItem>
      </DataList>
      <h3 className="text-base font-medium tracking-wide text-slate-600 uppercase">
        <FormattedMessage defaultMessage="Verified Data" id="zG/rb8" />
      </h3>
      <KYCVerificationVerifiedData verifiedData={verification.verifiedData} />
      <h3 className="text-base font-medium tracking-wide text-slate-600 uppercase">
        <FormattedMessage defaultMessage="Provider Data" id="rVpULI" />
      </h3>
      <KYCVerificationProviderData provider={verification.provider} providerData={verification.providerData} />
    </React.Fragment>
  );
}
