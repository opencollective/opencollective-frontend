import React from 'react';
import { useQuery } from '@apollo/client';
import { isEmpty } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterConfig } from '../../../../lib/filters/filter-types';
import { integer, isMulti } from '../../../../lib/filters/schemas';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type { Contributor } from '../../../../lib/graphql/types/v2/schema';
import useQueryFilter from '../../../../lib/hooks/useQueryFilter';
import { sortSelectOptions } from '../../../../lib/utils';
import { CommunityRelationType } from '@/lib/graphql/types/v2/graphql';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';
import { getCountryDisplayName, getFlagEmoji } from '@/lib/i18n/countries';

import Avatar from '../../../Avatar';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataTable } from '../../../table/DataTable';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { emailFilter } from '../../filters/EmailFilter';
import { Filterbar } from '../../filters/Filterbar';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';
import { Pagination } from '../../filters/Pagination';
import type { DashboardSectionProps } from '../../types';
import { makePushSubpath } from '../../utils';

import { ContributorDetails } from './AccountDetail';
import { peopleHostDashboardQuery } from './queries';

const RelationTypeSchema = isMulti(z.nativeEnum(CommunityRelationType)).optional();
const relationTypeFilter: FilterConfig<z.infer<typeof RelationTypeSchema>> = {
  schema: RelationTypeSchema,
  filter: {
    labelMsg: defineMessage({ defaultMessage: 'Relation Type', id: 'fRdYMV' }),
    Component: ({ valueRenderer, intl, ...props }) => (
      <ComboSelectFilter
        isMulti
        options={Object.values(CommunityRelationType)
          .map(value => ({ label: valueRenderer({ intl, value }), value }))
          .sort(sortSelectOptions)}
        {...props}
      />
    ),
    valueRenderer: ({ intl, value }) => {
      return formatCommunityRelation(intl, value);
    },
  },
};

const getColumns = ({ intl }) => {
  const account = {
    accessorKey: 'account',
    header: intl.formatMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
    cell: ({ row }) => {
      const account = row.original;
      const legalName = account.legalName !== account.name && account.legalName;
      return (
        <div className="flex items-center text-nowrap">
          <Avatar size={24} collective={account} mr={2} />
          {account.name}
          {legalName && <span className="ml-1 text-muted-foreground">{`(${legalName})`}</span>}
        </div>
      );
    },
  };

  const email = {
    accessorKey: 'email',
    header: intl.formatMessage({ defaultMessage: 'Email', id: 'Email' }),
    cell: ({ cell }) => {
      const email = cell.getValue();
      return email ? email : <span className="text-muted-foreground">—</span>;
    },
  };

  const country = {
    accessorKey: 'country',
    header: intl.formatMessage({ defaultMessage: 'Country', id: 'collective.country.label' }),
    cell: ({ row }) => {
      const account = row.original;
      return (
        <span className="text-sm whitespace-nowrap">
          {account.location?.country ? (
            <React.Fragment>
              {getFlagEmoji(account.location.country)} {getCountryDisplayName(intl, account.location.country)}
            </React.Fragment>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
      );
    },
  };

  const relations = {
    accessorKey: 'relations',
    header: intl.formatMessage({ defaultMessage: 'Relations', id: 'mn5pjI' }),
    cell: ({ row }) => {
      const account = row.original;
      const relations =
        account?.communityStats?.relations?.filter(
          (relation, _, relations) => !(relation === 'EXPENSE_SUBMITTER' && relations.includes('PAYEE')),
        ) || [];
      return (
        <div className="flex gap-1 align-middle">
          {relations.map(role => (
            <div
              key={role}
              className="inline-flex items-center gap-0.5 rounded-md bg-transparent px-2 py-1 align-middle text-xs font-medium text-nowrap text-muted-foreground ring-1 ring-slate-300 ring-inset"
            >
              {formatCommunityRelation(intl, role)}
            </div>
          ))}
        </div>
      );
    },
  };

  return [account, email, country, relations];
};

enum ContributorsTab {
  ALL = 'ALL',
  ADMINS = 'ADMINS',
  CONTRIBUTORS = 'CONTRIBUTORS',
  EXPENSE_SUBMITTERS = 'EXPENSE_SUBMITTERS',
  PAYEE = 'PAYEE',
}

const PAGE_SIZE = 20;

type ContributorsProps = DashboardSectionProps;

const PeopleDashboard = ({ accountSlug }: ContributorsProps) => {
  const intl = useIntl();
  const router = useRouter();
  const pushSubpath = makePushSubpath(router);

  const views = [
    {
      id: ContributorsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'All' }),
      filter: {},
    },

    {
      id: ContributorsTab.ADMINS,
      label: intl.formatMessage({ defaultMessage: 'Collective Admins', id: 'Update.notify.hostedCollectiveAdmins' }),
      filter: { relation: [CommunityRelationType.ADMIN] },
    },
    {
      id: ContributorsTab.CONTRIBUTORS,
      label: intl.formatMessage({ defaultMessage: 'Financial Contributors', id: 'FinancialContributors' }),
      filter: { relation: [CommunityRelationType.CONTRIBUTOR, CommunityRelationType.ATTENDEE] },
    },
    {
      id: ContributorsTab.EXPENSE_SUBMITTERS,
      label: intl.formatMessage({ defaultMessage: 'Expense Submitters', id: 'ExpenseSubmitters' }),
      filter: { relation: [CommunityRelationType.EXPENSE_SUBMITTER] },
    },
    {
      id: ContributorsTab.PAYEE,
      label: intl.formatMessage({ defaultMessage: 'Payees', id: 'Payees' }),
      filter: { relation: [CommunityRelationType.PAYEE] },
    },
  ];

  const queryFilter = useQueryFilter({
    views,
    schema: z.object({
      limit: integer.default(PAGE_SIZE),
      offset: integer.default(0),
      relation: relationTypeFilter.schema,
      email: emailFilter.schema,
      account: z.string().optional(),
    }),
    toVariables: {
      email: emailFilter.toVariables,
      account: hostedAccountFilter.toVariables,
    },
    filters: {
      relation: relationTypeFilter.filter,
      email: emailFilter.filter,
      account: hostedAccountFilter.filter,
    },
    meta: { hostSlug: accountSlug },
  });

  const {
    data,
    loading: queryLoading,
    error: queryError,
  } = useQuery(peopleHostDashboardQuery, {
    variables: {
      slug: accountSlug,
      ...queryFilter.variables,
    },
    context: API_V2_CONTEXT,
  });

  const contributors = data?.community?.nodes || [];
  const loading = queryLoading;
  const error = queryError;

  const columns = React.useMemo(() => getColumns({ intl }), [intl, queryFilter.activeViewId]);

  return (
    <div className="flex max-w-screen-lg flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage id="People" defaultMessage="People" />}
        description={
          <FormattedMessage id="People.Description" defaultMessage="People that interacted with your organization." />
        }
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

const PeopleRouter = ({ accountSlug, subpath }: ContributorsProps) => {
  const router = useRouter();
  const pushSubpath = makePushSubpath(router);
  const id = subpath[0];

  if (!isEmpty(id)) {
    return (
      <ContributorDetails account={{ id: subpath[0] }} host={{ slug: accountSlug }} onClose={() => pushSubpath('')} />
    );
  }

  return <PeopleDashboard accountSlug={accountSlug} subpath={subpath} />;
};

export default PeopleRouter;
