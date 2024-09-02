import React from 'react';

import { AccountsSublist } from './AccountsSublist';

export default function AccountsList({ data, queryFilter, metric }) {
  const currency = data?.account?.[metric.id]?.current?.currency;

  const meta = {
    queryFilter,
    currency: currency,
    isAmount: !!metric.amount,
    metric,
  };

  return (
    <div className="space-y-8">
      <AccountsSublist label="Main account" type="COLLECTIVE" data={data} metric={metric} meta={meta} />
      <AccountsSublist label="Projects" type="PROJECT" data={data} metric={metric} meta={meta} />

      <AccountsSublist label="Events" type="EVENT" data={data} metric={metric} meta={meta} />
    </div>
  );
}
