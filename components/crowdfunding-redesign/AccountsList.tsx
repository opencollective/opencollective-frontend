import React from 'react';
import type { Column, ColumnDef, Row, TableMeta } from '@tanstack/react-table';
import clsx from 'clsx';
import { isNil, omit } from 'lodash';
import { ArrowDown10, ArrowDownZA, ArrowUp10, ArrowUpZA } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type {
  AccountMetricsFragment,
  Currency,
  OverviewMetricsQueryVariables,
} from '../../lib/graphql/types/v2/graphql';
import type { useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import type { schema } from '../dashboard/sections/overview/CollectiveOverview';
import type { MetricProps } from '../dashboard/sections/overview/Metric';
import { ChangeBadge, getPercentageDifference } from '../dashboard/sections/overview/Metric';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import Link from '../Link';
import { DataTable } from '../table/DataTable';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Checkbox } from '../ui/Checkbox';
import { AccountsSublist } from './AccountsSublist';

export default function AccountsList({ data, queryFilter, loading, metric }) {
  const currency = data?.account?.[metric.id]?.current?.currency;

  const meta = {
    queryFilter,
    currency: currency,
    isAmount: !!metric.amount,
    metric,
  };

  //   if (error) {
  //     return <MessageBoxGraphqlError error={error} />;
  //   }

  return (
    <div className="space-y-8">
      <AccountsSublist label="Main account" type="COLLECTIVE" data={data} metric={metric} meta={meta} />
      <AccountsSublist label="Projects" type="PROJECT" data={data} metric={metric} meta={meta} />

      <AccountsSublist label="Events" type="EVENT" data={data} metric={metric} meta={meta} />
    </div>
  );
}
