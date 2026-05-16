import React from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { defineMessages, FormattedMessage } from 'react-intl';

import Link from '@/components/Link';

import { Skeleton } from '../../../ui/Skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';

import { hostedAccountsRoute, type HostedAccountType, type MonthPeriod, percentChange } from './helpers';

const messages = defineMessages({
  activeCollectivesLabel: { defaultMessage: 'Active Collectives', id: 'b4gw3f' },
  inactiveCollectivesLabel: { defaultMessage: 'Inactive Collectives', id: 'TWl0xA' },
  newCollectivesLabel: { defaultMessage: 'Newly Hosted Collectives', id: 'RoCcqv' },
  unhostedCollectivesLabel: { defaultMessage: 'Un-hosted Collectives', id: 'pMLohW' },
  activeFundsLabel: { defaultMessage: 'Active Funds', id: 'xO/R/W' },
  inactiveFundsLabel: { defaultMessage: 'Inactive Funds', id: 'fjC4jU' },
  newFundsLabel: { defaultMessage: 'Newly Hosted Funds', id: 'f/8mAY' },
  unhostedFundsLabel: { defaultMessage: 'Un-hosted Funds', id: 'MOdEme' },
  activeCollectivesBody: {
    defaultMessage: 'Collectives with at least one ledger transaction recorded this month.',
    id: 'OP0hZZ',
  },
  inactiveCollectivesBody: {
    defaultMessage: 'Hosted collectives that have not executed financial activities this month.',
    id: 'KbbUUb',
  },
  newCollectivesBody: {
    defaultMessage: 'Collectives that joined and were approved.',
    id: 'AiNHMe',
  },
  unhostedCollectivesBody: {
    defaultMessage: 'Collectives that have been unhosted.',
    id: 'H+cXy2',
  },
  activeFundsBody: {
    defaultMessage: 'Funds with at least one ledger transaction recorded this month.',
    id: 'TjxXB1',
  },
  inactiveFundsBody: {
    defaultMessage: 'Hosted funds that have not executed financial activities this month.',
    id: 'zT1jz/',
  },
  newFundsBody: {
    defaultMessage: 'Funds that joined and were approved.',
    id: 'iLl6ty',
  },
  unhostedFundsBody: {
    defaultMessage: 'Funds that have been unhosted.',
    id: 'j6hx9p',
  },
  vsPreviousMonth: { defaultMessage: 'vs prev. month', id: 'HznlHL' },
});

const cardCopyByCategory = (category: HostedAccountType) =>
  category === 'FUND'
    ? {
        active: { label: messages.activeFundsLabel, body: messages.activeFundsBody },
        inactive: { label: messages.inactiveFundsLabel, body: messages.inactiveFundsBody },
        joined: { label: messages.newFundsLabel, body: messages.newFundsBody },
        unhosted: { label: messages.unhostedFundsLabel, body: messages.unhostedFundsBody },
      }
    : {
        active: { label: messages.activeCollectivesLabel, body: messages.activeCollectivesBody },
        inactive: { label: messages.inactiveCollectivesLabel, body: messages.inactiveCollectivesBody },
        joined: { label: messages.newCollectivesLabel, body: messages.newCollectivesBody },
        unhosted: { label: messages.unhostedCollectivesLabel, body: messages.unhostedCollectivesBody },
      };

type MetricCardsProps = {
  hostSlug: string;
  category: HostedAccountType;
  period: MonthPeriod;
  loading: boolean;
  values: {
    activeCurrent: number;
    activePrevious: number;
    hostedCurrent: number;
    hostedPrevious: number;
    joinedCurrent: number;
    joinedPrevious: number;
    churnedCurrent: number;
    churnedPrevious: number;
  };
};

export function MetricCards({ hostSlug, category, period, loading, values }: MetricCardsProps) {
  const copy = cardCopyByCategory(category);

  const inactiveCurrent = Math.max(0, values.hostedCurrent - values.activeCurrent);
  const inactivePrevious = Math.max(0, values.hostedPrevious - values.activePrevious);

  const cards = [
    {
      key: 'active' as const,
      label: copy.active.label,
      tooltip: copy.active,
      value: values.activeCurrent,
      previous: values.activePrevious,
      secondary: values.hostedCurrent > 0 ? `/${values.hostedCurrent}` : null,
      href: hostedAccountsRoute({
        hostSlug,
        category,
        filter: 'hadActivityBetween',
        range: { from: period.from, to: period.to },
      }),
    },
    {
      key: 'inactive' as const,
      label: copy.inactive.label,
      tooltip: copy.inactive,
      value: inactiveCurrent,
      previous: inactivePrevious,
      secondary: null,
      href: hostedAccountsRoute({
        hostSlug,
        category,
        filter: 'noActivityBetween',
        range: { from: period.from, to: period.to },
      }),
    },
    {
      key: 'joined' as const,
      label: copy.joined.label,
      tooltip: copy.joined,
      value: values.joinedCurrent,
      previous: values.joinedPrevious,
      secondary: null,
      href: hostedAccountsRoute({
        hostSlug,
        category,
        filter: 'joinedBetween',
        range: { from: period.from, to: period.to },
      }),
    },
    {
      key: 'unhosted' as const,
      label: copy.unhosted.label,
      tooltip: copy.unhosted,
      value: values.churnedCurrent,
      previous: values.churnedPrevious,
      secondary: null,
      href: hostedAccountsRoute({
        hostSlug,
        category,
        filter: 'unhostedBetween',
        range: { from: period.from, to: period.to },
      }),
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => {
        const delta = percentChange(card.value, card.previous);
        return (
          <Link
            key={card.key}
            href={card.href}
            className="group rounded-lg border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FormattedMessage {...card.label} />
                <Tooltip>
                  <TooltipTrigger
                    asChild
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <span className="inline-flex cursor-help">
                      <Info size={12} className="text-muted-foreground/70" />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="bottom"
                    align="start"
                    className="max-w-xs border bg-popover p-4 text-popover-foreground shadow-md"
                  >
                    <div className="text-sm font-semibold text-foreground">
                      <FormattedMessage {...card.tooltip.label} />
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <FormattedMessage {...card.tooltip.body} />
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              <ArrowRight
                size={16}
                className="text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <React.Fragment>
                  <span className="text-3xl font-semibold tabular-nums">{card.value.toLocaleString()}</span>
                  {card.secondary && (
                    <span className="text-base text-muted-foreground tabular-nums">{card.secondary}</span>
                  )}
                </React.Fragment>
              )}
            </div>
            {!loading && delta !== null && (
              <div
                className={`mt-1 text-xs tabular-nums ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-600' : 'text-muted-foreground'}`}
              >
                {delta > 0 ? '+' : ''}
                {delta.toFixed(0)}%
                <span className="ml-1 text-muted-foreground">
                  <FormattedMessage {...messages.vsPreviousMonth} />
                </span>
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
}
