import React from 'react';
import { FormattedMessage } from 'react-intl';

import { AccountingCategoriesTable } from './AccountingCategoriesTable';

/**
 * The accounting sections lets host admins customize their chart of accounts.
 */
export const HostAdminAccountingSection = ({ accountSlug }) => {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">
        <FormattedMessage defaultMessage="Chart of Accounts" />
      </h2>
      <AccountingCategoriesTable hostSlug={accountSlug} />
    </div>
  );
};
