import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { ChevronDown } from 'lucide-react';
import { useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import type { Account, AccountingCategory, Expense, Host, Order } from '../../lib/graphql/types/v2/graphql';
import { cn } from '../../lib/utils';

import AccountingCategorySelect from '../AccountingCategorySelect';
import Spinner from '../Spinner';
import { Button } from '../ui/Button';
import { useToast } from '../ui/useToast';

import type { BalanceAccountingCategoryContext } from './BalanceAccountingCategoryPicker';
import { useBalanceAccountingCategories } from './BalanceAccountingCategoryPicker';

const updateExpenseBalanceCategoryMutation = gql`
  mutation UpdateExpenseBalanceAccountingCategory(
    $expense: ExpenseReferenceInput!
    $accountingCategory: AccountingCategoryReferenceInput
  ) {
    updateExpenseBalanceAccountingCategory(expense: $expense, accountingCategory: $accountingCategory) {
      id
      balanceAccountingCategory {
        id
        code
        name
        friendlyName
      }
    }
  }
`;

const updateOrderBalanceCategoryMutation = gql`
  mutation UpdateOrderBalanceAccountingCategory(
    $order: OrderReferenceInput!
    $accountingCategory: AccountingCategoryReferenceInput
  ) {
    updateOrderBalanceAccountingCategory(order: $order, accountingCategory: $accountingCategory) {
      id
      balanceAccountingCategory {
        id
        code
        name
        friendlyName
      }
    }
  }
`;

const BADGE_CLASS = cn('rounded-lg bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-800');

type PillHost = Pick<Host, 'id' | 'slug' | 'type'>;
type PillCategory = Pick<AccountingCategory, 'id' | 'code' | 'name'>;

const getLabel = (category: PillCategory) => `${category.code} - ${category.name}`;

const BalanceAccountingCategoryPill = ({
  host,
  account,
  selectedCategory,
  canEdit,
  loading,
  label,
  emptyLabel,
  context,
  onChange,
}: {
  host: PillHost;
  account?: Pick<Account, 'id' | 'slug'>;
  selectedCategory: PillCategory | null;
  canEdit: boolean;
  loading?: boolean;
  /** When set, rendered as a muted prefix; only shows when the pill itself renders */
  label?: React.ReactNode;
  emptyLabel: React.ReactNode;
  context?: BalanceAccountingCategoryContext;
  onChange: (category: PillCategory | null) => void | Promise<void>;
}) => {
  const { enabled, categories, suggestedIds } = useBalanceAccountingCategories(
    canEdit ? host?.slug : undefined,
    context,
  );
  const withLabel = (pill: React.ReactNode) =>
    !label ? (
      pill
    ) : (
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
        {pill}
      </div>
    );

  if (!canEdit || !enabled) {
    return selectedCategory ? withLabel(<span className={BADGE_CLASS}>{getLabel(selectedCategory)}</span>) : null;
  }

  return withLabel(
    <AccountingCategorySelect
      kind="BALANCE_ACCOUNT"
      host={{ ...host, accountingCategories: { nodes: categories } }}
      account={account}
      selectedCategory={selectedCategory}
      allowNone
      alwaysSearchable
      suggestedCategoryIds={suggestedIds}
      showCode
      onChange={onChange}
    >
      <Button className={cn(BADGE_CLASS, 'h-auto max-w-full min-w-0 hover:bg-neutral-50 hover:opacity-90')}>
        <span className="mr-1 max-w-40 truncate">{selectedCategory ? getLabel(selectedCategory) : emptyLabel}</span>
        {loading ? <Spinner size="1em" /> : <ChevronDown size="1em" />}
      </Button>
    </AccountingCategorySelect>,
  );
};

export const ExpenseBalanceAccountingCategoryPill = ({
  expense,
  host,
  canEdit,
  label,
  emptyLabel,
}: {
  expense: Pick<Expense, 'id'> & {
    balanceAccountingCategory?: PillCategory | null;
    account?: Pick<Account, 'id' | 'slug'>;
  };
  host: PillHost;
  canEdit: boolean;
  label?: React.ReactNode;
  emptyLabel: React.ReactNode;
}) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [updateExpense, { loading }] = useMutation(updateExpenseBalanceCategoryMutation);
  return (
    <BalanceAccountingCategoryPill
      host={host}
      account={expense.account}
      selectedCategory={expense.balanceAccountingCategory}
      canEdit={canEdit}
      loading={loading}
      label={label}
      emptyLabel={emptyLabel}
      context={{ expenseId: expense.id, accountSlug: expense.account?.slug }}
      onChange={async category => {
        try {
          await updateExpense({
            variables: { expense: { id: expense.id }, accountingCategory: category ? { id: category.id } : null },
          });
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      }}
    />
  );
};

export const OrderBalanceAccountingCategoryPill = ({
  order,
  host,
  account,
  canEdit,
  emptyLabel,
}: {
  order: Pick<Order, 'id'> & { balanceAccountingCategory?: PillCategory | null };
  host: PillHost;
  account?: Pick<Account, 'id' | 'slug'>;
  canEdit: boolean;
  emptyLabel: React.ReactNode;
}) => {
  const intl = useIntl();
  const { toast } = useToast();
  const [updateOrder, { loading }] = useMutation(updateOrderBalanceCategoryMutation);
  return (
    <BalanceAccountingCategoryPill
      host={host}
      account={account}
      selectedCategory={order.balanceAccountingCategory}
      canEdit={canEdit}
      loading={loading}
      emptyLabel={emptyLabel}
      context={{ orderId: order.id, accountSlug: account?.slug }}
      onChange={async category => {
        try {
          await updateOrder({
            variables: { order: { id: order.id }, accountingCategory: category ? { id: category.id } : null },
          });
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      }}
    />
  );
};
