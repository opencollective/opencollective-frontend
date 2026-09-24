import React from 'react';
import { useIntl } from 'react-intl';

import type { TransactionsImportRow } from '../../../../lib/graphql/types/v2/graphql';
import { TransactionsImportRowStatus } from '../../../../lib/graphql/types/v2/graphql';
import { i18nTransactionsRowStatus } from '../../../../lib/i18n/transactions-import-row';

import { Badge } from '../../../ui/Badge';

export const TransactionsImportRowStatusBadge = ({
  row,
}: {
  row: Pick<TransactionsImportRow, 'status'> & {
    expense?: Pick<TransactionsImportRow['expense'], 'id'> | null | undefined;
    order?: Pick<TransactionsImportRow['order'], 'id'> | null | undefined;
  };
}) => {
  const intl = useIntl();
  const badgeProps = { size: 'sm', className: 'whitespace-nowrap' } as const;
  if (row.status === TransactionsImportRowStatus.IGNORED) {
    return <Badge {...badgeProps}>{i18nTransactionsRowStatus(intl, 'IGNORED')}</Badge>;
  } else if (row.expense || row.order) {
    return (
      <Badge {...badgeProps} type="success">
        {i18nTransactionsRowStatus(intl, 'LINKED')}
      </Badge>
    );
  } else if (row.status === TransactionsImportRowStatus.ON_HOLD) {
    return (
      <Badge {...badgeProps} type="warning">
        {i18nTransactionsRowStatus(intl, 'ON_HOLD')}
      </Badge>
    );
  } else {
    return (
      <Badge {...badgeProps} type="info">
        {i18nTransactionsRowStatus(intl, 'PENDING')}
      </Badge>
    );
  }
};
