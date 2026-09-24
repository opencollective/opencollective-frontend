import React from 'react';
import { useMutation } from '@apollo/client';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import type { Account, AccountingCategory, Expense, Host } from '../../lib/graphql/types/v2/graphql';
import { cn } from '../../lib/utils';

import AccountingCategorySelect from '../AccountingCategorySelect';
import Spinner from '../Spinner';
import { Button } from '../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { useToast } from '../ui/useToast';

import { editExpenseCategoryMutation } from './graphql/mutations';

type ExpenseAccountingCategoryPillProps = {
  expense: Expense;
  canEdit: boolean;
  account: Account;
  host: Host;
  /** Extended permission with reason, for showing tooltips when edit is disabled */
  editPermission?: { allowed: boolean; reason?: string | null };
  /** Whether to allow the user to select "I don't know" */
  allowNone?: boolean;
  /** Whether to show the category code in the select */
  showCodeInSelect?: boolean;
};

const BADGE_CLASS = cn('red rounded-lg bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800');

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
  const [editExpense, { loading }] = useMutation(editExpenseCategoryMutation);
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
      predictionStyle="inline-preload"
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
      <Button className={cn(BADGE_CLASS, 'h-auto max-w-full min-w-0 hover:bg-neutral-50 hover:opacity-90')}>
        <span className="mr-1 max-w-40 truncate">{getCategoryLabel(expense.accountingCategory)}</span>
        {loading ? <Spinner size="1em" /> : <ChevronDown size="1em" />}
      </Button>
    </AccountingCategorySelect>
  );
};

export const ExpenseAccountingCategoryPill = ({
  expense,
  host,
  account,
  canEdit,
  editPermission,
  allowNone,
  showCodeInSelect = false,
}: ExpenseAccountingCategoryPillProps) => {
  if (!canEdit || !host) {
    const badge = <div className={cn(BADGE_CLASS, 'truncate')}>{getCategoryLabel(expense.accountingCategory)}</div>;
    if (editPermission?.reason === 'EXPENSE_BELONGS_TO_DIFFERENT_HOST') {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(BADGE_CLASS, 'cursor-help truncate')}>
              {getCategoryLabel(expense.accountingCategory)}
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-lg">
            <FormattedMessage
              id="expense.accountingCategory.differentHostTooltip"
              defaultMessage="This expense was processed by a different host ({hostName}), you don't have permission to recategorize it."
              values={{
                hostName: host?.name || host?.slug,
              }}
            />
          </TooltipContent>
        </Tooltip>
      );
    } else {
      return badge;
    }
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
