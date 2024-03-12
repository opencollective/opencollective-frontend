import React from 'react';
import { useQuery } from '@apollo/client';
import { FlaskConical, X } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { HELP_MESSAGE } from '../../../../lib/constants/dismissable-help-message';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { getDashboardRoute } from '../../../../lib/url-helpers';

import DismissibleMessage from '../../../DismissibleMessage';
import { FEEDBACK_KEY, FeedbackModal } from '../../../FeedbackModal';
import Image from '../../../Image';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { AlertDescription, AlertTitle } from '../../../ui/Alert';
import { Button } from '../../../ui/Button';
import { Popover, PopoverAnchor, PopoverContent } from '../../../ui/Popover';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { childAccountFilter } from '../../filters/ChildAccountFilter';
import { Filterbar } from '../../filters/Filterbar';
import { periodCompareFilter } from '../../filters/PeriodCompareFilter';
import { DashboardSectionProps } from '../../types';

import { Accounts } from './Accounts';
import AccountTable from './AccountTable';
import { Metric, MetricProps } from './Metric';
import { overviewMetricsQuery } from './queries';
import { Timeline } from './Timeline';
import { TodoList } from './TodoList';

export const schema = z.object({
  period: periodCompareFilter.schema,
  as: z.string().optional(),
  account: childAccountFilter.schema,
  subpath: z.coerce.string().nullable().default(null), // default null makes sure to always trigger the `toVariables` function
});

export function CollectiveOverview({ accountSlug }: DashboardSectionProps) {
  const { account } = React.useContext(DashboardContext);
  const [showFeedbackModal, setShowFeedbackModal] = React.useState(false);
  const router = useRouter();
  const queryFilter = useQueryFilter({
    schema,
    toVariables: {
      period: periodCompareFilter.toVariables,
      account: childAccountFilter.toVariables,
      as: slug => ({ slug }),
      subpath: subpath => {
        const include = {
          includeReceived: false,
          includeReceivedTimeseries: false,
          includeBalance: false,
          includeBalanceTimeseries: false,
          includeSpent: false,
          includeContributionsCount: false,
        };
        switch (subpath) {
          case 'received':
            return {
              ...include,
              includeReceived: true,
              includeReceivedTimeseries: true,
            };
          case 'balance':
            return {
              ...include,
              includeBalance: true,
              includeBalanceTimeseries: true,
            };
          case 'spent':
            return {
              ...include,
              includeSpent: true,
            };
          case 'contributions':
            return {
              ...include,
              includeContributionsCount: true,
            };
          default:
            return {
              includeReceived: true,
              includeBalance: account.isActive, // only showing Balance if account is active
              includeSpent: true,
              includeBalanceTimeseries: account.isActive, // only showing Balance if account is active
              includeContributionsCount: true,
              includeReceivedTimeseries: true,
            };
        }
      },
    },
    filters: {
      period: periodCompareFilter.filter,
      account: childAccountFilter.filter,
    },
    meta: {
      accountSlug,
      childrenAccounts: account.childrenAccounts?.nodes ?? [],
    },
  });

  const { data, loading, error } = useQuery(overviewMetricsQuery, {
    variables: {
      slug: accountSlug,
      ...queryFilter.variables,
      ...(account.parent && { includeChildren: false }),
    },
    fetchPolicy: 'cache-and-network',
    context: API_V2_CONTEXT,
  });

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  const metrics: MetricProps[] = [
    {
      id: 'balance',
      className: 'col-span-1 row-span-2',
      label: <FormattedMessage id="TotalBalance" defaultMessage="Total Balance" />,
      helpLabel: <FormattedMessage defaultMessage="Balance at end of this period, including starting balance" />,
      timeseries: { ...data?.account.balanceTimeseries, currency: data?.account.balance?.current?.currency },
      amount: data?.account.balance,
      showCurrencyCode: true,
      isSnapshot: true,
      showTimeSeries: true,
      hide: !account.isActive,
    },
    {
      id: 'received',
      label: <FormattedMessage defaultMessage="Received" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount received this period" />,
      amount: data?.account.received,
      timeseries: { ...data?.account.receivedTimeseries, currency: data?.account.received?.current?.currency },
    },
    {
      id: 'spent',
      label: <FormattedMessage defaultMessage="Spent" />,
      helpLabel: <FormattedMessage defaultMessage="Total amount spent this period" />,
      amount: data?.account.spent,
    },

    {
      id: 'contributions',
      label: <FormattedMessage id="Contributions" defaultMessage="Contributions" />,
      count: data?.account.contributionsCount,
      hide: !account.isActive,
    },
  ];

  if (queryFilter.values.subpath) {
    const metric = metrics.find(m => m.id === queryFilter.values.subpath);
    if (metric) {
      return (
        <div className="flex max-w-screen-lg flex-col gap-3">
          <DashboardHeader
            title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
            subpathTitle={metric.label}
            titleRoute={getDashboardRoute(account, 'overview')}
          />

          <Filterbar hideSeparator {...queryFilter} />

          <Metric {...metric} loading={loading} expanded showTimeSeries showCurrencyCode>
            <AccountTable queryFilter={queryFilter} accountSlug={router.query?.as ?? accountSlug} metric={metric} />
          </Metric>
        </div>
      );
    }
  }

  return (
    <div className="max-w-screen-lg space-y-6">
      <div className="flex flex-col gap-3">
        <DashboardHeader
          title={<FormattedMessage id="AdminPanel.Menu.Overview" defaultMessage="Overview" />}
          titleRoute={getDashboardRoute(account, 'overview')}
          actions={
            <Popover open>
              <PopoverAnchor>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setShowFeedbackModal(true)}>
                  <FlaskConical size={16} />
                  <FormattedMessage id="GiveFeedback" defaultMessage="Give feedback" />
                </Button>
              </PopoverAnchor>
              <DismissibleMessage messageId={HELP_MESSAGE.COLLECTIVE_OVERVIEW_WELCOME}>
                {({ dismiss }) => (
                  <PopoverContent align="end" sideOffset={8} className="animate-in fade-in">
                    <div>
                      <div className="mb-2 flex items-start gap-3">
                        <Image
                          className="h-12 w-12 shrink-0"
                          alt="Illustration of plant"
                          width={48}
                          height={48}
                          src="/static/images/dashboard.png"
                          aria-hidden="true"
                        />
                        <AlertTitle className="text-balance text-lg leading-tight">
                          <FormattedMessage
                            id="PreviewFeatures.CollectiveOverview.Welcome.Title"
                            defaultMessage="Welcome to your new Collective Overview"
                          />
                        </AlertTitle>
                      </div>

                      <AlertDescription className="mt-1 max-w-prose space-y-2">
                        <p>
                          <FormattedMessage
                            id="PreviewFeatures.CollectiveOverview.Welcome.Description"
                            defaultMessage="We’ve created this space for you to keep on top of everything happening in your Collective, please let us know how we can make it better!"
                          />
                        </p>
                      </AlertDescription>
                      <Button size="sm" variant="outline" className="mt-2 w-full" onClick={dismiss}>
                        <FormattedMessage id="Close" defaultMessage="Close" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="absolute right-1 top-1 text-muted-foreground"
                      onClick={dismiss}
                    >
                      <X size={16} />
                    </Button>
                  </PopoverContent>
                )}
              </DismissibleMessage>
            </Popover>
          }
        />
        <Filterbar hideSeparator {...queryFilter} />

        <div className="grid grid-flow-dense grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-3  ">
          {metrics
            .filter(metric => !metric.hide)
            .map(metric => (
              <Metric
                key={metric.id}
                {...metric}
                loading={loading}
                onClick={() => queryFilter.setFilter('subpath', metric.id)}
              />
            ))}
        </div>
      </div>

      <hr />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 2xl:grid-cols-3">
        <div className="order-1 space-y-6 xl:order-none xl:col-span-2 ">
          <TodoList />
          <Timeline accountSlug={router.query?.as ?? accountSlug} />
        </div>
        {!account.parent && account.isActive && (
          <div className="-order-1 space-y-6 lg:order-none">
            <Accounts accountSlug={router.query?.as ?? accountSlug} />
          </div>
        )}
      </div>
      <FeedbackModal
        open={showFeedbackModal}
        setOpen={setShowFeedbackModal}
        feedbackKey={FEEDBACK_KEY.COLLECTIVE_OVERVIEW}
        title={<FormattedMessage defaultMessage="Give feedback on the Collective Overview" />}
      />
    </div>
  );
}
