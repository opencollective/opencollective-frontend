import { defineMessages } from 'react-intl';
import { i18nExpenseType } from './expense';
import { i18nTransactionKind } from './transaction';
import { TransactionKind } from '../constants/transactions';

export const i18nTransactionReportRowLabel = (intl, kind, isRefund) => {
  if (isRefund) {
    return intl.formatMessage({ defaultMessage: 'Refunded {kind}' }, { kind: i18nTransactionKind(intl, kind) });
  } else {
    return i18nTransactionKind(intl, kind);
  }
};

export const i18nTransactionReportRowLabelDynamic = (intl, filter) => {
  let kind = i18nTransactionKind(intl, filter.kind);

  if (filter.expenseType) {
    kind = intl.formatMessage(
      { defaultMessage: 'Expense ({expenseType})' },
      { expenseType: i18nExpenseType(intl, filter.expenseType) },
    );
  }
  if (filter.isRefund) {
    return intl.formatMessage({ defaultMessage: 'Refunded {kind}' }, { kind });
  } else {
    return i18nTransactionKind(intl, kind);
  }
};
