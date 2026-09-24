import dayjs from 'dayjs';

import type { Expense, Order, TransactionsImportRow } from '@/lib/graphql/types/v2/graphql';

export const getMatchInfo = (
  row: Pick<TransactionsImportRow, 'date' | 'amount'>,
  selectedExpense: Pick<Expense, 'incurredAt' | 'amountV2'> | undefined,
  selectedContribution: Pick<Order, 'createdAt' | 'totalAmount'> | undefined,
):
  | {
      amount?: boolean;
      date?: boolean;
    }
  | undefined => {
  if (selectedExpense) {
    return {
      date: dayjs(row.date).isSame(selectedExpense.incurredAt, 'day'),
      amount:
        Math.abs(row.amount.valueInCents) === Math.abs(selectedExpense.amountV2.valueInCents) &&
        row.amount.currency === selectedExpense.amountV2.currency,
    };
  } else if (selectedContribution) {
    return {
      date: dayjs(row.date).isSame(selectedContribution.createdAt, 'day'),
      amount:
        Math.abs(row.amount.valueInCents) === Math.abs(selectedContribution.totalAmount.valueInCents) &&
        row.amount.currency === selectedContribution.totalAmount.currency,
    };
  } else {
    return {};
  }
};
