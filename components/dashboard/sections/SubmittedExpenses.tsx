import React from 'react';
import { FormattedMessage } from 'react-intl';

import DashboardHeader from '../DashboardHeader';
import { DashboardSectionProps } from '../types';

import Expenses from './Expenses';

const SubmittedExpenses = ({ accountSlug }: DashboardSectionProps) => {
  return (
    <div>
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Submitted Expenses" />}
        description={<FormattedMessage defaultMessage="Expenses that you have submitted to other Collectives." />}
      />
      <Expenses accountSlug={accountSlug} direction="SUBMITTED" />
    </div>
  );
};

export default SubmittedExpenses;
