import React from 'react';
import { useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';
import * as SelectPrimitive from '@radix-ui/react-select';

import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';

import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { Filterbar } from '../../filters/Filterbar';
import { DashboardSectionProps } from '../../types';

import { Balance as NewBalance } from './NewBalance';
import { Balance } from './Balance';
import { Metric } from './Metric';
import { periodCompareFilter } from './PeriodCompareFilter';
import { collectiveOverviewQuery } from './queries';
import { Timeline } from './Timeline';
import { TodoList } from './TodoList';
import { boolean } from '../../../../lib/filters/schemas';
import { Select, SelectContent, SelectItem, SelectValue } from '../../../ui/Select';
import { Button } from '../../../ui/Button';
import { ChevronDown, Plus } from 'lucide-react';
import { parseToBoolean } from '../../../../lib/utils';
import Link from '../../../Link';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Skeleton } from '../../../ui/Skeleton';
import { getCollectivePageRoute } from '../../../../lib/url-helpers';
import { isSelfHostedAccount } from '../../../../lib/collective';
import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import { Checkbox } from '../../../ui/Checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';

export function CollectiveOverview({ accountSlug }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);
  const router = useRouter();
  const isChild = Boolean(account?.parent);
  const queryFilter = useQueryFilter({
    schema: z.object({
      period: periodCompareFilter.schema,
      includeChildren: boolean.default(true),
      as: z.string().optional(),
    }),
    toVariables: {
      period: periodCompareFilter.toVariables,
      includeChildren: (includeChildren, key, meta) => ({ includeChildren: meta.isChild ? false : includeChildren }),
      as: slug => ({ slug }),
    },
    meta: {
      isChild,
      hasChildren: Boolean(account?.childrenAccounts?.totalCount),
    },
    filters: {
      period: periodCompareFilter.filter,
      includeChildren: {
        static: true,
        StandaloneComponent: ({ intl, value, onChange, meta }) => {
          if (meta.isChild || !meta.hasChildren) {
            return null;
          }
          return (
            <Button
              size="xs"
              variant="outline"
              className="min-w-36 justify-between gap-1.5 text-left font-normal"
              onClick={() => onChange(!value)}
            >
              <Checkbox checked={!value} />
              Exclude projects & events
              {/* <ChevronDown size={16} className="text-muted-foreground" /> */}
            </Button>
          );
          return (
            <Select value={value.toString()} onValueChange={(value: string) => onChange(parseToBoolean(value))}>
              <SelectPrimitive.Trigger asChild>
                <Button size="xs" variant="outline" className="min-w-36 justify-between gap-0.5 text-left font-normal">
                  <SelectValue />
                  <ChevronDown size={16} className="text-muted-foreground" />
                </Button>
              </SelectPrimitive.Trigger>
              <SelectContent className="" align="center">
                <div className="flex flex-col">
                  {[true, false].map(type => (
                    <SelectItem key={type.toString()} value={type.toString()}>
                      <span>{type ? 'Include projects & events' : 'Exclude projects/events'}</span>
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          );
        },
      },
    },
  });

  const { data, loading, error } = useQuery(collectiveOverviewQuery, {
    variables: {
      slug: accountSlug,
      ...queryFilter.variables,
    },
    context: API_V2_CONTEXT,
  });
  const [layout, setLayout] = React.useState<'old' | 'new'>('new');

  if (error) {
    // TODO, fix nicer error message display localized to where the error is
    return <div>{error.message}</div>;
  }
  return (
    <div className="flex max-w-screen-xl flex-col gap-4">
      <div className="grid grid-cols-3 gap-10">
        <div className="order-1 flex flex-1 flex-col gap-4 xl:col-span-2">
          <DashboardHeader
            // title="Welcome back, Zack!"
            title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
            // description="Here's what happening with your Collective"
          />
          {/* <div className="grid grid-cols-1 gap-4">
            <Balance loading={loading} mainAccount={data?.account} showTotalBalance />
          </div> */}

          <div className="flex flex-col gap-3">
            {/* <h2 className="text-xl font-bold">What is happening</h2> */}
            <Filterbar hideSeparator {...queryFilter} />
            <hr />

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {/* <Metric
                label={<FormattedMessage defaultMessage="Balance" />}
                helpLabel={
                  <FormattedMessage defaultMessage="Balance at end of this period, i.e. including starting balance" />
                }
                amount={{
                  current: data?.account.stats.totalBalance,
                  comparison: data?.account.stats.totalBalanceComparison,
                }}
                loading={loading}
              /> */}
              <Metric
                label={<FormattedMessage defaultMessage="Received" />}
                helpLabel={<FormattedMessage defaultMessage="Total amount received this period" />}
                amount={{ current: data?.account.stats.received, comparison: data?.account.stats.receivedComparison }}
                loading={loading}
              />
              <Metric
                label={<FormattedMessage defaultMessage="Spent" />}
                helpLabel={<FormattedMessage defaultMessage="Total amount spent this period" />}
                amount={{ current: data?.account.stats.spent, comparison: data?.account.stats.spentComparison }}
                loading={loading}
              />
              <Metric
                label={<FormattedMessage id="Contributions" defaultMessage="Contributions" />}
                count={{
                  current: data?.account.stats.contributionsCount,
                  comparison: data?.account.stats.contributionsCountComparison,
                }}
                loading={loading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold">Things to do</h3>
            <TodoList account={{ pendingExpenses: { totalCount: 5 } }} />
          </div>
          <div className="mt-4">
            <Timeline accountSlug={router.query?.as ?? accountSlug} />
          </div>
        </div>
        <div className="order-first flex flex-1 flex-col gap-6 md:order-last">
          <div className="space-y-2">
            <h3 className="text-lg font-bold">
              {account.type === 'EVENT' ? 'Event ' : account.type === 'PROJECT' ? 'Project ' : 'Collective '}Balance
            </h3>
            <div className="flex flex-col gap-1 rounded-xl border p-3">
              <div className="text-2xl font-bold">
                {loading ? (
                  <Skeleton className="h-7 w-1/2" />
                ) : (
                  <FormattedMoneyAmount
                    amount={data?.account.stats.totalBalance.valueInCents}
                    currency={data?.account.stats.totalBalance.currency}
                    precision={2}
                    amountStyles={{ letterSpacing: 0 }}
                  />
                )}
              </div>
              {account.host && !isSelfHostedAccount(account) && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span>Fiscal host:</span>
                  <AccountHoverCard
                    account={account.host}
                    trigger={
                      <span>
                        <Link
                          className="flex items-center gap-1 hover:text-primary hover:underline"
                          href={getCollectivePageRoute(account.host)}
                        >
                          <Avatar collective={account.host} radius={20} />

                          {account.host.name}
                        </Link>
                      </span>
                    }
                  />
                </div>
              )}
            </div>
            {/* <Balance
              loading={loading}
              showTotalBalance={true}
              hideLabel
              mainAccount={data?.account}
              // childrenAccounts={data?.account.childrenAccounts.nodes}
            /> */}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Accounts</h3>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm">
                    <Plus size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>New Project</DropdownMenuItem>
                  <DropdownMenuItem>New Event</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Balance
              loading={loading}
              showTotalBalance={false}
              mainAccount={data?.account}
              childrenAccounts={data?.account.childrenAccounts.nodes}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
