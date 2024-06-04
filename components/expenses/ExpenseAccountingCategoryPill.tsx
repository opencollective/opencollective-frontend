import React from 'react';
import { useMutation } from '@apollo/client';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type { Account, AccountingCategory, Expense, Host } from '../../lib/graphql/types/v2/graphql';
import { cn } from '../../lib/utils';

import AccountingCategorySelect from '../AccountingCategorySelect';
import StyledSpinner from '../StyledSpinner';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import { editExpenseCategoryMutation } from './graphql/mutations';

type ExpenseAccountingCategoryPillProps = {
  expense: Expense;
  canEdit: boolean;
  account: Account;
  host: Host;
  /** Whether to allow the user to select "I don't know" */
  allowNone?: boolean;
  /** Whether to show the category code in the select */
  showCodeInSelect?: boolean;
};

const BADGE_CLASS = cn('red rounded-lg bg-neutral-100 px-3 py-1  text-xs font-medium text-neutral-800');

const getCategoryLabel = (category: AccountingCategory) => {
  if (!category) {
    return <FormattedMessage id="accountingCategory.doNotKnow" defaultMessage="Unknown category" />;
  } else if (category) {
    return category.friendlyName || category.name;
  }
};

const ExpenseAdminAccountingCategoryPill = ({
  expense,
  account,
  host,
  allowNone,
  showCodeInSelect,
}: Omit<ExpenseAccountingCategoryPillProps, 'canEdit'>) => {
  const intl = useIntl();
  const [editExpense, { loading }] = useMutation(editExpenseCategoryMutation, { context: API_V2_CONTEXT });
  const { toast } = useToast();
  return (
    <AccountingCategorySelect
      id="expense-summary-category-select"
      kind="EXPENSE"
      host={host}
      account={account}
      expenseType={expense.type}
      expenseValues={expense}
      allowNone={allowNone}
      selectedCategory={expense.accountingCategory}
      valuesByRole={expense.valuesByRole}
      showCode={showCodeInSelect}
      predictionStyle="inline"
      onChange={async selectedCategory => {
        try {
          await editExpense({
            variables: {
              expenseId: expense.id,
              category: selectedCategory ? { id: selectedCategory.id } : null,
            },
          });
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      }}
    >
      <Button className={cn(BADGE_CLASS, 'h-auto hover:bg-neutral-50 hover:opacity-90')}>
        <span className="mr-1">{getCategoryLabel(expense.accountingCategory)}</span>
        {loading ? <StyledSpinner size="1em" /> : <ChevronDown size="1em" />}
      </Button>
    </AccountingCategorySelect>
  );
};

export const ExpenseAccountingCategoryPill = ({
  expense,
  host,
  account,
  canEdit,
  allowNone,
  showCodeInSelect = false,
}: ExpenseAccountingCategoryPillProps) => {
  if (!canEdit || !host) {
    return <div className={BADGE_CLASS}>{getCategoryLabel(expense.accountingCategory)}</div>;
  } else {
    return (
      <ExpenseAdminAccountingCategoryPill
        expense={expense}
        account={account}
        host={host}
        allowNone={allowNone}
        showCodeInSelect={showCodeInSelect}
      />
    );
  }
};
