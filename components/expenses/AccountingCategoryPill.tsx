import React from 'react';
import { useMutation } from '@apollo/client';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { AccountingCategory, Expense, Host } from '../../lib/graphql/types/v2/graphql';
import { cn } from '../../lib/utils';

import StyledSpinner from '../StyledSpinner';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import { editExpenseCategoryMutation } from './graphql/mutations';
import ExpenseCategorySelect from './ExpenseCategorySelect';

type AccountingCategoryPillProps = {
  expense: Expense;
  canEdit: boolean;
  host: Host;
  allowNone?: boolean;
};

const getCategoryLabel = (category: AccountingCategory) => {
  if (!category) {
    return <FormattedMessage id="accountingCategory.doNotKnow" defaultMessage="Unknown category" />;
  } else if (category) {
    return category.friendlyName || category.name;
  }
};

const AdminAccountingCategoryPill = ({ badgeClass, expense, host, allowNone }) => {
  const intl = useIntl();
  const [editExpense, { loading }] = useMutation(editExpenseCategoryMutation, { context: API_V2_CONTEXT });
  const { toast } = useToast();
  return (
    <ExpenseCategorySelect
      id="expense-summary-category-select"
      host={host}
      allowNone={allowNone}
      selectedCategory={expense.accountingCategory}
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
      <Button className={cn(badgeClass, 'h-auto hover:bg-red-50 hover:opacity-90')}>
        <span className="mr-1">{getCategoryLabel(expense.accountingCategory)}</span>
        {loading ? <StyledSpinner size="1em" /> : <ChevronDown size="1em" />}
      </Button>
    </ExpenseCategorySelect>
  );
};

export const AccountingCategoryPill = ({ expense, host, canEdit, allowNone }: AccountingCategoryPillProps) => {
  const badgeClass = 'rounded-lg bg-red-50 px-3 py-1 text-sm font-normal text-neutral-800';
  if (!canEdit) {
    return <div className={badgeClass}>{getCategoryLabel(expense.accountingCategory)}</div>;
  } else {
    return <AdminAccountingCategoryPill badgeClass={badgeClass} expense={expense} host={host} allowNone={allowNone} />;
  }
};
