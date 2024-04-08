import React from 'react';
import { useIntl } from 'react-intl';

import { i18nExpenseType } from '../../../../../lib/i18n/expense';
import { i18nTransactionKind, i18nTransactionKindDefinition } from '../../../../../lib/i18n/transaction';

import { DefinitionTooltip } from './DefinitionTooltip';

export const TransactionReportRowLabel = ({ filter }) => {
  const intl = useIntl();
  let label = i18nTransactionKind(intl, filter.kind);
  const transactionKindDefinition = i18nTransactionKindDefinition(intl, filter.kind);

  if (transactionKindDefinition) {
    label = <DefinitionTooltip definition={transactionKindDefinition}>{label}</DefinitionTooltip>;
  }

  if (filter.expenseType) {
    label = (
      <span>
        {label} ({i18nExpenseType(intl, filter.expenseType)})
      </span>
    );
  }

  if (filter.isRefund) {
    return intl.formatMessage({ defaultMessage: 'Refunded {kind}' }, { kind: label });
  } else {
    return label;
  }
};
