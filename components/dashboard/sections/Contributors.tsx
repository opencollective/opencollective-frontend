import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { toNumber } from 'lodash';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterConfig } from '../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { MemberRole } from '../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../lib/hooks/useQueryFilter';
import { capitalize, sortSelectOptions } from '../../../lib/utils';

import Avatar from '../../Avatar';
import { DataTable } from '../../DataTable';
import DateTime from '../../DateTime';
import LinkCollective from '../../LinkCollective';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { Span } from '../../Text';
import { Pagination } from '../../ui/Pagination';
import DashboardHeader from '../DashboardHeader';
import { EmptyResults } from '../EmptyResults';
import ComboSelectFilter from '../filters/ComboSelectFilter';
import { emailFilter } from '../filters/EmailFilter';
import { Filterbar } from '../filters/Filterbar';
import { orderByFilter } from '../filters/OrderFilter';
import type { DashboardSectionProps } from '../types';

// type FilterMemberRole = MemberRole.FOLLOWER | MemberRole.BACKER | MemberRole.CONTRIBUTOR

enum FilterMemberRole {
  FOLLOWER = MemberRole.FOLLOWER,
  BACKER = MemberRole.BACKER,
}

const MemberRoleSchema = isMulti(z.nativeEnum(FilterMemberRole)).optional();
const memberRoleFilter: FilterConfig<z.infer<typeof MemberRoleSchema>> = {
  schema: MemberRoleSchema,
  filter: {
    labelMsg: defineMessage({ id: 'members.role.label', defaultMessage: 'Role' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        isMulti
        options={Object.values(FilterMemberRole)
          .map(value => ({ label: valueRenderer({ intl, value }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ intl, value }) => {
      const message = { id: `Member.Role.${value}` };
      return intl.formatMessage(message);
    },
  },
};

enum ContributorsTab {
  ALL = 'ALL',
  FOLLOWERS = 'FOLLOWERS',
  BACKERS = 'BACKERS',
}

const PAGE_SIZE = 15;

const dashboardContributorsMetadataQuery = gql`
  query DashboardContributorsMetadata($slug: String!) {
    account(slug: $slug) {
      id
      legacyId
      slug
      name
      type
      settings
      imageUrl
      currency
      ... on AccountWithParent {
        parent {
          id
          slug
        }
      }
      ALL: members(role: [BACKER, FOLLOWER]) {
        totalCount
      }
      FOLLOWERS: members(role: [FOLLOWER]) {
        totalCount
      }
      BACKERS: members(role: [BACKER]) {
        totalCount
      }
    }
  }
`;

const dashboardContributorsQuery = gql`
  query DashboardContributors(
    $slug: String!
    $offset: Int
    $limit: Int
    $role: [MemberRole!]
    $orderBy: ChronologicalOrderInput
    $email: EmailAddress
  ) {
    account(slug: $slug) {
      id
      members(role: $role, offset: $offset, limit: $limit, orderBy: $orderBy, email: $email) {
        totalCount
        nodes {
          id
          role
          tier {
            id
            name
          }
          account {
            id
            slug
            name
          }
          totalDonations {
            currency
            valueInCents
          }
          publicMessage
          description
          since
          createdAt
          updatedAt
        }
      }
    }
  }
`;

const getColumns = ({ intl, activeViewId }) => {
  const account = {
    accessorKey: 'account',
    header: intl.formatMessage({ defaultMessage: 'Account' }),
    cell: ({ cell }) => {
      const account = cell.getValue();
      return (
        <LinkCollective collective={account} className="hover:underline" withHoverCard>
          <div className="flex max-w-[200px] items-center">
            <Avatar size={24} collective={account} mr={2} />
            <Span as="span" truncateOverflow>
              {account?.name}
            </Span>
          </div>
        </LinkCollective>
      );
    },
  };

  const since = {
    accessorKey: 'since',
    header: intl.formatMessage({ id: 'user.since.label', defaultMessage: 'Since' }),
    cell: ({ cell }) => {
      const date = cell.getValue();
      return (
        <div className="flex items-center gap-2 truncate">
          <DateTime value={date} dateStyle="medium" timeStyle={undefined} />
        </div>
      );
    },
  };

  const tier = {
    accessorKey: 'tier.name',
    header: intl.formatMessage({ defaultMessage: 'Tier' }),
    cell: ({ cell }) => {
      const tierName = cell.getValue();
      return <span>{capitalize(tierName)}</span>;
    },
  };

  const role = {
    accessorKey: 'role',
    header: intl.formatMessage({ id: 'members.role.label', defaultMessage: 'Role' }),
    cell: ({ cell }) => {
      const message = { id: `Member.Role.${cell.getValue()}` };
      return intl.formatMessage(message);
    },
  };

  if (activeViewId === ContributorsTab.ALL) {
    return [account, role, tier, since];
  }

  if (activeViewId === ContributorsTab.FOLLOWERS) {
    return [account, since];
  }

  return [account, tier, since];
};

type ContributorsProps = DashboardSectionProps;

const Contributors = ({ accountSlug }: ContributorsProps) => {
  const intl = useIntl();
  const {
    data: metadata,
    loading: metadataLoading,
    error: metadataError,
  } = useQuery(dashboardContributorsMetadataQuery, {
    variables: {
      slug: accountSlug,
    },
    context: API_V2_CONTEXT,
  });

  const views = [
    {
      id: ContributorsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All' }),
      count: metadata?.account?.ALL.totalCount,
      filter: {},
    },
    {
      id: ContributorsTab.BACKERS,
      label: intl.formatMessage({ id: 'ContributorsFilter.Financial', defaultMessage: 'Financial contributors' }),
      count: metadata?.account?.[ContributorsTab.BACKERS]?.totalCount,
      filter: {
        role: [FilterMemberRole.BACKER],
      },
    },
    {
      id: ContributorsTab.FOLLOWERS,
      label: intl.formatMessage({ defaultMessage: 'Followers' }),
      count: metadata?.account?.[ContributorsTab.FOLLOWERS]?.totalCount,
      filter: {
        role: [FilterMemberRole.FOLLOWER],
      },
    },
  ];

  const queryFilter = useQueryFilter({
    schema: z.object({
      limit: integer.default(PAGE_SIZE),
      offset: integer.default(0),
      role: memberRoleFilter.schema,
      orderBy: orderByFilter.schema,
      email: emailFilter.schema,
    }),
    views,
    toVariables: {
      orderBy: orderByFilter.toVariables,
      email: emailFilter.toVariables,
    },
    filters: {
      role: memberRoleFilter.filter,
      orderBy: orderByFilter.filter,
      email: emailFilter.filter,
    },
  });

  const {
    data,
    previousData,
    loading: queryLoading,
    error: queryError,
  } = useQuery(dashboardContributorsQuery, {
    variables: {
      slug: accountSlug,
      role: [MemberRole.FOLLOWER, MemberRole.BACKER],
      ...queryFilter.variables,
    },
    context: API_V2_CONTEXT,
  });

  const { limit, offset } = queryFilter.values;
  const pages = Math.ceil(((data || previousData)?.account?.members.totalCount || 1) / limit);
  const currentPage = toNumber(offset + limit) / limit;

  const contributors = data?.account?.members.nodes || [];

  const loading = metadataLoading || queryLoading;
  const error = metadataError || queryError;

  const columns = React.useMemo(
    () => getColumns({ intl, activeViewId: queryFilter.activeViewId }),
    [intl, queryFilter.activeViewId],
  );
  const currentViewCount = views.find(v => v.id === queryFilter.activeViewId)?.count;
  const nbPlaceholders = currentViewCount < queryFilter.values.limit ? currentViewCount : queryFilter.values.limit;

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader title={<FormattedMessage id="Contributors" defaultMessage="Contributors" />} />
      <Filterbar {...queryFilter} />

      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && contributors.length === 0 ? (
        <EmptyResults hasFilters={queryFilter.hasFilters} onResetFilters={() => queryFilter.resetFilters({})} />
      ) : (
        <div className="flex flex-col gap-4">
          <DataTable
            loading={loading}
            columns={columns}
            data={contributors}
            mobileTableView
            nbPlaceholders={nbPlaceholders}
          />
          <Pagination
            totalPages={pages}
            page={currentPage}
            onChange={page => queryFilter.setFilter('offset', (page - 1) * limit)}
          />
        </div>
      )}
    </div>
  );
};

export default Contributors;
