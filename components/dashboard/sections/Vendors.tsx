import React, { useContext } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { compact, isEmpty, pick } from 'lodash';
import { PlusIcon } from 'lucide-react';
import { useRouter } from 'next/router';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import type { FilterComponentConfigs, Views } from '@/lib/filters/filter-types';
import { boolean, limit, offset } from '@/lib/filters/schemas';
import { gql } from '@/lib/graphql/helpers';
import type { DashboardVendorsQuery, DashboardVendorsQueryVariables } from '@/lib/graphql/types/v2/graphql';
import { AccountType } from '@/lib/graphql/types/v2/schema';
import useQueryFilter from '@/lib/hooks/useQueryFilter';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import StackedAvatars from '@/components/StackedAvatars';
import { Skeleton } from '@/components/ui/Skeleton';

import Avatar from '../../Avatar';
import { i18nWithColon } from '../../I18nFormatters';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import StyledModal from '../../StyledModal';
import { actionsColumn, DataTable } from '../../table/DataTable';
import { Button } from '../../ui/Button';
import { VendorContactTag } from '../../vendors/common';
import type { VendorFieldsFragment } from '../../vendors/queries';
import { setVendorArchiveMutation, vendorFieldsFragment } from '../../vendors/queries';
import VendorForm from '../../vendors/VendorForm';
import { DashboardContext } from '../DashboardContext';
import DashboardHeader from '../DashboardHeader';
import { makeAmountFilter } from '../filters/AmountFilter';
import { Filterbar } from '../filters/Filterbar';
import { Pagination } from '../filters/Pagination';
import { searchFilter } from '../filters/SearchFilter';
import type { DashboardSectionProps } from '../types';
import { makePushSubpath } from '../utils';

import { ContributorDetails } from './community/AccountDetail';
import { usePersonActions } from './community/common';

enum VendorsTab {
  ALL = 'ALL',
  VENDORS = 'VENDORS',
  ORGANIZATIONS = 'ORGANIZATIONS',
  ARCHIVED_VENDORS = 'ARCHIVED_VENDORS',
}

const dashboardVendorsQuery = gql`
  fragment HostFields on Host {
    id
    legacyId
    name
    legalName
    slug
    type
    expensePolicy
    settings
    currency
    requiredLegalDocuments
    features {
      id
      MULTI_CURRENCY_EXPENSES
    }
    location {
      id
      address
      country
    }
    transferwise {
      id
      availableCurrencies
    }
    supportedPayoutMethods
    isTrustedHost
    vendors(
      searchTerm: $searchTerm
      isArchived: $isArchived
      limit: $limit
      offset: $offset
      totalContributed: $totalContributed
      totalExpended: $totalExpended
    ) @include(if: $onlyVendors) {
      totalCount
      offset
      limit
      nodes {
        id
        ...VendorFields
        communityStats(host: { slug: $slug }) {
          relations
          transactionSummary {
            year
            expenseTotalAcc {
              valueInCents
              currency
            }
            expenseCountAcc
            contributionTotalAcc {
              valueInCents
              currency
            }
            contributionCountAcc
          }
        }
      }
    }
  }

  query DashboardVendors(
    $slug: String!
    $searchTerm: String
    $isArchived: Boolean
    $limit: Int
    $offset: Int
    $totalContributed: AmountRangeInput
    $totalExpended: AmountRangeInput
    $onlyVendors: Boolean!
  ) {
    account(slug: $slug) {
      id
      legacyId
      ... on AccountWithHost {
        host {
          id
          ...HostFields
        }
      }
      ... on Organization {
        host {
          id
          ...HostFields
        }
      }
    }
    community(
      host: { slug: $slug }
      type: [ORGANIZATION]
      searchTerm: $searchTerm
      totalContributed: $totalContributed
      totalExpended: $totalExpended
      limit: $limit
      offset: $offset
    ) @skip(if: $onlyVendors) {
      totalCount
      offset
      limit
      nodes {
        id
        legacyId
        slug
        name
        legalName
        type
        imageUrl
        communityStats(host: { slug: $slug }) {
          relations
          transactionSummary {
            year
            expenseTotalAcc {
              valueInCents
              currency
            }
            expenseCountAcc
            contributionTotalAcc {
              valueInCents
              currency
            }
            contributionCountAcc
          }
        }
      }
    }
  }
  ${vendorFieldsFragment}
`;

const getColumns = ({ isVendor }) => {
  return [
    {
      header: () => <FormattedMessage defaultMessage="Vendor" id="dU1t5Z" />,
      accessorKey: 'vendor',
      cell: ({ row }) => {
        const vendor = row.original;
        const contact = vendor.vendorInfo?.contact;
        return (
          <div className="flex items-center">
            <Avatar collective={vendor} size={24} className="mr-2" />
            {vendor.name}
            {contact && (
              <VendorContactTag className="ml-3">
                <span className="font-normal">
                  {i18nWithColon(<FormattedMessage id="Contact" defaultMessage="Contact" />)}
                </span>
                <a href={`mailto:${contact.email}`}>{contact.name}</a>
              </VendorContactTag>
            )}
            {vendor.vendorInfo?.taxFormRequired && isEmpty(vendor.vendorInfo?.taxFormUrl) && (
              <span className="mr-2 rounded-sm bg-yellow-300 px-2 py-1 text-xs font-bold text-slate-800">
                <FormattedMessage defaultMessage="Pending tax form" id="P6R0T+" />
              </span>
            )}
          </div>
        );
      },
    },
    isVendor && {
      header: () => <FormattedMessage defaultMessage="Visible to" id="zJePa1" />,
      accessorKey: 'visibleToAccounts',
      cell: ({ cell }) => {
        const visibleToAccounts = cell.getValue();

        if (!visibleToAccounts?.length) {
          return (
            <span className="text-muted-foreground">
              <FormattedMessage defaultMessage="All hosted accounts" id="M7USSD" />
            </span>
          );
        }

        return (
          <StackedAvatars
            accounts={visibleToAccounts}
            imageSize={24}
            withHoverCard={{ includeAdminMembership: true }}
          />
        );
      },
    },
    {
      accessorKey: 'relations',
      header: () => <FormattedMessage defaultMessage="Roles" id="c35gM5" />,
      cell: ({ row, table }) => {
        const { intl } = table.options.meta;
        const account = row.original;
        const relations = compact([
          account.type === 'VENDOR' && 'VENDOR',
          ...(account.communityStats?.relations || []),
        ]).filter((relation, _, relations) => !(relation === 'EXPENSE_SUBMITTER' && relations.includes('PAYEE')));
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
    },
    {
      accessorKey: 'expenses',
      header: () => <FormattedMessage defaultMessage="Total Expenses" id="TotalExpenses" />,
      cell: ({ row }) => {
        const account = row.original;
        const summary = account.communityStats?.transactionSummary?.[0];
        const total = summary?.expenseTotalAcc;
        const count = summary?.expenseCountAcc || 0;

        if (!total || count === 0) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <div className="text-sm">
            <FormattedMoneyAmount amount={Math.abs(total.valueInCents)} currency={total.currency} />
            <span className="ml-1 text-muted-foreground">({count})</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'contributions',
      header: () => <FormattedMessage defaultMessage="Total Contributions" id="TotalContributions" />,
      cell: ({ row }) => {
        const account = row.original;
        const summary = account.communityStats?.transactionSummary?.[0];
        const total = summary?.contributionTotalAcc;
        const count = summary?.contributionCountAcc || 0;

        if (!total || count === 0) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <div className="text-sm">
            <FormattedMoneyAmount amount={Math.abs(total.valueInCents)} currency={total.currency} />
            <span className="ml-1 text-muted-foreground">({count})</span>
          </div>
        );
      },
    },
    actionsColumn,
  ].filter(Boolean);
};

const PAGE_SIZE = 20;

const totalContributed = makeAmountFilter(
  'totalContributed',
  defineMessage({ defaultMessage: 'Total Contributed', id: 'TotalContributed' }),
);

const totalExpended = makeAmountFilter(
  'totalExpended',
  defineMessage({ defaultMessage: 'Total Expended', id: 'TotalExpended' }),
);

const schema = z.object({
  limit: limit.default(PAGE_SIZE),
  offset,
  searchTerm: searchFilter.schema,
  isArchived: boolean.optional().default(false),
  onlyVendors: boolean.optional().default(false),
  totalContributed: totalContributed.schema,
  totalExpended: totalExpended.schema,
});

type FilterValues = z.infer<typeof schema>;

const filters: FilterComponentConfigs<FilterValues> = {
  searchTerm: searchFilter.filter,
  totalContributed: totalContributed.filter,
  totalExpended: totalExpended.filter,
  isArchived: {
    labelMsg: defineMessage({ defaultMessage: 'Archived', id: '0HT+Ib' }),
    hide: () => true,
  },
  onlyVendors: {
    labelMsg: defineMessage({ defaultMessage: 'Only Vendors', id: 'onlyVendors' }),
    hide: () => true,
  },
};

const toVariables = {
  totalContributed: totalContributed.toVariables,
  totalExpended: totalExpended.toVariables,
};

const Vendors = ({ accountSlug, subpath }: DashboardSectionProps) => {
  const intl = useIntl();
  const router = useRouter();
  const id = React.useMemo(() => subpath[0], [subpath]);
  const { account } = useContext(DashboardContext);
  const [createEditVendor, setCreateEditVendor] = React.useState<VendorFieldsFragment | boolean>(false);
  const views: Views<FilterValues> = [
    {
      id: VendorsTab.VENDORS,
      label: intl.formatMessage({ defaultMessage: 'Managed Vendors', id: '0bs5AI' }),
      filter: {
        onlyVendors: true,
      },
    },
    {
      id: VendorsTab.ORGANIZATIONS,
      label: intl.formatMessage({ defaultMessage: 'Platform Organizations', id: 'nwgM4C' }),
      filter: {
        onlyVendors: false,
      },
    },
    {
      id: VendorsTab.ARCHIVED_VENDORS,
      label: intl.formatMessage({ defaultMessage: 'Archived Vendors', id: 'archivedVendors' }),
      filter: {
        onlyVendors: true,
        isArchived: true,
      },
    },
  ];
  const queryFilter = useQueryFilter<typeof schema, DashboardVendorsQueryVariables>({
    filters,
    schema,
    views,
    toVariables,
    meta: {
      intl,
      currency: account?.currency,
    },
  });
  const {
    data,
    previousData,
    refetch,
    loading: queryLoading,
    error: queryError,
  } = useQuery<DashboardVendorsQuery>(dashboardVendorsQuery, {
    variables: {
      slug: accountSlug,
      ...queryFilter.variables,
    },
    fetchPolicy: 'cache-and-network',
  });

  const pushSubpath = React.useMemo(() => makePushSubpath(router), [router]);
  const [archiveVendor] = useMutation(setVendorArchiveMutation);
  const handleArchiveToggle = React.useCallback(
    async vendor => {
      await archiveVendor({
        variables: { vendor: pick(vendor, ['id']), archive: !vendor.isArchived },
        refetchQueries: ['CommunityAccountDetail', 'DashboardVendors'],
      });
      await refetch();
    },
    [archiveVendor, refetch],
  );
  const handleDrawer = (vendor: VendorFieldsFragment | string | undefined) => {
    if (vendor) {
      pushSubpath(typeof vendor === 'string' ? vendor : vendor.id);
    } else {
      pushSubpath(undefined);
      setCreateEditVendor(false);
    }
  };
  const getActions = usePersonActions({
    accountSlug,
    hasKYCFeature: false,
    editVendor: setCreateEditVendor,
    archiveVendor: handleArchiveToggle,
  });

  const expectedAccountType = React.useMemo(
    () => (queryFilter.variables?.onlyVendors ? AccountType.VENDOR : AccountType.ORGANIZATION),
    [queryFilter.variables],
  );
  const columns = React.useMemo(
    () => getColumns({ isVendor: expectedAccountType === AccountType.VENDOR }),
    [expectedAccountType],
  );
  const tableData = React.useMemo(
    () =>
      expectedAccountType === AccountType.VENDOR
        ? (data || previousData)?.account?.['host']?.['vendors']
        : (data || previousData)?.community,
    [expectedAccountType, data, previousData],
  );
  const host = (data || previousData)?.account?.['host'];
  const loading = queryLoading;
  const error = queryError;

  if (!isEmpty(id)) {
    return (
      <div className="h-full">
        <ContributorDetails
          account={{ id: subpath[0] }}
          host={account}
          onClose={() => pushSubpath('')}
          expectedAccountType={expectedAccountType}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Vendors" id="RilevA" />}
        description={
          <FormattedMessage
            id="VendorsAndOrganizations.Description"
            defaultMessage="Manage all the external organizations you work with as vendors and quickly surface all the activity between your hosted Collectives and other platform Organizations."
          />
        }
        actions={
          !host ? (
            <Skeleton className="h-10 w-32" />
          ) : (
            <Button size="sm" className="gap-1" onClick={() => setCreateEditVendor(true)}>
              <span>
                <FormattedMessage defaultMessage="Create vendor" id="jrCJwo" />
              </span>
              <PlusIcon size={20} />
            </Button>
          )
        }
      />
      <Filterbar {...queryFilter} />
      {error ? (
        <MessageBoxGraphqlError error={error} />
      ) : (
        <React.Fragment>
          <DataTable
            columns={columns}
            data={tableData?.nodes}
            emptyMessage={() => <FormattedMessage id="NoVendors" defaultMessage="No vendors" />}
            loading={loading}
            onClickRow={row => {
              handleDrawer(row.original as unknown as VendorFieldsFragment);
            }}
            getActions={getActions}
            mobileTableView
          />
          <Pagination queryFilter={queryFilter} total={tableData?.totalCount} />
        </React.Fragment>
      )}
      {createEditVendor && (
        <StyledModal onClose={() => setCreateEditVendor(false)}>
          <VendorForm
            host={host}
            supportsTaxForm={host.requiredLegalDocuments.includes('US_TAX_FORM')}
            onSuccess={() => {
              setCreateEditVendor(false);
              refetch();
            }}
            vendor={typeof createEditVendor === 'boolean' ? undefined : createEditVendor}
            onCancel={() => setCreateEditVendor(false)}
            isModal
          />
        </StyledModal>
      )}
    </div>
  );
};

export default Vendors;
