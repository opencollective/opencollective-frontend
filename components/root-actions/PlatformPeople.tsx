import React from 'react';
import { useQuery } from '@apollo/client';
import { isEmpty } from 'lodash';
import { useRouter } from 'next/router';
import { z } from 'zod';

import type { FilterConfig } from '@/lib/filters/filter-types';
import { integer, isMulti } from '@/lib/filters/schemas';
import { CommunityRelationType, type Contributor } from '@/lib/graphql/types/v2/schema';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { getFlagEmoji } from '@/lib/i18n/countries';
import { sortSelectOptions } from '@/lib/utils';

import Avatar from '../Avatar';
import { CopyID } from '../CopyId';
import DashboardHeader from '../dashboard/DashboardHeader';
import { EmptyResults } from '../dashboard/EmptyResults';
import ComboSelectFilter from '../dashboard/filters/ComboSelectFilter';
import { Filterbar } from '../dashboard/filters/Filterbar';
import { hostFilter } from '../dashboard/filters/HostFilter';
import { Pagination } from '../dashboard/filters/Pagination';
import { searchFilter } from '../dashboard/filters/SearchFilter';
import { makePushSubpath } from '../dashboard/utils';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import { DataTable } from '../table/DataTable';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

import PlatformPersonDetail from './PlatformPersonDetail';
import { peoplePlatformDashboardQuery } from './queries';

const RELATION_TYPE_LABELS: Record<CommunityRelationType, string> = {
  [CommunityRelationType.ADMIN]: 'Admin',
  [CommunityRelationType.ATTENDEE]: 'Attendee',
  [CommunityRelationType.CONTRIBUTOR]: 'Contributor',
  [CommunityRelationType.EXPENSE_SUBMITTER]: 'Expense Submitter',
  [CommunityRelationType.EXPENSE_APPROVER]: 'Expense Approver',
  [CommunityRelationType.PAYEE]: 'Payee',
  [CommunityRelationType.GRANTEE]: 'Grantee',
};

const RelationTypeSchema = isMulti(z.nativeEnum(CommunityRelationType)).optional();
const relationTypeFilter: FilterConfig<z.infer<typeof RelationTypeSchema>> = {
  schema: RelationTypeSchema,
  filter: {
    labelMsg: { id: 'RelationType', defaultMessage: 'Relation Type' },
    Component: props => (
      <ComboSelectFilter
        isMulti
        options={Object.values(CommunityRelationType)
          .map(value => ({ label: RELATION_TYPE_LABELS[value] || value, value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ value }) => RELATION_TYPE_LABELS[value] || value,
  },
};

const getColumns = () => {
  const account = {
    accessorKey: 'account',
    header: 'Account',
    meta: {
      className: 'max-w-64',
    },
    cell: ({ row }) => {
      const account = row.original;
      const legalName = account.legalName !== account.name && account.legalName;
      return (
        <div className="flex items-center overflow-hidden text-nowrap">
          <Avatar size={24} collective={account} mr={2} />
          <span className="truncate">{account.name || account.slug}</span>
          {legalName && <span className="ml-1 truncate text-muted-foreground">{`(${legalName})`}</span>}
        </div>
      );
    },
  };

  const email = {
    accessorKey: 'email',
    header: 'Email',
    meta: {
      className: 'max-w-64',
    },
    cell: ({ cell }) => {
      const email = cell.getValue();
      return email ? (
        <div className="flex items-center gap-1">
          <Tooltip delayDuration={100}>
            <TooltipTrigger asChild>
              <div className="max-w-[250px] truncate text-xs">{email}</div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-sm break-all">{email}</div>
            </TooltipContent>
          </Tooltip>
          <CopyID value={email} tooltipLabel={<span>Copy to clipboard</span>} className="shrink-0" stopEventPropagation toastOnCopy />
        </div>
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
  };

  const country = {
    accessorKey: 'country',
    header: 'Country',
    cell: ({ row }) => {
      const account = row.original;
      return (
        <span className="text-sm whitespace-nowrap">
          {account.location?.country ? (
            <React.Fragment>
              {getFlagEmoji(account.location.country)} {account.location.country}
            </React.Fragment>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </span>
      );
    },
  };

  const slug = {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) => {
      const account = row.original;
      return <span className="text-sm text-muted-foreground">@{account.slug}</span>;
    },
  };

  return [account, email, country, slug];
};

enum ContributorsTab {
  ALL = 'ALL',
  ADMINS = 'ADMINS',
  CONTRIBUTORS = 'CONTRIBUTORS',
  EXPENSE_SUBMITTERS = 'EXPENSE_SUBMITTERS',
  PAYEE = 'PAYEE',
}

const PAGE_SIZE = 20;

interface PlatformPeopleProps {
  subpath?: string[];
  isDashboard?: boolean;
}

const PlatformPeopleDashboard = () => {
  const router = useRouter();
  const pushSubpath = makePushSubpath(router);

  const views = [
    {
      id: ContributorsTab.ALL,
      label: 'All',
      filter: {},
    },
    {
      id: ContributorsTab.ADMINS,
      label: 'Collective Admins',
      filter: { relation: [CommunityRelationType.ADMIN] },
    },
    {
      id: ContributorsTab.CONTRIBUTORS,
      label: 'Financial Contributors',
      filter: { relation: [CommunityRelationType.CONTRIBUTOR, CommunityRelationType.ATTENDEE] },
    },
    {
      id: ContributorsTab.EXPENSE_SUBMITTERS,
      label: 'Expense Submitters',
      filter: { relation: [CommunityRelationType.EXPENSE_SUBMITTER] },
    },
    {
      id: ContributorsTab.PAYEE,
      label: 'Payees',
      filter: { relation: [CommunityRelationType.PAYEE] },
    },
  ];

  const queryFilter = useQueryFilter({
    views,
    schema: z.object({
      limit: integer.default(PAGE_SIZE),
      offset: integer.default(0),
      relation: relationTypeFilter.schema,
      searchTerm: searchFilter.schema,
      host: hostFilter.schema,
    }),
    toVariables: {
      host: hostFilter.toVariables,
    },
    filters: {
      relation: relationTypeFilter.filter,
      searchTerm: searchFilter.filter,
      host: hostFilter.filter,
    },
  });

  const {
    data,
    loading: queryLoading,
    error: queryError,
  } = useQuery(peoplePlatformDashboardQuery, {
    variables: {
      ...queryFilter.variables,
    },
  });

  const contributors = data?.community?.nodes || [];
  const loading = queryLoading;
  const error = queryError;

  const columns = React.useMemo(() => getColumns(), []);

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title="Platform People"
        description="All people that have interacted with the platform. Use the Fiscal Host filter to narrow down by host."
      />
      <Filterbar {...queryFilter} />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : !loading && contributors.length === 0 ? (
        <EmptyResults hasFilters={queryFilter.hasFilters} onResetFilters={() => queryFilter.resetFilters({})} />
      ) : (
        <div className="flex flex-col gap-4">
          <DataTable<Contributor, Contributor>
            loading={loading}
            columns={columns}
            data={contributors}
            nbPlaceholders={queryFilter.values?.limit || 10}
            onClickRow={row => {
              pushSubpath(row.original.id as string);
            }}
            mobileTableView
          />
          <Pagination queryFilter={queryFilter} total={data?.community?.totalCount} />
        </div>
      )}
    </div>
  );
};

const PlatformPeopleRouter = ({ subpath }: PlatformPeopleProps) => {
  const router = useRouter();
  const pushSubpath = makePushSubpath(router);
  const id = subpath?.[0];

  if (!isEmpty(id)) {
    return (
      <div className="h-full">
        <PlatformPersonDetail accountId={id} onClose={() => pushSubpath('')} />
      </div>
    );
  }

  return <PlatformPeopleDashboard />;
};

export default PlatformPeopleRouter;
