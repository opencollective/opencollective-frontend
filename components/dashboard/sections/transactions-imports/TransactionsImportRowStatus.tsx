import React from 'react';
import { FormattedMessage } from 'react-intl';

import type { TransactionsImportRow } from '../../../../lib/graphql/types/v2/graphql';

import { Badge } from '../../../ui/Badge';

export const TransactionsImportRowStatus = ({ row }: { row: TransactionsImportRow }) => {
  if (row.isDismissed) {
    return (
      <Badge size="sm">
        <FormattedMessage defaultMessage="Ignored" id="transaction.ignored" />
      </Badge>
    );
  } else if (row.expense || row.order) {
    return (
      <Badge type="success" size="sm">
        <FormattedMessage defaultMessage="Imported" id="transaction.imported" />
      </Badge>
    );
  } else {
    return (
      <Badge type="info" size="sm">
        <FormattedMessage defaultMessage="Pending" id="transaction.pending" />
      </Badge>
    );
  }
};
