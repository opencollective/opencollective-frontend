import React from 'react';
import { FormattedMessage } from 'react-intl';

import DashboardHeader from '../../../dashboard/DashboardHeader';
import { DashboardSectionProps } from '../../../dashboard/types';

import { AccountingCategoriesTable } from './AccountingCategoriesTable';

/**
 * The accounting sections lets host admins customize their chart of accounts.
 */
export const HostAdminAccountingSection = ({ accountSlug }: DashboardSectionProps) => {
  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader title={<FormattedMessage defaultMessage="Chart of Accounts" />} />

      <AccountingCategoriesTable hostSlug={accountSlug} />
    </div>
  );
};
