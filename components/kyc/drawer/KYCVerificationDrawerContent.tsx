import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { GetActions } from '@/lib/actions/types';

import { KYCVerificationData } from '../components/KYCVerificationData';
import { AccountHoverCard } from '@/components/AccountHoverCard';
import Avatar from '@/components/Avatar';
import { CopyID } from '@/components/CopyId';
import DrawerHeader from '@/components/DrawerHeader';
import { SheetBody } from '@/components/ui/Sheet';

import type { KYCVerificationRow } from '../dashboard/KYCVerificationRequestsTable';

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
          <KYCVerificationData verification={verification} />
        </div>
      </SheetBody>
    </React.Fragment>
  );
}
