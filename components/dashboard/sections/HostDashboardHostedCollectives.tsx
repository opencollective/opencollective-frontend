import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { omit } from 'lodash';
import { defineMessage, FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { HostedCollectiveTypes } from '../../../lib/constants/collectives';
import { FilterComponentConfigs, FiltersToVariables } from '../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../lib/filters/schemas';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import { DashboardHostedCollectivesQueryVariables, HostFeeStructure } from '../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../lib/hooks/useQueryFilter';
import formatCollectiveType from '../../../lib/i18n/collective-type';
import { formatHostFeeStructure } from '../../../lib/i18n/host-fee-structure';

import { Flex, Grid } from '../../Grid';
import HostAdminCollectiveCard from '../../host-dashboard/HostAdminCollectiveCard';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import Pagination from '../../Pagination';
import DashboardHeader from '../DashboardHeader';
import { EmptyResults } from '../EmptyResults';
import ComboSelectFilter from '../filters/ComboSelectFilter';
import { Filterbar } from '../filters/Filterbar';
import { orderByFilter } from '../filters/OrderFilter';
import { searchFilter } from '../filters/SearchFilter';
import { DashboardSectionProps } from '../types';

const COLLECTIVES_PER_PAGE = 20;

const schema = z.object({
  limit: integer.default(COLLECTIVES_PER_PAGE),
  offset: integer.default(0),
  searchTerm: searchFilter.schema,
  orderBy: orderByFilter.schema,
  hostFeesStructure: z.nativeEnum(HostFeeStructure).optional(),
  type: isMulti(z.nativeEnum(HostedCollectiveTypes)).optional(),
});

const toVariables: FiltersToVariables<z.infer<typeof schema>, DashboardHostedCollectivesQueryVariables> = {
  orderBy: orderByFilter.toVariables,
};

const filters: FilterComponentConfigs<z.infer<typeof schema>> = {
  orderBy: orderByFilter.filter,
  searchTerm: searchFilter.filter,
  hostFeesStructure: {
    labelMsg: defineMessage({ id: 'FeeStructure', defaultMessage: 'Fee structure' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(omit(HostFeeStructure, HostFeeStructure.MONTHLY_RETAINER)).map(value => ({
          label: formatHostFeeStructure(intl, value),
          value,
        }))}
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => formatHostFeeStructure(intl, value),
  },
  type: {
    labelMsg: defineMessage({ id: 'Type', defaultMessage: 'Type' }),
    Component: ({ intl, ...props }) => (
      <ComboSelectFilter
        options={Object.values(HostedCollectiveTypes).map(value => ({
          label: formatCollectiveType(intl, value),
          value,
        }))}
        isMulti
        {...props}
      />
    ),
    valueRenderer: ({ value, intl }) => formatCollectiveType(intl, value),
  },
};

// TODO: This query is using `legacyId` for host and member.account to interface with the
// legacy `AddFundsForm`. Once the new add funds form will be implemented, we can remove these fields.
const hostedCollectivesQuery = gql`
  query DashboardHostedCollectives(
    $hostSlug: String!
    $limit: Int!
    $offset: Int!
    $orderBy: OrderByInput
    $hostFeesStructure: HostFeeStructure
    $searchTerm: String
    $type: [AccountType]
  ) {
    host(slug: $hostSlug) {
      id
      legacyId
      slug
      name
      currency
      isHost
      type
      settings
      hostFeePercent
      plan {
        id
        hostFees
        hostFeeSharePercent
      }
      memberOf(
        role: HOST
        limit: $limit
        offset: $offset
        orderBy: $orderBy
        hostFeesStructure: $hostFeesStructure
        searchTerm: $searchTerm
        accountType: $type
        isApproved: true
      ) {
        offset
        limit
        totalCount
        nodes {
          id
          createdAt
          account {
            id
            legacyId
            name
            slug
            website
            type
            currency
            imageUrl(height: 96)
            isFrozen
            tags
            settings
            createdAt
            stats {
              id
              balance {
                valueInCents
                currency
              }
            }
            ... on AccountWithHost {
              hostFeesStructure
              hostFeePercent
            }
            ... on AccountWithContributions {
              totalFinancialContributors
            }
            ... on AccountWithParent {
              parent {
                id
                slug
                name
              }
            }
          }
        }
      }
    }
  }
`;

const ROUTE_PARAMS = ['slug', 'section', 'view'];

const HostDashboardHostedCollectives = ({ accountSlug: hostSlug }: DashboardSectionProps) => {
  const queryFilter = useQueryFilter({
    filters,
    schema,
    toVariables,
  });

  const { data, error, loading, variables } = useQuery(hostedCollectivesQuery, {
    variables: { hostSlug, ...queryFilter.variables },
    context: API_V2_CONTEXT,
  });

  const hostedMemberships = data?.host?.memberOf;
  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader title={<FormattedMessage id="HostedCollectives" defaultMessage="Hosted Collectives" />} />

      <Filterbar {...queryFilter} />

      {error && <MessageBoxGraphqlError error={error} mb={2} />}

      {!error && !loading && !hostedMemberships?.nodes.length ? (
        <EmptyResults
          hasFilters={queryFilter.hasFilters}
          entityType="COLLECTIVES"
          onResetFilters={() => queryFilter.resetFilters({})}
        />
      ) : (
        <React.Fragment>
          <Grid gridGap={24} gridTemplateColumns="repeat(auto-fill, minmax(200px, 1fr))">
            {loading
              ? Array.from(new Array(COLLECTIVES_PER_PAGE)).map((_, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <LoadingPlaceholder key={index} height={362} borderRadius="8px" />
                ))
              : hostedMemberships?.nodes.map(member => (
                  <HostAdminCollectiveCard
                    key={member.id}
                    host={data.host}
                    collective={member.account}
                    since={member.createdAt}
                  />
                ))}
          </Grid>
          <Flex mt={5} justifyContent="center">
            <Pagination
              total={hostedMemberships?.totalCount}
              limit={variables.limit}
              offset={variables.offset}
              ignoredQueryParams={ROUTE_PARAMS}
            />
          </Flex>
        </React.Fragment>
      )}
    </div>
  );
};

HostDashboardHostedCollectives.propTypes = {
  accountSlug: PropTypes.string.isRequired,
};

export default HostDashboardHostedCollectives;
