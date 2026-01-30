import React, { useContext } from 'react';
import { useQuery } from '@apollo/client';
import { isEmpty } from 'lodash';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import type { FilterConfig } from '@/lib/filters/filter-types';
import { integer, isMulti } from '@/lib/filters/schemas';
import { AccountType, CommunityRelationType, type Contributor } from '@/lib/graphql/types/v2/schema';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';
import { getCountryDisplayName, getFlagEmoji } from '@/lib/i18n/countries';
import { sortSelectOptions } from '@/lib/utils';

import { IndividualKYCStatus } from '@/components/kyc/IndividualKYCStatus';

import Avatar from '../../../Avatar';
import { CopyID } from '../../../CopyId';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { actionsColumn, DataTable } from '../../../table/DataTable';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { EmptyResults } from '../../EmptyResults';
import { makeAmountFilter } from '../../filters/AmountFilter';
import ComboSelectFilter from '../../filters/ComboSelectFilter';
import { Filterbar } from '../../filters/Filterbar';
import { hostedAccountFilter } from '../../filters/HostedAccountFilter';
import { Pagination } from '../../filters/Pagination';
import { searchFilter } from '../../filters/SearchFilter';
import type { DashboardSectionProps } from '../../types';
import { makePushSubpath } from '../../utils';

import { ContributorDetails } from './AccountDetail';
import { usePersonActions } from './common';
import { peopleHostDashboardQuery } from './queries';

const totalContributedFilter = makeAmountFilter(
  'totalContributed',
  defineMessage({ defaultMessage: 'Total Contributed', id: 'TotalContributed' }),
);

const totalExpendedFilter = makeAmountFilter(
  'totalExpended',
  defineMessage({ defaultMessage: 'Total Expended', id: 'TotalExpended' }),
);

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

const getColumns = ({ intl, hasKYCFeature }) => {
  const account = {
    accessorKey: 'account',
    header: intl.formatMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
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
    header: intl.formatMessage({ defaultMessage: 'Email', id: 'Email' }),
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
          <CopyID
            value={email}
            tooltipLabel={intl.formatMessage({ defaultMessage: 'Copy to clipboard', id: 'Clipboard.Copy' })}
            className="shrink-0"
            stopEventPropagation
            toastOnCopy
          />
        </div>
      ) : (
        <span className="text-muted-foreground">—</span>
      );
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
    header: intl.formatMessage({ defaultMessage: 'Roles', id: 'c35gM5' }),
    cell: ({ row }) => {
      const account = row.original;
      const relations =
        account?.communityStats?.relations?.filter(
          (relation, _, relations) => !(relation === 'EXPENSE_SUBMITTER' && relations.includes('PAYEE')),
        ) || [];
      return (
        <div className="flex flex-wrap gap-1 align-middle">
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

  const expenses = {
    accessorKey: 'expenses',
    header: intl.formatMessage({ defaultMessage: 'Total Expenses', id: 'TotalExpenses' }),
    cell: ({ row }) => {
      const account = row.original;
      const summary = account?.communityStats?.transactionSummary?.[0];
      const total = summary?.expenseTotalAcc;
      const count = summary?.expenseCountAcc || 0;

      if (!total || count === 0) {
        return <span className="text-muted-foreground">—</span>;
      }

      return (
        <div className="text-sm">
          <FormattedMoneyAmount
            amount={Math.abs(total.valueInCents)}
            currency={total.currency}
            showCurrencyCode={false}
          />
          <span className="ml-1 text-muted-foreground">({count})</span>
        </div>
      );
    },
  };

  const contributions = {
    accessorKey: 'contributions',
    header: intl.formatMessage({ defaultMessage: 'Total Contributions', id: 'TotalContributions' }),
    cell: ({ row }) => {
      const account = row.original;
      const summary = account?.communityStats?.transactionSummary?.[0];
      const total = summary?.contributionTotalAcc;
      const count = summary?.contributionCountAcc || 0;

      if (!total || count === 0) {
        return <span className="text-muted-foreground">—</span>;
      }

      return (
        <div className="text-sm">
          <FormattedMoneyAmount
            amount={Math.abs(total.valueInCents)}
            currency={total.currency}
            showCurrencyCode={false}
          />
          <span className="ml-1 text-muted-foreground">({count})</span>
        </div>
      );
    },
  };

  let kycColumn = null;
  if (hasKYCFeature) {
    kycColumn = {
      accessorKey: 'kycStatus',
      header: 'KYC',
      cell: ({ row }) => {
        return <IndividualKYCStatus kycStatus={row.original.kycStatus} />;
      },
    };
  }

  return [account, email, kycColumn, country, relations, expenses, contributions, actionsColumn].filter(Boolean);
};

enum ContributorsTab {
  ALL = 'ALL',
  ADMINS = 'ADMINS',
  CONTRIBUTORS = 'CONTRIBUTORS',
  EXPENSE_SUBMITTERS = 'EXPENSE_SUBMITTERS',
  PAYEE = 'PAYEE',
}

const PAGE_SIZE = 20;

const schema = z.object({
  limit: integer.default(PAGE_SIZE),
  offset: integer.default(0),
  relation: relationTypeFilter.schema,
  searchTerm: searchFilter.schema,
  account: z.string().optional(),
  totalContributed: totalContributedFilter.schema,
  totalExpended: totalExpendedFilter.schema,
});
const toVariables = {
  account: hostedAccountFilter.toVariables,
  totalContributed: totalContributedFilter.toVariables,
  totalExpended: totalExpendedFilter.toVariables,
};
const filters = {
  relation: relationTypeFilter.filter,
  searchTerm: searchFilter.filter,
  account: hostedAccountFilter.filter,
  totalContributed: totalContributedFilter.filter,
  totalExpended: totalExpendedFilter.filter,
};

type ContributorsProps = DashboardSectionProps;

const PeopleDashboard = ({ accountSlug }: ContributorsProps) => {
  const intl = useIntl();
  const router = useRouter();
  const { account } = useContext(DashboardContext);
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
    schema,
    toVariables,
    filters,
    meta: { hostSlug: accountSlug, currency: account?.currency },
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
  });

  const contributors = data?.community?.nodes || [];
  const loading = queryLoading;
  const error = queryError;

  const { account: dashboardAccount } = useContext(DashboardContext);

  const hasKYCFeature = isFeatureEnabled(dashboardAccount, FEATURES.KYC);

  const getActions = usePersonActions({ accountSlug, hasKYCFeature });

  const columns = React.useMemo(
    () => getColumns({ intl, hasKYCFeature }),
    [intl, queryFilter.activeViewId, hasKYCFeature],
  );

  return (
    <div className="flex flex-col gap-4">
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
            getActions={getActions}
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
  const { account } = useContext(DashboardContext);

  if (!isEmpty(id)) {
    return (
      <div className="h-full">
        <ContributorDetails
          account={{ id: subpath[0] }}
          host={account}
          onClose={() => pushSubpath('')}
          expectedAccountType={AccountType.INDIVIDUAL}
        />
      </div>
    );
  }

  return <PeopleDashboard accountSlug={accountSlug} subpath={subpath} />;
};

export default PeopleRouter;
