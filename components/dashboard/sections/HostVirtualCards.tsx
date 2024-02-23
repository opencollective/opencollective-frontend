import React from 'react';
import { useQuery } from '@apollo/client';
import { omitBy } from 'lodash';
import { PlusIcon } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../lib/filters/filter-types';
import { boolean, isMulti, limit, offset } from '../../../lib/filters/schemas';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import type { Currency, HostedVirtualCardsQueryVariables } from '../../../lib/graphql/types/v2/graphql';
import { VirtualCardStatus } from '../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../lib/hooks/useQueryFilter';
import { i18nHasMissingReceipts } from '../../../lib/i18n/receipts-filter';
import { sortSelectOptions } from '../../../lib/utils';
import { VirtualCardStatusI18n } from '../../../lib/virtual-cards/constants';

import { accountHoverCardFields } from '../../AccountHoverCard';
import AssignVirtualCardModal from '../../edit-collective/AssignVirtualCardModal';
import EditVirtualCardModal from '../../edit-collective/EditVirtualCardModal';
import { getI18nLink } from '../../I18nFormatters';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import Pagination from '../../Pagination';
import { Button } from '../../ui/Button';
import { useToast } from '../../ui/useToast';
import { StripeVirtualCardComplianceStatement } from '../../virtual-cards/StripeVirtualCardComplianceStatement';
import VirtualCardsTable from '../../virtual-cards/VirtualCardsTable';
import DashboardHeader from '../DashboardHeader';
import { EmptyResults } from '../EmptyResults';
import { amountFilter } from '../filters/AmountFilter';
import ComboSelectFilter from '../filters/ComboSelectFilter';
import { dateFilter } from '../filters/DateFilter';
import { Filterbar } from '../filters/Filterbar';
import { AccountRenderer } from '../filters/HostedAccountFilter';
import { orderByFilter } from '../filters/OrderFilter';
import { searchFilter } from '../filters/SearchFilter';
import type { DashboardSectionProps } from '../types';

const hostedVirtualCardAccountsQuery = gql`
  query HostedVirtualCardAccounts($slug: String) {
    host(slug: $slug) {
      id
      hostedVirtualCardCollectives(limit: 500) {
        totalCount
        limit
        offset
        nodes {
          id
          ...AccountHoverCardFields
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

const hostVirtualCardsMetadataQuery = gql`
  query HostedVirtualCardsMetaData($slug: String) {
    host(slug: $slug) {
      id
      slug
      currency
      active: hostedVirtualCards(status: [ACTIVE], limit: 0) {
        totalCount
      }
      inactive: hostedVirtualCards(status: [INACTIVE], limit: 0) {
        totalCount
      }
      canceled: hostedVirtualCards(status: [CANCELED], limit: 0) {
        totalCount
      }
    }
  }
`;

const hostVirtualCardsQuery = gql`
  query HostedVirtualCards(
    $slug: String
    $limit: Int!
    $offset: Int!
    $account: [AccountReferenceInput]
    $status: [VirtualCardStatus]
    $dateFrom: DateTime
    $dateTo: DateTime
    $amountFrom: AmountInput
    $amountTo: AmountInput
    $hasMissingReceipts: Boolean
    $searchTerm: String
    $orderBy: ChronologicalOrderInput
  ) {
    host(slug: $slug) {
      id
      legacyId
      slug
      name
      imageUrl
      currency
      settings
      stripe {
        username
      }
      hostedVirtualCards(
        limit: $limit
        offset: $offset
        collectiveAccountIds: $account
        status: $status
        withExpensesDateFrom: $dateFrom
        withExpensesDateTo: $dateTo
        spentAmountFrom: $amountFrom
        spentAmountTo: $amountTo
        hasMissingReceipts: $hasMissingReceipts
        searchTerm: $searchTerm
        orderBy: $orderBy
      ) {
        totalCount
        limit
        offset
        nodes {
          id
          name
          last4
          data
          status
          privateData
          provider
          spendingLimitAmount
          spendingLimitInterval
          spendingLimitRenewsOn
          remainingLimit
          currency
          createdAt
          account {
            id
            name
            slug
            imageUrl
            ...AccountHoverCardFields
          }
          assignee {
            id
            name
            email
            slug
            imageUrl
            ...AccountHoverCardFields
          }
        }
      }
    }
  }
  ${accountHoverCardFields}
`;

const schema = z.object({
  limit,
  offset,
  searchTerm: searchFilter.schema,
  date: dateFilter.schema,
  amount: amountFilter.schema,
  orderBy: orderByFilter.schema,
  account: isMulti(z.string()).optional(),
  status: isMulti(z.nativeEnum(VirtualCardStatus)).optional(),
  hasMissingReceipts: boolean.optional(),
});

type FilterMeta = {
  hostSlug: string;
  currency?: Currency;
};

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostedVirtualCardsQueryVariables, FilterMeta> = {
  orderBy: orderByFilter.toVariables,
  date: dateFilter.toVariables,
  amount: (value, key, meta) => {
    const { minAmount, maxAmount } = amountFilter.toVariables(value, key, meta);
    return omitBy(
      {
        amountFrom: {
          valueInCents: minAmount,
          currency: meta?.currency,
        },
        amountTo: {
          valueInCents: maxAmount,
          currency: meta?.currency,
        },
      },
      value => !value.valueInCents,
    );
  },
  account: (slugs, key) => ({ [key]: slugs.map(slug => ({ slug })) }),
};

const filters: FilterComponentConfigs<z.infer<typeof schema>, FilterMeta> = {
  searchTerm: searchFilter.filter,
  date: { ...dateFilter.filter, labelMsg: defineMessage({ defaultMessage: 'Expense period' }) },
  amount: { ...amountFilter.filter, labelMsg: defineMessage({ defaultMessage: 'Total spent' }) },
  orderBy: orderByFilter.filter,
  account: {
    labelMsg: defineMessage({ defaultMessage: 'Account' }),
    Component: ({ meta, ...props }) => {
      const { data, loading } = useQuery(hostedVirtualCardAccountsQuery, {
        variables: { slug: meta.hostSlug },
        context: API_V2_CONTEXT,
      });
      const accounts = data?.host?.hostedVirtualCardCollectives?.nodes ?? [];

      return (
        <ComboSelectFilter
          isMulti
          loading={loading}
          options={accounts.map(account => ({
            value: account.slug,
            label: <AccountRenderer account={account} inOptionsList />,
          }))}
          {...props}
        />
      );
    },
    valueRenderer: ({ value }) => <AccountRenderer account={{ slug: value }} />,
  },
  status: {
    labelMsg: defineMessage({ defaultMessage: 'Status' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        isMulti
        options={Object.values(VirtualCardStatus)
          .map(value => ({ label: intl.formatMessage(VirtualCardStatusI18n[value]), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => intl.formatMessage(VirtualCardStatusI18n[value]),
  },
  hasMissingReceipts: {
    labelMsg: defineMessage({ id: 'virtual-card.missingReceipts.filter', defaultMessage: 'Receipts' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        options={[true, false].map(value => ({ value, label: i18nHasMissingReceipts(intl, value) }))}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nHasMissingReceipts(intl, value),
  },
};

const ROUTE_PARAMS = ['slug', 'section'];

const HostVirtualCards = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const { toast } = useToast();
  const intl = useIntl();
  const { data: metadata } = useQuery(hostVirtualCardsMetadataQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: hostSlug },
  });

  const views: Views<z.infer<typeof schema>> = [
    {
      id: 'active',
      label: intl.formatMessage({ id: 'Subscriptions.Active', defaultMessage: 'Active' }),
      filter: { status: [VirtualCardStatus.ACTIVE] },
      count: metadata?.host?.active?.totalCount,
    },
    {
      id: 'inactive',
      label: intl.formatMessage({ id: 'virtualCard.status.inactive', defaultMessage: 'Inactive' }),
      filter: { status: [VirtualCardStatus.INACTIVE] },
      count: metadata?.host?.inactive?.totalCount,
    },
    {
      id: 'canceled',
      label: intl.formatMessage({ id: 'virtualCard.status.canceled', defaultMessage: 'Canceled' }),
      filter: { status: [VirtualCardStatus.CANCELED] },
      count: metadata?.host?.canceled?.totalCount,
    },
  ];

  const queryFilter = useQueryFilter({
    schema,
    filters,
    toVariables,
    meta: { hostSlug, currency: metadata?.host?.currency },
    views,
  });

  const { error, loading, data, refetch, variables } = useQuery(hostVirtualCardsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      slug: hostSlug,
      ...queryFilter.variables,
    },
  });

  const [displayAssignCardModal, setAssignCardModalDisplay] = React.useState(false);
  const [displayCreateVirtualCardModal, setCreateVirtualCardModalDisplay] = React.useState(false);

  const handleAssignCardSuccess = message => {
    toast({
      variant: 'success',
      message: message || (
        <FormattedMessage id="Host.VirtualCards.AssignCard.Success" defaultMessage="Card successfully assigned" />
      ),
    });
    setAssignCardModalDisplay(false);
    refetch();
  };

  const handleCreateVirtualCardSuccess = message => {
    toast({
      variant: 'success',
      message: message || <FormattedMessage defaultMessage="Virtual card successfully created" />,
    });
    setCreateVirtualCardModalDisplay(false);
    refetch();
  };

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="VirtualCards.Title" defaultMessage="Virtual Cards" />}
        description={
          <FormattedMessage
            id="Host.VirtualCards.List.Description"
            defaultMessage="Make payments easier by creating virtual cards. One Collective can have multiple virtual cards. <learnMoreLink>Learn more</learnMoreLink>"
            values={{
              learnMoreLink: getI18nLink({
                href: 'https://docs.opencollective.com/help/fiscal-hosts/virtual-cards',
                openInNewTabNoFollow: true,
              }),
            }}
          />
        }
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" disabled={loading} onClick={() => setAssignCardModalDisplay(true)} variant="outline">
              <FormattedMessage id="Host.VirtualCards.AssignCard" defaultMessage="Assign Card" />
            </Button>
            <Button
              disabled={loading}
              size="sm"
              className="gap-1"
              onClick={() => setCreateVirtualCardModalDisplay(true)}
            >
              <span>
                <FormattedMessage defaultMessage="Create virtual card" />
              </span>
              <PlusIcon size={20} />
            </Button>
          </div>
        }
      >
        <StripeVirtualCardComplianceStatement />
      </DashboardHeader>
      <Filterbar {...queryFilter} />

      {error ? (
        <MessageBoxGraphqlError error={error} my={4} />
      ) : !loading && !data?.host.hostedVirtualCards.nodes?.length ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="VIRTUAL_CARDS"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <VirtualCardsTable
            canEditVirtualCard
            canDeleteVirtualCard
            onDeleteRefetchQuery="HostedVirtualCards"
            virtualCards={data?.host.hostedVirtualCards.nodes}
            host={data?.host}
            loading={loading}
          />
          <div className="mt-12 flex flex-col items-center justify-center gap-1">
            <Pagination
              route={`/dashboard/${data?.host.slug}/host-virtual-cards`}
              total={data?.host?.hostedVirtualCards.totalCount}
              limit={variables.limit}
              offset={variables.offset}
              ignoredQueryParams={ROUTE_PARAMS}
            />
            <p className="text-sm">
              <FormattedMessage id="TotalItems" defaultMessage="Total Items" />:{' '}
              {data?.host?.hostedVirtualCards.totalCount}
            </p>
          </div>
        </React.Fragment>
      )}

      {displayAssignCardModal && (
        <AssignVirtualCardModal
          host={data.host}
          onSuccess={handleAssignCardSuccess}
          onClose={() => {
            setAssignCardModalDisplay(false);
          }}
        />
      )}

      {displayCreateVirtualCardModal && (
        <EditVirtualCardModal
          host={data.host}
          onSuccess={handleCreateVirtualCardSuccess}
          onClose={() => {
            setCreateVirtualCardModalDisplay(false);
          }}
        />
      )}
    </div>
  );
};

export default HostVirtualCards;
