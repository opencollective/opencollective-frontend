import React from 'react';
import { useQuery } from '@apollo/client';
import { identity, toLower, toUpper } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import type { Account, Host, VirtualCardRequestCollection } from '../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../lib/hooks/deprecated/useQueryFilter';

import { accountHoverCardFields } from '../../AccountHoverCard';
import type { DashboardSectionProps } from '../../dashboard/types';
import { Box, Flex } from '../../Grid';
import { getI18nLink } from '../../I18nFormatters';
import Loading from '../../Loading';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import Pagination from '../../Pagination';
import { P } from '../../Text';
import { VirtualCardRequestDrawer } from '../../virtual-card-requests/VirtualCardRequestDrawer';
import VirtualCardRequestFilter from '../../virtual-card-requests/VirtualCardRequestFilter';
import { VirtualCardRequestsTable } from '../../virtual-card-requests/VirtualCardRequestsTable';
import { StripeVirtualCardComplianceStatement } from '../../virtual-cards/StripeVirtualCardComplianceStatement';

const hostVirtualCardRequestsQuery = gql`
  query HostDashboardVirtualCardRequests(
    $hostSlug: String!
    $collective: [AccountReferenceInput]
    $selectedCollectiveSlug: String
    $status: [VirtualCardRequestStatus]
    $limit: Int!
    $offset: Int!
  ) {
    host(slug: $hostSlug) {
      id
      legacyId
    }
    account(slug: $selectedCollectiveSlug) {
      id
      legacyId
      slug
    }
    virtualCardRequests(
      host: { slug: $hostSlug }
      collective: $collective
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
  const queryFilter = useQueryFilter({
    ignoreQueryParams: ['slug', 'section'],
    filters: {
      offset: {
        deserialize: parseInt,
        serialize: identity,
      },
      limit: {
        deserialize: parseInt,
        serialize: identity,
      },
      collectiveSlug: {
        queryParam: 'collective',
      },
      virtualCardRequestStatus: {
        isMulti: true,
        queryParam: 'status',
        serialize: toLower,
        deserialize: toUpper,
      },
      virtualCardRequest: {
        deserialize: parseInt,
        serialize: identity,
      },
    },
  });

  const query = useQuery<{
    virtualCardRequests: VirtualCardRequestCollection;
    host: Pick<Host, 'legacyId'>;
    account: Account;
  }>(hostVirtualCardRequestsQuery, {
    context: API_V2_CONTEXT,
    variables: {
      hostSlug,
      collective: queryFilter.values.collectiveSlug ? [{ slug: queryFilter.values.collectiveSlug }] : null,
      selectedCollectiveSlug: queryFilter.values.collectiveSlug,
      status: queryFilter.values.virtualCardRequestStatus,
      limit: queryFilter.values.limit ?? 10,
      offset: queryFilter.values.offset ?? 0,
    },
    errorPolicy: 'all',
  });

  const error = !query.data?.virtualCardRequests && query.error;
  const loading = query.loading;

  return (
    <Box>
      <h1 className="text-2xl font-bold leading-10 tracking-tight">
        <FormattedMessage id="VirtualCardRequests.Title" defaultMessage="Virtual Card Requests" />
      </h1>
      <p className="mb-4 text-muted-foreground">
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
      </p>
      <Box mb={3}>
        <StripeVirtualCardComplianceStatement />
      </Box>
      <VirtualCardRequestFilter
        virtualCardRequestStatusFilter={queryFilter.values.virtualCardRequestStatus}
        onVirtualCardRequestStatusFilter={queryFilter.setVirtualCardRequestStatus}
        selectedCollective={query.data?.account}
        onSelectedCollectiveChange={c => queryFilter.setCollectiveSlug(c?.slug)}
        host={query.data?.host}
        loading={query.loading}
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <React.Fragment>
          <VirtualCardRequestsTable
            onSelectedVirtualCardRequest={vcr => queryFilter.setVirtualCardRequest(vcr.legacyId)}
            loading={query.loading}
            virtualCardRequests={query.data.virtualCardRequests.nodes}
          />
          <Flex mt={5} alignItems="center" flexDirection="column" justifyContent="center">
            <Pagination
              total={query.data.virtualCardRequests.totalCount}
              limit={query.data.virtualCardRequests.limit}
              offset={query.data.virtualCardRequests.offset}
              onPageChange={page => queryFilter.setOffset((page - 1) * query.data.virtualCardRequests.limit)}
            />
            <P mt={1} fontSize="12px">
              <FormattedMessage
                id="withColon"
                defaultMessage="{item}:"
                values={{ item: <FormattedMessage id="TotalItems" defaultMessage="Total Items" /> }}
              />{' '}
              {query.data.virtualCardRequests.totalCount}
            </P>
          </Flex>

          <VirtualCardRequestDrawer
            open={!!queryFilter.values.virtualCardRequest}
            onClose={() => queryFilter.setVirtualCardRequest(null)}
            virtualCardRequestId={queryFilter.values.virtualCardRequest}
          />
        </React.Fragment>
      )}
    </Box>
  );
}
