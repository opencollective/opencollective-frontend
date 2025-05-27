import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { isEmpty, pick } from 'lodash';
import { Archive, MoreHorizontal, Pencil, PlusIcon } from 'lucide-react';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { HELP_MESSAGE } from '../../../lib/constants/dismissable-help-message';
import type { FilterComponentConfigs, Views } from '../../../lib/filters/filter-types';
import { boolean, limit, offset } from '../../../lib/filters/schemas';
import { API_V2_CONTEXT, gql } from '../../../lib/graphql/helpers';
import type { DashboardVendorsQuery } from '../../../lib/graphql/types/v2/graphql';
import useQueryFilter from '../../../lib/hooks/useQueryFilter';

import Avatar from '../../Avatar';
import DismissibleMessage from '../../DismissibleMessage';
import { Drawer } from '../../Drawer';
import { i18nWithColon } from '../../I18nFormatters';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import StyledModal from '../../StyledModal';
import { DataTable } from '../../table/DataTable';
import { Button } from '../../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/DropdownMenu';
import { TableActionsButton } from '../../ui/Table';
import OrganizationDetails from '../../vendors/OrganizationDetails';
import type { VendorFieldsFragment } from '../../vendors/queries';
import { setVendorArchiveMutation, vendorFieldFragment } from '../../vendors/queries';
import VendorDetails, { VendorContactTag } from '../../vendors/VendorDetails';
import VendorForm from '../../vendors/VendorForm';
import DashboardHeader from '../DashboardHeader';
import { EmptyResults } from '../EmptyResults';
import { Filterbar } from '../filters/Filterbar';
import { Pagination } from '../filters/Pagination';
import { searchFilter } from '../filters/SearchFilter';
import type { DashboardSectionProps } from '../types';

enum VendorsTab {
  ALL = 'ALL',
  ARCHIVED = 'ARCHIVED',
  POTENTIAL_VENDORS = 'POTENTIAL_VENDORS',
}

const dashboardVendorsQuery = gql`
  fragment HostFields on Host {
    id
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
    vendors(searchTerm: $searchTerm, isArchived: $isArchived, limit: $limit, offset: $offset)
      @skip(if: $includePotentialVendors) {
      totalCount
      offset
      limit
      nodes {
        id
        ...VendorFields
      }
    }
    potentialVendors @include(if: $includePotentialVendors) {
      nodes {
        id
        slug
        name
        type
        description
        tags
        imageUrl(height: 96)
        isArchived
        createdAt
      }
    }
  }

  query DashboardVendors(
    $slug: String!
    $searchTerm: String
    $isArchived: Boolean
    $includePotentialVendors: Boolean!
    $limit: Int
    $offset: Int
  ) {
    account(slug: $slug) {
      id
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
  }
  ${vendorFieldFragment}
`;

const VendorsTable = ({ vendors, loading, editVendor, openVendor, handleSetArchive }) => {
  const columns = [
    {
      accessorKey: 'vendor',
      cell: ({ row }) => {
        const vendor = row.original;
        const contact = vendor.vendorInfo?.contact;
        return (
          <div className="flex items-center">
            <button className="flex cursor-pointer items-center" onClick={() => openVendor(vendor)}>
              <Avatar collective={vendor} radius={32} className="mr-4" />
              {vendor.name}
            </button>
            {contact && (
              <VendorContactTag className="ml-3">
                <span className="font-normal">
                  {i18nWithColon(<FormattedMessage id="Contact" defaultMessage="Contact" />)}
                </span>
                <a href={`mailto:${contact.email}`}>{contact.name}</a>
              </VendorContactTag>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'actions',
      meta: { className: 'flex justify-end items-center' },
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="row flex">
            {vendor.vendorInfo?.taxFormRequired && isEmpty(vendor.vendorInfo?.taxFormUrl) && (
              <span className="mr-2 rounded-sm bg-yellow-300 px-2 py-1 text-xs font-bold text-slate-800">
                <FormattedMessage defaultMessage="Pending tax form" id="P6R0T+" />
              </span>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TableActionsButton>
                  <MoreHorizontal className="relative h-3 w-3" aria-hidden="true" />
                </TableActionsButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="cursor-pointer" onClick={() => editVendor(vendor)}>
                  <Pencil className="mr-2" size="16" />
                  <FormattedMessage id="Edit" defaultMessage="Edit" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => handleSetArchive(vendor)}>
                  <Archive className="mr-2" size="16" />
                  {vendor.isArchived ? (
                    <FormattedMessage id="collective.unarchive.confirm.btn" defaultMessage="Unarchive" />
                  ) : (
                    <FormattedMessage id="collective.archive.confirm.btn" defaultMessage="Archive" />
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
  return (
    <DataTable
      columns={columns}
      data={vendors}
      emptyMessage={() => <FormattedMessage id="NoVendors" defaultMessage="No vendors" />}
      loading={loading}
      mobileTableView
      hideHeader
    />
  );
};

const OrgsTable = ({ orgs, loading, openOrg }) => {
  const columns = [
    {
      accessorKey: 'vendor',
      cell: ({ row }) => {
        const org = row.original;
        return (
          <div className="flex items-center">
            <button className="flex cursor-pointer items-center" onClick={() => openOrg(org)}>
              <Avatar collective={org} radius={32} className="mr-4" />
              {org.name}
            </button>
          </div>
        );
      },
    },
    {
      accessorKey: 'actions',
      meta: { className: 'flex justify-end' },
      cell: ({ row }) => {
        const org = row.original;
        return (
          <div className="row flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <TableActionsButton>
                  <MoreHorizontal className="relative h-3 w-3" aria-hidden="true" />
                </TableActionsButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="cursor-pointer" onClick={() => openOrg(org)}>
                  <Pencil className="mr-2" size="16" />
                  <FormattedMessage defaultMessage="See Details" id="LYgmWx" />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];
  return (
    <DataTable
      columns={columns}
      data={orgs}
      emptyMessage={() => <FormattedMessage id="NoPotentialVendors" defaultMessage="No potential vendors found" />}
      loading={loading}
      mobileTableView
      hideHeader
    />
  );
};
const PAGE_SIZE = 20;

const schema = z.object({
  limit: limit.default(PAGE_SIZE),
  offset,
  searchTerm: searchFilter.schema,
  isArchived: boolean.optional().default(false),
  includePotentialVendors: boolean.optional().default(false),
});

type FilterValues = z.infer<typeof schema>;

const filters: FilterComponentConfigs<FilterValues> = {
  searchTerm: searchFilter.filter,
  isArchived: {
    labelMsg: defineMessage({ defaultMessage: 'Archived', id: '0HT+Ib' }),
  },
  includePotentialVendors: {
    labelMsg: defineMessage({ defaultMessage: 'Include potential vendors', id: '4u4DgT' }),
  },
};

const Vendors = ({ accountSlug }: DashboardSectionProps) => {
  const intl = useIntl();
  const views: Views<FilterValues> = [
    {
      id: VendorsTab.ALL,
      label: intl.formatMessage({ defaultMessage: 'All', id: 'zQvVDJ' }),
      filter: {},
    },
    {
      id: VendorsTab.ARCHIVED,
      label: intl.formatMessage({ defaultMessage: 'Archived', id: '0HT+Ib' }),
      filter: {
        isArchived: true,
      },
    },
    {
      id: VendorsTab.POTENTIAL_VENDORS,
      label: intl.formatMessage({ defaultMessage: 'Potential vendors', id: 'I5Wgky' }),
      filter: {
        includePotentialVendors: true,
      },
    },
  ];
  const queryFilter = useQueryFilter({
    filters,
    schema,
    views,
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
    context: API_V2_CONTEXT,
  });

  const [archiveVendor] = useMutation(setVendorArchiveMutation, {
    context: API_V2_CONTEXT,
    refetchQueries: ['DashboardVendors'],
    awaitRefetchQueries: true,
  });
  const [createEditVendor, setCreateEditVendor] = React.useState<VendorFieldsFragment | boolean>(false);
  const [vendorDetail, setVendorDetail] = React.useState(null);
  const [orgDetail, setOrgDetail] = React.useState(null);

  const closeDrawer = () => {
    setCreateEditVendor(false);
    setVendorDetail(null);
    setOrgDetail(null);
  };
  const handleSetArchive = async vendor =>
    archiveVendor({ variables: { vendor: pick(vendor, ['id']), archive: !vendor.isArchived } });

  const host = (data || previousData)?.account?.['host'];

  const isDrawerOpen = Boolean(vendorDetail || createEditVendor?.['id'] || orgDetail);
  const loading = queryLoading;
  const error = queryError;

  return (
    <div className="flex max-w-(--breakpoint-lg) flex-col gap-4">
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Vendors" id="RilevA" />}
        description={
          <FormattedMessage
            id="Vendors.Description"
            defaultMessage="Manage all the external organizations acting as vendors for the Collectives you host."
          />
        }
        actions={
          <Button size="sm" className="gap-1" onClick={() => setCreateEditVendor(true)}>
            <span>
              <FormattedMessage defaultMessage="Create vendor" id="jrCJwo" />
            </span>
            <PlusIcon size={20} />
          </Button>
        }
      />
      <Filterbar {...queryFilter} />

      {queryFilter.activeViewId === VendorsTab.POTENTIAL_VENDORS && (
        <DismissibleMessage messageId={HELP_MESSAGE.POTENTIAL_VENDORS}>
          {({ dismiss }) => (
            <MessageBox type="info" className="mb-6">
              <p>
                <FormattedMessage
                  id="PotentialVendors.Description"
                  defaultMessage="These are organizations you've had activity with; either by sending them money or by receiving contributions from them. You can transform these organizations into vendors to have a better management of this activity."
                />
              </p>
              <p className="mt-3">
                <Button variant="link" className="h-fit p-0 text-xs" onClick={dismiss}>
                  <FormattedMessage defaultMessage="Ok, don't show me this again" id="ggjoaY" />
                </Button>
              </p>
            </MessageBox>
          )}
        </DismissibleMessage>
      )}
      <div className="flex flex-col gap-4">
        {error ? (
          <MessageBoxGraphqlError error={error} />
        ) : !loading &&
          ((queryFilter.activeViewId === VendorsTab.POTENTIAL_VENDORS &&
            host?.['potentialVendors']?.nodes?.length === 0) ||
            host?.['vendors']?.nodes.length === 0) ? (
          <EmptyResults hasFilters={queryFilter.hasFilters} onResetFilters={() => queryFilter.resetFilters({})} />
        ) : queryFilter.activeViewId === VendorsTab.POTENTIAL_VENDORS ? (
          <OrgsTable orgs={host?.['potentialVendors']?.nodes || []} loading={loading} openOrg={setOrgDetail} />
        ) : (
          <React.Fragment>
            <VendorsTable
              vendors={host?.['vendors']?.nodes}
              loading={loading}
              editVendor={setCreateEditVendor}
              openVendor={setVendorDetail}
              handleSetArchive={handleSetArchive}
            />
            <Pagination queryFilter={queryFilter} total={host?.vendors?.totalCount} />
          </React.Fragment>
        )}
      </div>

      {createEditVendor === true && (
        <StyledModal onClose={closeDrawer}>
          <VendorForm
            host={host}
            supportsTaxForm={host.requiredLegalDocuments.includes('US_TAX_FORM')}
            onSuccess={() => {
              setCreateEditVendor(false);
              refetch();
            }}
            onCancel={() => setCreateEditVendor(false)}
            isModal
          />
        </StyledModal>
      )}
      <Drawer
        open={isDrawerOpen}
        onClose={closeDrawer}
        className={vendorDetail || orgDetail ? 'max-w-2xl' : 'max-w-xl'}
        showActionsContainer
        showCloseButton
      >
        {createEditVendor && (
          <VendorForm
            host={host}
            supportsTaxForm={host.requiredLegalDocuments.includes('US_TAX_FORM')}
            vendor={typeof createEditVendor === 'boolean' ? undefined : createEditVendor}
            onSuccess={() => {
              setCreateEditVendor(false);
              refetch();
            }}
            onCancel={() => setCreateEditVendor(false)}
          />
        )}
        {orgDetail && (
          <OrganizationDetails
            host={host}
            organization={orgDetail}
            onCancel={() => setOrgDetail(false)}
            editVendor={vendor => {
              setCreateEditVendor(vendor);
              refetch();
              setOrgDetail(false);
            }}
          />
        )}

        {vendorDetail && (
          <VendorDetails
            host={host}
            vendor={vendorDetail}
            editVendor={() => {
              setCreateEditVendor(vendorDetail);
              setVendorDetail(null);
            }}
            onCancel={() => setVendorDetail(null)}
          />
        )}
      </Drawer>
    </div>
  );
};

export default Vendors;
