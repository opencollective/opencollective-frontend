import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { GetActions } from '@/lib/actions/types';

import { AccountHoverCard } from '@/components/AccountHoverCard';
import Avatar from '@/components/Avatar';
import { CopyID } from '@/components/CopyId';
import DateTime from '@/components/DateTime';
import DrawerHeader from '@/components/DrawerHeader';
import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '@/components/ui/DataList';
import { SheetBody } from '@/components/ui/Sheet';

import type { KYCVerificationRow } from '../dashboard/KYCVerificationRequestsTable';
import { KYCVerificationStatusBadge } from '../KYCVerificationStatusBadge';

import { KYCVerificationProviderBadge } from './KYCVerificationProviderBadge';
import { KYCVerificationProviderData } from './KYCVerificationProviderData';
import { KYCVerificationVerifiedData } from './KYCVerificationVerifiedData';

type KYCVerificationDrawerContentProps = {
  verification: KYCVerificationRow;
  getActions: GetActions<KYCVerificationRow>;
};

export function KYCVerificationDrawerContent(props: KYCVerificationDrawerContentProps) {
  const { verification, getActions } = props;

  const actions = React.useMemo(() => getActions(verification), [getActions, verification]);

  return (
    <React.Fragment>
      <DrawerHeader
        entityName={<FormattedMessage defaultMessage="KYC Verification" id="odBeoC" />}
        entityIdentifier={<CopyID value={verification.id}>{verification.id}</CopyID>}
        entityLabel={
          <AccountHoverCard
            account={verification.account}
            trigger={
              <div className="flex items-center gap-2 truncate">
                <Avatar collective={verification.account} radius={24} />
                <span className="truncate">{verification.account.name}</span>
              </div>
            }
          />
        }
        actions={actions}
      />
      <SheetBody>
        <div className="space-y-4">
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
        </div>
      </SheetBody>
    </React.Fragment>
  );
}
