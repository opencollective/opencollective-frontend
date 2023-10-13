import React from 'react';
import { FormattedMessage } from 'react-intl';

import SettingsSectionTitle from '../../../edit-collective/sections/SettingsSectionTitle';

import { AccountingCategoriesTable } from './AccountingCategoriesTable';

/**
 * The accounting sections lets host admins customize their chart of accounts.
 */
export const HostAdminAccountingSection = ({ collective }) => {
  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">
        <FormattedMessage id="home.accounting" defaultMessage="Accounting" />
      </h2>
      <SettingsSectionTitle mb={4}>
        <FormattedMessage defaultMessage="Chart of accounts" />
      </SettingsSectionTitle>
      <AccountingCategoriesTable hostId={collective.id} />
    </div>
  );
};
