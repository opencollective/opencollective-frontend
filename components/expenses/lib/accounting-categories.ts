import { get } from 'lodash';

import { LoggedInUser } from '../../../lib/custom_typings/LoggedInUser';
import { Account, AccountWithHost, Expense, Host } from '../../../lib/graphql/types/v2/graphql';
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

export const shouldDisplayExpenseCategoryPill = (
  user: LoggedInUser,
  expense: Expense,
  account: Account,
  host: Host,
): boolean => {
  return Boolean(
    expense?.accountingCategory ||
      (get(host, 'accountingCategories.nodes', []).length > 0 &&
        (userMustSetAccountingCategory(user, account, host) ||
          user.hasPreviewFeatureEnabled('EXPENSE_CATEGORIZATION'))),
  );
};
