import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { TransactionsImport } from '@/lib/graphql/types/v2/graphql';

import { getI18nLink } from '@/components/I18nFormatters';
import Link from '@/components/Link';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

type TransactionsImportStatus = Pick<TransactionsImport, 'connectedAccount'>;

const isAuthorizationExpired = (authorizationExpiresAt?: string | null) => {
  return authorizationExpiresAt && new Date(authorizationExpiresAt) < new Date();
};

export const TransactionImportStatusBadge = ({
  transactionsImport,
}: {
  transactionsImport: TransactionsImportStatus;
}) => {
  const isArchived = !transactionsImport.connectedAccount;
  const isExpired = isAuthorizationExpired(transactionsImport.connectedAccount?.authorizationExpiresAt);

  if (isArchived) {
    return (
      <Badge type="neutral">
        <FormattedMessage defaultMessage="Archived" id="0HT+Ib" />
      </Badge>
    );
  }

  if (isExpired) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge type="warning" className="cursor-help">
            <FormattedMessage defaultMessage="Expired" id="transactions.import.status.expired" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <FormattedMessage
            defaultMessage="This bank connection authorization has expired. Please reconnect your account from the settings to resume syncing transactions. <Link>Learn more</Link>."
            id="transactions.import.status.expired.tooltip"
            values={{
              Link: getI18nLink({
                as: Link,
                href: 'https://documentation.opencollective.com/fiscal-hosts/bank-account-synchronization',
                openInNewTab: true,
                color: 'inherit',
                textDecoration: 'underline',
              }),
            }}
          />
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Badge type="info">
      <FormattedMessage defaultMessage="Active" id="Subscriptions.Active" />
    </Badge>
  );
};
