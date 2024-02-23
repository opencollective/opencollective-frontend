import React from 'react';
import { useMutation } from '@apollo/client';

import { expensePageExpenseFieldsFragment } from '../../components/expenses/graphql/fragments';

import { API_V2_CONTEXT, gql } from '../graphql/helpers';
import type { Expense, ProcessExpensePaymentParams } from '../graphql/types/v2/graphql';

type ProcessExpenseAction = (params?: {
  paymentParams?: ProcessExpensePaymentParams;
  message?: string;
}) => Promise<void>;
export type ProcessExpenseActionName =
  | 'APPROVE'
  | 'REJECT'
  | 'PAY'
  | 'MARK_AS_SPAM'
  | 'UNAPPROVE'
  | 'MARK_AS_UNPAID'
  | 'UNSCHEDULE_PAYMENT'
  | 'REQUEST_RE_APPROVAL'
  | 'MARK_AS_INCOMPLETE'
  | 'HOLD'
  | 'RELEASE';

type UseProcessExpenseHook = {
  loading: boolean;
  currentAction?: ProcessExpenseActionName;
  approve: ProcessExpenseAction;
  reject: ProcessExpenseAction;
  pay: ProcessExpenseAction;
  markAsSpam: ProcessExpenseAction;
  unapprove: ProcessExpenseAction;
  markAsUnpaid: ProcessExpenseAction;
  markAsIncomplete: ProcessExpenseAction;
  unschedulePayment: ProcessExpenseAction;
  requestReApproval: ProcessExpenseAction;
  hold: ProcessExpenseAction;
  release: ProcessExpenseAction;
};

type UseProcessExpenseOptions = {
  expense: Pick<Expense, 'id' | 'legacyId' | 'permissions'>;
};

const processExpenseMutation = gql`
  mutation ProcessExpense(
    $id: String
    $legacyId: Int
    $action: ExpenseProcessAction!
    $message: String
    $paymentParams: ProcessExpensePaymentParams
  ) {
    processExpense(
      expense: { id: $id, legacyId: $legacyId }
      action: $action
      message: $message
      paymentParams: $paymentParams
    ) {
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
    refetchQueries: ['ExpensePage'],
  });

  const makeProcessExpenseAction = React.useMemo(
    () =>
      (action: ProcessExpenseActionName) =>
      async ({ paymentParams, message }: { paymentParams?: ProcessExpensePaymentParams; message?: string } = {}) => {
        setCurrentAction(action);
        const variables = { id: opts.expense.id, legacyId: opts.expense.legacyId, action, paymentParams, message };
        try {
          await processExpense({ variables });
        } finally {
          setCurrentAction(null);
        }
      },
    [opts.expense?.id, opts.expense?.legacyId, processExpense],
  );

  const approve = React.useMemo(() => makeProcessExpenseAction('APPROVE'), [makeProcessExpenseAction]);
  const reject = React.useMemo(() => makeProcessExpenseAction('REJECT'), [makeProcessExpenseAction]);
  const pay = React.useMemo(() => makeProcessExpenseAction('PAY'), [makeProcessExpenseAction]);
  const markAsSpam = React.useMemo(() => makeProcessExpenseAction('MARK_AS_SPAM'), [makeProcessExpenseAction]);
  const unapprove = React.useMemo(() => makeProcessExpenseAction('UNAPPROVE'), [makeProcessExpenseAction]);
  const markAsUnpaid = React.useMemo(() => makeProcessExpenseAction('MARK_AS_UNPAID'), [makeProcessExpenseAction]);
  const markAsIncomplete = React.useMemo(
    () => makeProcessExpenseAction('MARK_AS_INCOMPLETE'),
    [makeProcessExpenseAction],
  );
  const unschedulePayment = React.useMemo(
    () => makeProcessExpenseAction('UNSCHEDULE_PAYMENT'),
    [makeProcessExpenseAction],
  );

  const requestReApproval = React.useMemo(
    () => makeProcessExpenseAction('REQUEST_RE_APPROVAL'),
    [makeProcessExpenseAction],
  );
  const hold = React.useMemo(() => makeProcessExpenseAction('HOLD'), [makeProcessExpenseAction]);
  const release = React.useMemo(() => makeProcessExpenseAction('RELEASE'), [makeProcessExpenseAction]);

  return {
    loading: mutationResult.loading,
    currentAction,
    approve,
    reject,
    pay,
    markAsSpam,
    unapprove,
    markAsUnpaid,
    markAsIncomplete,
    requestReApproval,
    unschedulePayment,
    hold,
    release,
  };
}
