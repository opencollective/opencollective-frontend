import { get } from 'lodash';

import type { LoggedInUser } from '../../../lib/custom_typings/LoggedInUser';
import type { Account, AccountWithHost, Expense, Host } from '../../../lib/graphql/types/v2/graphql';
import { getPolicy } from '../../../lib/policies';

const getExpenseCategorizationPolicy = (collective: Account | AccountWithHost | null, host = collective?.['host']) => {
  return getPolicy<'EXPENSE_CATEGORIZATION'>(host || collective, 'EXPENSE_CATEGORIZATION');
};

export const userMustSetAccountingCategory = (
  user: LoggedInUser | null,
  collective: Account | AccountWithHost | null,
  host = collective?.['host'],
) => {
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
  collective: Account | AccountWithHost | null,
  host = collective?.['host'],
): boolean => {
  const policy = getExpenseCategorizationPolicy(collective, host);
  return Boolean(policy?.requiredForCollectiveAdmins);
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
  return Boolean(
    expense?.accountingCategory ||
      (user &&
        ACCOUNTING_CATEGORY_HOST_FIELDS.some(field => get(host, `${field}.nodes`)?.length > 0) &&
        (userMustSetAccountingCategory(user, account, host) ||
          user.hasPreviewFeatureEnabled('EXPENSE_CATEGORIZATION'))),
  );
};
