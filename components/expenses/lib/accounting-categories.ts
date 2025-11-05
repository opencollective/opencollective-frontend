import { get } from 'lodash';

import type LoggedInUser from '../../../lib/LoggedInUser';
import { getPolicy } from '../../../lib/policies';
import { isFeatureEnabled } from '@/lib/allowed-features';
import type {
  Account,
  CollectiveFeatures,
  Expense,
  ExpenseHostFieldsFragment,
  Host,
  Policies,
} from '@/lib/graphql/types/v2/graphql';

const getExpenseCategorizationPolicy = (
  collective: {
    policies: Pick<Policies, 'EXPENSE_CATEGORIZATION'>;
    host?: { policies: Pick<Policies, 'EXPENSE_CATEGORIZATION'> };
  },
  host = collective?.['host'],
) => {
  return getPolicy<'EXPENSE_CATEGORIZATION'>(host || collective, 'EXPENSE_CATEGORIZATION');
};

export const userMustSetAccountingCategory = (
  user: LoggedInUser | null,
  collective: {
    slug: Account['slug'];
    type: Account['type'];
    policies: Pick<Policies, 'EXPENSE_CATEGORIZATION'>;
    host?: {
      slug: Account['slug'];
      policies: Pick<Policies, 'EXPENSE_CATEGORIZATION'>;
      features: Pick<CollectiveFeatures, 'CHART_OF_ACCOUNTS'>;
    };
  },
  host = collective?.['host'],
) => {
  if (!isFeatureEnabled(host, 'CHART_OF_ACCOUNTS')) {
    return false;
  }

  const policy = getExpenseCategorizationPolicy(collective, host);
  if (policy) {
    if (policy.requiredForExpenseSubmitters) {
      return true;
    } else if (policy.requiredForCollectiveAdmins) {
      return user?.isAdminOfCollectiveOrHost(collective);
    }
  }

  return false;
};

export const collectiveAdminsMustConfirmAccountingCategory = (
  collective: {
    policies: Pick<Policies, 'EXPENSE_CATEGORIZATION'>;
    host?: {
      policies: Pick<Policies, 'EXPENSE_CATEGORIZATION'>;
      features: Pick<CollectiveFeatures, 'CHART_OF_ACCOUNTS'>;
      expenseAccountingCategories: ExpenseHostFieldsFragment['expenseAccountingCategories'];
    };
  },
  host = collective?.['host'],
): boolean => {
  if (!isFeatureEnabled(host, 'CHART_OF_ACCOUNTS')) {
    return false;
  }

  const hasAvailableCategories = host?.expenseAccountingCategories?.nodes?.length > 0;
  const policy = getExpenseCategorizationPolicy(collective, host);
  return Boolean(policy?.requiredForCollectiveAdmins && hasAvailableCategories);
};

// Defines the fields in the `Host` object where the accounting categories are stored
export const ACCOUNTING_CATEGORY_HOST_FIELDS = [
  'orderAccountingCategories',
  'expenseAccountingCategories',
  'accountingCategories',
] as const;

export const shouldDisplayExpenseCategoryPill = (
  user: LoggedInUser | null,
  expense: Expense,
  account: Account,
  host: Host,
): boolean => {
  if (expense?.accountingCategory) {
    return true; // Always display the category if it's already set
  } else if (user && ACCOUNTING_CATEGORY_HOST_FIELDS.some(field => get(host, `${field}.nodes`)?.length > 0)) {
    return (
      isFeatureEnabled(host, 'CHART_OF_ACCOUNTS') &&
      (user.isAdminOfCollective(host) || userMustSetAccountingCategory(user, account, host))
    );
  } else {
    return false;
  }
};
