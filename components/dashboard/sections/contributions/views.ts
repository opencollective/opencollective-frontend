import { Views } from '@/lib/filters/filter-types';
import { ALL_SECTIONS } from '../../constants';
import { ContributionFrequency, ExpectedFundsFilter, OrderStatus } from '@/lib/graphql/types/v2/graphql';
import z from 'zod';
import { gql, useQuery } from '@apollo/client';
import React from 'react';
import { DashboardContext } from '../../DashboardContext';
import { API_V2_CONTEXT } from '@/lib/graphql/helpers';

export enum ContributionsTab {
  ALL = 'ALL',
  RECURRING = 'RECURRING',
  ONETIME = 'ONETIME',
  PAUSED = 'PAUSED',
  CANCELED = 'CANCELED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  DISPUTED = 'DISPUTED',
  IN_REVIEW = 'IN_REVIEW',
  ERROR = 'ERROR',
}

export function getViews(
  intl,
  schema,
  page:
    | typeof ALL_SECTIONS.INCOMING_CONTRIBUTIONS
    | typeof ALL_SECTIONS.HOST_EXPECTED_FUNDS
    | typeof ALL_SECTIONS.OUTGOING_CONTRIBUTIONS
    | typeof ALL_SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS,
) {
  const views: Views<z.infer<typeof schema>> = [
    {
      id: ContributionsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {
        ...(page === ALL_SECTIONS.HOST_EXPECTED_FUNDS
          ? { expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS }
          : {}),
      },
    },
    page === ALL_SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS
      ? {
          id: ContributionsTab.DISPUTED,
          label: intl.formatMessage({ defaultMessage: 'Disputed', id: 'X1pwhF' }),
          filter: {
            status: [OrderStatus.DISPUTED],
          },
        }
      : null,
    page === ALL_SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS
      ? {
          id: ContributionsTab.ERROR,
          label: intl.formatMessage({ defaultMessage: 'Error', id: 'KN7zKn' }),
          filter: {
            status: [OrderStatus.ERROR],
          },
        }
      : null,
    page === ALL_SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS
      ? {
          id: ContributionsTab.IN_REVIEW,
          label: intl.formatMessage({ id: 'order.in_review', defaultMessage: 'In Review' }),
          filter: {
            status: [OrderStatus.IN_REVIEW],
          },
        }
      : null,
    page === ALL_SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS
      ? {
          id: ContributionsTab.PAUSED,
          label: intl.formatMessage({ defaultMessage: 'Paused', id: 'C2iTEH' }),
          filter: {
            status: [OrderStatus.PAUSED],
          },
        }
      : null,
    [ALL_SECTIONS.INCOMING_CONTRIBUTIONS, ALL_SECTIONS.OUTGOING_CONTRIBUTIONS].includes(page)
      ? {
          id: ContributionsTab.RECURRING,
          label: intl.formatMessage({ defaultMessage: 'Recurring', id: 'v84fNv' }),
          filter: {
            frequency: [ContributionFrequency.MONTHLY, ContributionFrequency.YEARLY],
            status: [OrderStatus.ACTIVE, OrderStatus.ERROR],
          },
        }
      : null,
    [ALL_SECTIONS.INCOMING_CONTRIBUTIONS, ALL_SECTIONS.OUTGOING_CONTRIBUTIONS].includes(page)
      ? {
          id: ContributionsTab.ONETIME,
          label: intl.formatMessage({ defaultMessage: 'One-Time', id: 'jX0G5O' }),
          filter: {
            frequency: [ContributionFrequency.ONETIME],
            status: [OrderStatus.PAID, OrderStatus.PROCESSING],
          },
        }
      : null,
    [ALL_SECTIONS.INCOMING_CONTRIBUTIONS, ALL_SECTIONS.OUTGOING_CONTRIBUTIONS].includes(page)
      ? {
          id: ContributionsTab.PAUSED,
          label: intl.formatMessage({ id: 'order.paused', defaultMessage: 'Paused' }),
          filter: {
            status: [OrderStatus.PAUSED],
          },
        }
      : null,
    page === ALL_SECTIONS.HOST_EXPECTED_FUNDS
      ? {
          id: ContributionsTab.PENDING,
          label: intl.formatMessage({ defaultMessage: 'Pending', id: 'eKEL/g' }),
          filter: {
            status: [OrderStatus.PENDING],
            expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
          },
        }
      : null,
    page === ALL_SECTIONS.HOST_EXPECTED_FUNDS
      ? {
          id: ContributionsTab.PAID,
          label: intl.formatMessage({ defaultMessage: 'Paid', id: 'u/vOPu' }),
          filter: {
            status: [OrderStatus.PAID],
            expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
          },
        }
      : null,
    page === ALL_SECTIONS.HOST_EXPECTED_FUNDS
      ? {
          id: ContributionsTab.EXPIRED,
          label: intl.formatMessage({ defaultMessage: 'Expired', id: 'RahCRH' }),
          filter: {
            status: [OrderStatus.EXPIRED],
            expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS,
          },
        }
      : null,
    [
      ALL_SECTIONS.INCOMING_CONTRIBUTIONS,
      ALL_SECTIONS.OUTGOING_CONTRIBUTIONS,
      ALL_SECTIONS.HOST_EXPECTED_FUNDS,
    ].includes(page)
      ? {
          id: ContributionsTab.CANCELED,
          label: intl.formatMessage({ defaultMessage: 'Cancelled', id: '3wsVWF' }),
          filter: {
            status: [OrderStatus.CANCELLED],
            ...(page === ALL_SECTIONS.HOST_EXPECTED_FUNDS
              ? { expectedFundsFilter: ExpectedFundsFilter.ALL_EXPECTED_FUNDS }
              : {}),
          },
        }
      : null,
  ].filter(Boolean);
  return views;
}

export function useGetViewCounts(
  page:
    | typeof ALL_SECTIONS.INCOMING_CONTRIBUTIONS
    | typeof ALL_SECTIONS.HOST_EXPECTED_FUNDS
    | typeof ALL_SECTIONS.OUTGOING_CONTRIBUTIONS
    | typeof ALL_SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS,
  extraVariables?: { string: any },
) {
  const { account } = React.useContext(DashboardContext);
  const variables = {
    slug: account.slug,
    filter: page === ALL_SECTIONS.OUTGOING_CONTRIBUTIONS ? 'OUTGOING' : 'INCOMING',
    expectedFundsFilter: page === ALL_SECTIONS.HOST_EXPECTED_FUNDS ? ExpectedFundsFilter.ALL_EXPECTED_FUNDS : undefined,
    onlyExpectedFunds: page === ALL_SECTIONS.HOST_EXPECTED_FUNDS,
    ...extraVariables,
  };
  const { data, refetch } = useQuery(dashboardContributionsViewCountQuery, {
    variables,
    context: API_V2_CONTEXT,
    fetchPolicy: typeof window !== 'undefined' ? 'cache-and-network' : 'cache-first',
  });
  return { viewCounts: data?.account, refetchViewCounts: refetch };
}

const dashboardContributionsViewCountQuery = gql`
  query DashboardContributionsViewCount(
    $slug: String!
    $filter: AccountOrdersFilter!
    $onlyExpectedFunds: Boolean!
    $expectedFundsFilter: ExpectedFundsFilter
    $hostContext: HostContext
  ) {
    account(slug: $slug) {
      id

      PENDING: orders(
        filter: $filter
        expectedFundsFilter: $expectedFundsFilter
        status: [PENDING]
        hostContext: $hostContext
      ) @include(if: $onlyExpectedFunds) {
        totalCount
      }
      EXPIRED: orders(
        filter: $filter
        expectedFundsFilter: $expectedFundsFilter
        status: [EXPIRED]
        hostContext: $hostContext
      ) @include(if: $onlyExpectedFunds) {
        totalCount
      }
      RECURRING: orders(
        filter: $filter
        frequency: [MONTHLY, YEARLY]
        status: [ACTIVE, ERROR]
        includeIncognito: true
        hostContext: $hostContext
      ) @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      PAID: orders(
        filter: $filter
        includeIncognito: true
        status: [PAID]
        hostContext: $hostContext
        expectedFundsFilter: $expectedFundsFilter
      ) @include(if: $onlyExpectedFunds) {
        totalCount
      }
      ONETIME: orders(
        filter: $filter
        frequency: [ONETIME]
        status: [PAID, PROCESSING]
        includeIncognito: true
        minAmount: 1
        hostContext: $hostContext
      ) @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      CANCELED: orders(
        filter: $filter
        status: [CANCELLED]
        includeIncognito: true
        expectedFundsFilter: $expectedFundsFilter
        hostContext: $hostContext
      ) {
        totalCount
      }
      PAUSED: orders(filter: $filter, status: [PAUSED], includeIncognito: true, hostContext: $hostContext)
        @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      PAUSED_RESUMABLE: orders(
        filter: INCOMING
        status: [PAUSED]
        includeIncognito: true
        hostContext: INTERNAL
        pausedBy: [COLLECTIVE, HOST, PLATFORM]
      ) @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      DISPUTED: orders(filter: $filter, status: [DISPUTED], includeIncognito: true, hostContext: $hostContext)
        @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      IN_REVIEW: orders(filter: $filter, status: [IN_REVIEW], includeIncognito: true, hostContext: $hostContext)
        @skip(if: $onlyExpectedFunds) {
        totalCount
      }
      ERROR: orders(filter: $filter, status: [ERROR], includeIncognito: true, hostContext: $hostContext)
        @skip(if: $onlyExpectedFunds) {
        totalCount
      }
    }
  }
`;
