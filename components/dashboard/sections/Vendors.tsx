import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { isEmpty, isNil, omitBy, pick, toNumber } from 'lodash';
import { Archive, MoreHorizontal, Pencil } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { HELP_MESSAGE } from '../../../lib/constants/dismissable-help-message';
import { API_V2_CONTEXT } from '../../../lib/graphql/helpers';
import { DashboardVendorsQuery } from '../../../lib/graphql/types/v2/graphql';
import { cn } from '../../../lib/utils';

import Avatar from '../../Avatar';
import Container from '../../Container';
import { DataTable } from '../../DataTable';
import DismissibleMessage from '../../DismissibleMessage';
import { Drawer } from '../../Drawer';
import { I18nWithColumn } from '../../I18nFormatters';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBox from '../../MessageBox';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import SearchBar from '../../SearchBar';
import StyledModal from '../../StyledModal';
import StyledTabs from '../../StyledTabs';
import { Button } from '../../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../ui/DropdownMenu';
import { Pagination } from '../../ui/Pagination';
import { TableActionsButton } from '../../ui/Table';
import OrganizationDetails from '../../vendors/OrganizationDetails';
import { setVendorArchiveMutation, vendorFieldFragment, VendorFieldsFragment } from '../../vendors/queries';
import VendorDetails, { VendorContactTag } from '../../vendors/VendorDetails';
import VendorForm from '../../vendors/VendorForm';
import DashboardHeader from '../DashboardHeader';

enum VendorsTab {
  ALL = 'ALL',
  ARCHIVED = 'ARCHIVED',
  POTENTIAL_VENDORS = 'POTENTIAL_VENDORS',
}

const PAGE_SIZE = 20;

const TAB_VALUES = {
  [VendorsTab.ALL]: { isArchived: false, includePotentialVendors: false },
  [VendorsTab.ARCHIVED]: { isArchived: true, includePotentialVendors: false },
  [VendorsTab.POTENTIAL_VENDORS]: { includePotentialVendors: true },
};

const dashboardVendorsQuery = gql`
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
      ... on Organization {
        host {
          id
          name
          legalName
          slug
          type
          expensePolicy
          settings
          currency
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
          vendors(searchTerm: $searchTerm, isArchived: $isArchived, limit: $limit, offset: $offset) {
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
              orders {
                totalCount
              }
              expenses(status: PAID, direction: SUBMITTED) {
                totalCount
              }
              members(role: ADMIN, includeInherited: true) {
                nodes {
                  id
                  role
                  account {
                    id
                    name
                    slug
                    type
                    imageUrl(height: 64)
                  }
                }
              }
            }
          }
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
                  {I18nWithColumn(<FormattedMessage id="Contact" defaultMessage="Contact" />)}
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
                <FormattedMessage defaultMessage="Pending tax form" />
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
                  <MoreHorizontal className="relative h-3 w-3  " aria-hidden="true" />
                </TableActionsButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem className="cursor-pointer" onClick={() => openOrg(org)}>
                  <Pencil className="mr-2" size="16" />
                  <FormattedMessage defaultMessage="See Details" />
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

const pickQueryFilters = query =>
  omitBy(
    {
      searchTerm: query.searchTerm,
      offset: toNumber(query.offset || 0),
    },
    isNil,
  );

const Vendors = ({ accountSlug }) => {
  const router = useRouter();
  const intl = useIntl();
  const [tab, setTab] = React.useState<VendorsTab>(VendorsTab.ALL);
  const queryValues = pickQueryFilters(router.query);
  const tabValues = TAB_VALUES[tab];
  const {
    data,
    previousData,
    refetch,
    loading: queryLoading,
    error: queryError,
  } = useQuery<DashboardVendorsQuery>(dashboardVendorsQuery, {
    variables: {
      slug: accountSlug,
      limit: PAGE_SIZE,
      ...tabValues,
      ...queryValues,
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
  const updateFilters = props =>
    router.replace({
      pathname: router.asPath.split('?')[0],
      query: pickQueryFilters({ ...router.query, ...props }),
    });
  const handleTabUpdate = tab => {
    setTab(tab);
    updateFilters({ offset: null });
  };

  const host = (data || previousData)?.account?.['host'];
  const tabs = [
    {
      id: VendorsTab.ALL,
      label: 'All',
    },
    {
      id: VendorsTab.ARCHIVED,
      label: 'Archived',
    },
    {
      id: VendorsTab.POTENTIAL_VENDORS,
      label: 'Potential vendors',
    },
  ];
  const pages = Math.ceil((host?.vendors?.totalCount || 1) / PAGE_SIZE);
  const currentPage = toNumber((queryValues.offset || 0) + PAGE_SIZE) / PAGE_SIZE;
  const isDrawerOpen = Boolean(vendorDetail || createEditVendor?.['id'] || orgDetail);
  const loading = queryLoading;
  const error = queryError;

  return (
    <Container>
      <DashboardHeader
        title={<FormattedMessage defaultMessage="Vendors" />}
        description={
          <FormattedMessage
            id="Vendors.Description"
            defaultMessage="Manage all the external organizations acting as vendors for the Collectives you host."
          />
        }
      />

      <div className="mt-2 flex flex-grow flex-row gap-4">
        <SearchBar
          placeholder={intl.formatMessage({ defaultMessage: 'Search...', id: 'search.placeholder' })}
          defaultValue={router.query.searchTerm}
          height="40px"
          onSubmit={searchTerm => updateFilters({ searchTerm, offset: null })}
          className="flex-grow"
        />
        <Button className="rounded-full" onClick={() => setCreateEditVendor(true)}>
          + <FormattedMessage defaultMessage="Create vendor" />
        </Button>
      </div>
      <div className="my-6">
        <StyledTabs tabs={tabs} selectedId={tab} onChange={handleTabUpdate} />
      </div>
      {tab === VendorsTab.POTENTIAL_VENDORS && (
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
                  <FormattedMessage defaultMessage="Ok, don't show me this again" />
                </Button>
              </p>
            </MessageBox>
          )}
        </DismissibleMessage>
      )}
      <div className="flex flex-col gap-4">
        {error && <MessageBoxGraphqlError error={error} />}
        {loading && <LoadingPlaceholder height="250px" width="100%" borderRadius="16px" />}
        {!error &&
          !loading &&
          (tab === VendorsTab.POTENTIAL_VENDORS ? (
            <OrgsTable orgs={host?.['potentialVendors']?.nodes || []} loading={loading} openOrg={setOrgDetail} />
          ) : (
            <VendorsTable
              vendors={host?.['vendors']?.nodes}
              loading={loading}
              editVendor={setCreateEditVendor}
              openVendor={setVendorDetail}
              handleSetArchive={handleSetArchive}
            />
          ))}

        {tab !== VendorsTab.POTENTIAL_VENDORS && (
          <Pagination
            totalPages={pages}
            page={currentPage}
            onChange={page => updateFilters({ offset: (page - 1) * PAGE_SIZE })}
          />
        )}
      </div>

      {createEditVendor === true && (
        <StyledModal onClose={closeDrawer} width="570px">
          <VendorForm
            host={host}
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
        className={cn((vendorDetail || orgDetail) && 'max-w-2xl')}
        showActionsContainer
        showCloseButton
      >
        {createEditVendor && (
          <VendorForm
            host={host}
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
            vendor={vendorDetail}
            editVendor={() => {
              setCreateEditVendor(vendorDetail);
              setVendorDetail(null);
            }}
            onCancel={() => setVendorDetail(null)}
          />
        )}
      </Drawer>
    </Container>
  );
};

export default Vendors;
