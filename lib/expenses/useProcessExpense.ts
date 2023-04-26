import React from 'react';
import { gql, useMutation } from '@apollo/client';

import { expensePageExpenseFieldsFragment } from '../../components/expenses/graphql/fragments';

import { API_V2_CONTEXT } from '../graphql/helpers';
import { Expense, ProcessExpensePaymentParams } from '../graphql/types/v2/graphql';

type ProcessExpenseAction = (paymentParams?: ProcessExpensePaymentParams) => Promise<void>;
type ProcessExpenseActionName =
  | 'APPROVE'
  | 'REJECT'
  | 'PAY'
  | 'MARK_AS_SPAM'
  | 'UNAPPROVE'
  | 'MARK_AS_UNPAID'
  | 'UNSCHEDULE_PAYMENT';

type UseProcessExpenseHook = {
  loading: boolean;
  currentAction?: ProcessExpenseActionName;
  approve: ProcessExpenseAction;
  reject: ProcessExpenseAction;
  pay: ProcessExpenseAction;
  markAsSpam: ProcessExpenseAction;
  unapprove: ProcessExpenseAction;
  markAsUnpaid: ProcessExpenseAction;
  unschedulePayment: ProcessExpenseAction;
};

type UseProcessExpenseOptions = {
  expense: Pick<Expense, 'id' | 'legacyId' | 'permissions'>;
};

const processExpenseMutation = gql`
  mutation ProcessExpense(
    $id: String
    $legacyId: Int
    $action: ExpenseProcessAction!
    $paymentParams: ProcessExpensePaymentParams
  ) {
    processExpense(expense: { id: $id, legacyId: $legacyId }, action: $action, paymentParams: $paymentParams) {
      id
      ...ExpensePageExpenseFields
    }
  }

  ${expensePageExpenseFieldsFragment}
`;

export default function useProcessExpense(opts: UseProcessExpenseOptions): UseProcessExpenseHook {
  const [currentAction, setCurrentAction] = React.useState<ProcessExpenseActionName | null>(null);
  const [processExpense, mutationResult] = useMutation(processExpenseMutation, {
    context: API_V2_CONTEXT,
  });

  const makeProcessExpenseAction = React.useMemo(
    () => (action: ProcessExpenseActionName) => async paymentParams => {
      setCurrentAction(action);
      const variables = { id: opts.expense.id, legacyId: opts.expense.legacyId, action, paymentParams };
      try {
        await processExpense({ variables });
      } finally {
        setCurrentAction(null);
      }
    },
    [opts.expense.id, opts.expense.legacyId, processExpense],
  );

  const approve = React.useMemo(() => makeProcessExpenseAction('APPROVE'), [makeProcessExpenseAction]);
  const reject = React.useMemo(() => makeProcessExpenseAction('REJECT'), [makeProcessExpenseAction]);
  const pay = React.useMemo(() => makeProcessExpenseAction('PAY'), [makeProcessExpenseAction]);
  const markAsSpam = React.useMemo(() => makeProcessExpenseAction('MARK_AS_SPAM'), [makeProcessExpenseAction]);
  const unapprove = React.useMemo(() => makeProcessExpenseAction('UNAPPROVE'), [makeProcessExpenseAction]);
  const markAsUnpaid = React.useMemo(() => makeProcessExpenseAction('MARK_AS_UNPAID'), [makeProcessExpenseAction]);
  const unschedulePayment = React.useMemo(
    () => makeProcessExpenseAction('UNSCHEDULE_PAYMENT'),
    [makeProcessExpenseAction],
  );

  return {
    loading: mutationResult.loading,
    currentAction,
    approve,
    reject,
    pay,
    markAsSpam,
    unapprove,
    markAsUnpaid,
    unschedulePayment,
  };
}
