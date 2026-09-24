import React from 'react';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import StackedAvatars from '../StackedAvatars';

// Naive implementation of Goals for prototype
export function FundraiserStats({ account }) {
  if (!account) {
    return null;
  }
  const { stats, financialContributors, currency } = account;

  const currentAmount = stats.totalAmountReceived.valueInCents;
  return (
    <div className="space-y-4 text-muted-foreground">
      <div>
        <div className="text-3xl font-bold text-primary">
          <FormattedMoneyAmount amount={currentAmount} currency={currency} showCurrencyCode={true} precision={0} />
        </div>
        <div>raised</div>
      </div>
      <div>
        <div className="text-3xl font-bold">{stats.contributorsCount}</div>
        <div>contributors</div>
        <StackedAvatars imageSize={32} accounts={financialContributors.nodes} maxDisplayedAvatars={6} />
      </div>
    </div>
  );
}
