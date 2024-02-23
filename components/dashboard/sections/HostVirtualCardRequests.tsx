import React from 'react';
import { useQuery } from '@apollo/client';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, FiltersToVariables, Views } from '../../../lib/filters/filter-types';
import { isMulti, limit, offset } from '../../../lib/filters/schemas';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import type {
  Account,
  Host,
  HostVirtualCardRequestsQueryVariables,
  VirtualCardRequestCollection,
} from '../../../lib/graphql/types/v2/graphql';
import { VirtualCardRequestStatus } from '../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../lib/hooks/useQueryFilter';
import { i18nVirtualCardRequestStatus } from '../../../lib/i18n/virtual-card-request';
import { sortSelectOptions } from '../../../lib/utils';

import { accountHoverCardFields } from '../../AccountHoverCard';
import { Flex } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import Pagination from '../../Pagination';
import { P } from '../../Text';
import { VirtualCardRequestDrawer } from '../../virtual-card-requests/VirtualCardRequestDrawer';
import { VirtualCardRequestsTable } from '../../virtual-card-requests/VirtualCardRequestsTable';
import { StripeVirtualCardComplianceStatement } from '../../virtual-cards/StripeVirtualCardComplianceStatement';
import DashboardHeader from '../DashboardHeader';
import { EmptyResults } from '../EmptyResults';
import ComboSelectFilter from '../filters/ComboSelectFilter';
import { Filterbar } from '../filters/Filterbar';
import { hostedAccountFilter } from '../filters/HostedAccountFilter';
import type { DashboardSectionProps } from '../types';

const schema = z.object({
  limit,
  offset,
  account: hostedAccountFilter.schema,
  status: isMulti(z.nativeEnum(VirtualCardRequestStatus)).optional(),
  virtualCardRequest: z.coerce.number().int().optional(),
});

type FilterMeta = {
  hostSlug: string;
};

const toVariables: FiltersToVariables<z.infer<typeof schema>, HostVirtualCardRequestsQueryVariables, FilterMeta> = {
  account: hostedAccountFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof schema>, FilterMeta> = {
  account: hostedAccountFilter.filter,
  status: {
    labelMsg: defineMessage({ defaultMessage: 'Status' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        isMulti
        options={Object.values(VirtualCardRequestStatus)
          .map(value => ({ label: i18nVirtualCardRequestStatus(intl, value), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => i18nVirtualCardRequestStatus(intl, value),
  },
};

const hostVirtualCardRequestsMetaDataQuery = gql`
  query HostVirtualCardRequestsMetaData($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      legacyId
    }
    pending: virtualCardRequests(host: { slug: $hostSlug }, status: [PENDING], limit: 0, offset: 0) {
      totalCount
    }
    approved: virtualCardRequests(host: { slug: $hostSlug }, status: [APPROVED], limit: 0, offset: 0) {
      totalCount
    }
    rejected: virtualCardRequests(host: { slug: $hostSlug }, status: [REJECTED], limit: 0, offset: 0) {
      totalCount
    }
  }
`;

const hostVirtualCardRequestsQuery = gql`
  query HostVirtualCardRequests(
    $hostSlug: String!
    $account: [AccountReferenceInput]
    $status: [VirtualCardRequestStatus]
    $limit: Int!
    $offset: Int!
  ) {
    host(slug: $hostSlug) {
      id
      legacyId
    }
    virtualCardRequests(
      host: { slug: $hostSlug }
      collective: $account
      status: $status
      limit: $limit
      offset: $offset
    ) {
      totalCount
      limit
      offset
      nodes {
        id
        legacyId
        purpose
        notes
        status
        currency
        spendingLimitAmount {
          valueInCents
          currency
        }
        spendingLimitInterval
        createdAt
        account {
          id
          name
          slug
          imageUrl
          ...AccountHoverCardFields
        }
        host {
          id
          name
          slug
          imageUrl
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
  ${accountHoverCardFields}
`;

export default function HostVirtualCardRequests({ accountSlug: hostSlug }: DashboardSectionProps) {
  const intl = useIntl();
  const { data: metaData } = useQuery(hostVirtualCardRequestsMetaDataQuery, {
    context: API_V2_CONTEXT,
    variables: { hostSlug },
    errorPolicy: 'all',
  });

  const views: Views<z.infer<typeof schema>> = [
    {
      id: 'pending',
      label: intl.formatMessage({ defaultMessage: 'Pending' }),
      filter: {
        status: [VirtualCardRequestStatus.PENDING],
      },
      count: metaData?.pending.totalCount,
    },
    {
      id: 'approved',
      label: intl.formatMessage({ defaultMessage: 'Approved' }),
      filter: {
        status: [VirtualCardRequestStatus.APPROVED],
      },
      count: metaData?.approved.totalCount,
    },
    {
      id: 'rejected',
      label: intl.formatMessage({ defaultMessage: 'Rejected' }),
      filter: {
        status: [VirtualCardRequestStatus.REJECTED],
      },
      count: metaData?.rejected?.totalCount,
    },
  ];

  const queryFilter = useQueryFilter({
    filters,
    toVariables,
    schema,
    views,
    meta: { hostSlug },
  });

  const query = useQuery<{
    virtualCardRequests: VirtualCardRequestCollection;
    host: Pick<Host, 'legacyId'>;
    account: Account;
  }>(hostVirtualCardRequestsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      hostSlug,
      ...queryFilter.variables,
    },
    errorPolicy: 'all',
  });

  const error = !query.data?.virtualCardRequests && query.error;
  const loading = query.loading;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="VirtualCardRequests.Title" defaultMessage="Virtual Card Requests" />}
        description={
          <FormattedMessage
            id="Host.VirtualCardRequests.List.Description"
            defaultMessage="Manage virtual card requests made by your hosted collectives. <learnMoreLink>Learn more</learnMoreLink>"
            values={{
              learnMoreLink: getI18nLink({
                href: 'https://docs.opencollective.com/help/fiscal-hosts/virtual-cards',
                openInNewTabNoFollow: true,
              }),
            }}
          />
        }
      >
        <StripeVirtualCardComplianceStatement />
      </DashboardHeader>
      <Filterbar {...queryFilter} />

      {error ? (
        <MessageBoxGraphqlError error={error} my={4} />
      ) : !loading && !query.data?.virtualCardRequests?.nodes?.length ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="VIRTUAL_CARD_REQUESTS"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <VirtualCardRequestsTable
            onSelectedVirtualCardRequest={vcr => queryFilter.setFilter('virtualCardRequest', vcr.legacyId)}
            loading={query.loading}
            virtualCardRequests={query.data?.virtualCardRequests.nodes}
          />
          <Flex mt={5} alignItems="center" flexDirection="column" justifyContent="center">
            <Pagination
              total={query.data?.virtualCardRequests.totalCount}
              limit={queryFilter.values.limit}
              offset={queryFilter.values.offset}
              onPageChange={page => queryFilter.setFilter('offset', (page - 1) * queryFilter.values.limit)}
            />
            <P mt={1} fontSize="12px">
              <FormattedMessage
                id="withColon"
                defaultMessage="{item}:"
                values={{ item: <FormattedMessage id="TotalItems" defaultMessage="Total Items" /> }}
              />{' '}
              {query.data?.virtualCardRequests.totalCount}
            </P>
          </Flex>

          <VirtualCardRequestDrawer
            open={!!queryFilter.values.virtualCardRequest}
            onClose={() => queryFilter.setFilter('virtualCardRequest', null)}
            virtualCardRequestId={queryFilter.values.virtualCardRequest}
          />
        </React.Fragment>
      )}
    </div>
  );
}
