import React from 'react';
import { FormattedMessage } from 'react-intl';

import DashboardHeader from '../DashboardHeader';
import { DashboardSectionProps } from '../types';

import Expenses from './Expenses';

const ReceivedExpenses = ({ accountSlug }: DashboardSectionProps) => {
  return (
    <div>
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Received Expenses" />}
        description={<FormattedMessage defaultMessage="Expenses to your Collective." />}
      />
      <Expenses accountSlug={accountSlug} direction="RECEIVED" />
    </div>
  );
};

export default ReceivedExpenses;
