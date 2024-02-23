import React from 'react';
import { useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type { Account, Expense, Host } from '../../lib/graphql/types/v2/graphql';

import AccountingCategorySelect from '../AccountingCategorySelect';
import ConfirmationModal from '../ConfirmationModal';
import { useToast } from '../ui/useToast';

import { editExpenseCategoryMutation } from './graphql/mutations';

export type ConfirmProcessExpenseModalProps = {
  onClose: () => void;
  expense: Expense;
  host: Host;
  account: Account;
  onConfirm?: () => Promise<any>;
};

export default function ApproveExpenseModal({
  onClose,
  onConfirm,
  host,
  account,
  expense,
}: ConfirmProcessExpenseModalProps) {
  const intl = useIntl();
  const [editExpense] = useMutation(editExpenseCategoryMutation, { context: API_V2_CONTEXT });
  const [selectedCategory, setSelectedCategory] = React.useState(expense.accountingCategory);
  const { toast } = useToast();
  return (
    <ConfirmationModal
      onClose={onClose}
      header={<FormattedMessage defaultMessage="Approve Expense" />}
      maxWidth={384}
      disableSubmit={!selectedCategory}
      continueHandler={async () => {
        try {
          // 1. Edit the accounting category if it was changed
          if (selectedCategory?.id !== expense.accountingCategory?.id) {
            await editExpense({
              variables: {
                expenseId: expense.id,
                category: selectedCategory ? { id: selectedCategory.id } : null,
              },
            });
          }

          // 2. Approve the expense
          await onConfirm();
          onClose();
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      }}
    >
      <div className="my-4">
        <label htmlFor="confirm-expense-category" className="mb-2 text-base font-bold">
          <FormattedMessage defaultMessage="Confirm Expense Category" />
        </label>
        <AccountingCategorySelect
          id="confirm-expense-category"
          kind="EXPENSE"
          onChange={setSelectedCategory}
          host={host}
          account={account}
          expenseType={expense.type}
          expenseValues={expense}
          selectedCategory={selectedCategory}
          valuesByRole={expense.valuesByRole}
          allowNone={false}
          predictionStyle="full"
        />
      </div>
    </ConfirmationModal>
  );
}
