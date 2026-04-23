import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { pick } from 'lodash';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import { CollectiveType } from '@/lib/constants/collectives';
import { i18nGraphqlException } from '@/lib/errors';
import { gql } from '@/lib/graphql/helpers';
import type {
  AccountReferenceInput,
  CommunityAccountDetailQuery,
  VendorFieldsFragment,
} from '@/lib/graphql/types/v2/graphql';
import { AccountType, LegalDocumentType } from '@/lib/graphql/types/v2/graphql';
import formatCollectiveType from '@/lib/i18n/collective-type';

import { ContributionDrawer } from '@/components/contributions/ContributionDrawer';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import { KYCTabPeopleDashboard } from '@/components/kyc/dashboard/KYCTabPeopleDashboard';
import StyledModal from '@/components/StyledModal';
import Tabs from '@/components/Tabs';
import { Badge } from '@/components/ui/Badge';
import { setVendorArchiveMutation, vendorFieldFragment } from '@/components/vendors/queries';
import VendorForm from '@/components/vendors/VendorForm';

import Avatar from '../../../Avatar';
import ConfirmationModal from '../../../ConfirmationModal';
import { CopyID } from '../../../CopyId';
import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { Skeleton } from '../../../ui/Skeleton';
import { useToast } from '../../../ui/useToast';
import type { DashboardContextType } from '../../DashboardContext';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';
import { makeReplaceSubpath } from '../../utils';
import type { TransactionsTableProps } from '../transactions/TransactionsTable';

import { ActivitiesTab } from './AccountDetailActivitiesTab';
import { AccountDetailManagedDisbursementsTab } from './AccountDetailManagedDisbursementsTab';
import { AccountDetailsOverviewTab } from './AccountDetailOverviewTab';
import { AccountDetailTransactionsTab } from './AccountDetailTransactionsTab';
import { AccountDetailView, getCollectiveTypeIcon, KYCStatusBadge, TaxFormBadge } from './common';
import { communityAccountDetailQuery } from './queries';

const convertOrganizationMutation = gql`
  mutation ConvertOrganizationToVendor($organization: AccountReferenceInput!, $host: AccountReferenceInput!) {
    convertOrganizationToVendor(organization: $organization, host: $host) {
      id
      ...VendorFields
    }
  }
  ${vendorFieldFragment}
`;

type AccountDetailsProps = {
  onClose: () => void;
  account?: AccountReferenceInput;
  host?: DashboardContextType['account'];
  expectedAccountType?: AccountType;
};

export function AccountDetails(props: AccountDetailsProps) {
  const { account: dashboardAccount } = React.useContext(DashboardContext);
  const intl = useIntl();
  const router = useRouter();
  const selectedTab = router.query?.subpath?.[1] || AccountDetailView.OVERVIEW;
  const setSelectedTab = React.useCallback(
    (tab: AccountDetailView) => {
      if (selectedTab !== tab) {
        const pushSubpath = makeReplaceSubpath(router);
        pushSubpath(`${props.account.id}/${tab}`);
      }
    },
    [router, props.account.id, selectedTab],
  );

  const { toast } = useToast();
  const [openExpenseId, setOpenExpenseId] = React.useState(null);
  const [openContributionId, setOpenContributionId] = React.useState(null);
  const [editVendor, setEditVendor] = React.useState<VendorFieldsFragment>(null);
  const [displayConvertToVendor, setDisplayConvertToVendor] = React.useState(false);

  const query = useQuery<CommunityAccountDetailQuery>(communityAccountDetailQuery, {
    variables: {
      accountId: props.account.id,
      hostSlug: dashboardAccount.slug,
      isIndividual: props.expectedAccountType === AccountType.INDIVIDUAL,
    },
  });
  const isLoading = query.loading || !query.data;
  const account = query.data?.account;
  const taxForms = query.data?.host?.hostedLegalDocuments;
  const [archiveVendor] = useMutation(setVendorArchiveMutation);
  const [convertOrganizationToVendor] = useMutation(convertOrganizationMutation);

  const handleSetArchive = React.useCallback(
    async vendor => {
      await archiveVendor({
        variables: { vendor: pick(vendor, ['id']), archive: !vendor.isArchived },
        refetchQueries: ['CommunityAccountDetail', 'DashboardVendors'],
      });
      await query.refetch();
    },
    [archiveVendor, query],
  );

  const handleConvertOrganizationToVendor = React.useCallback(async () => {
    try {
      const result = await convertOrganizationToVendor({
        variables: { organization: { id: account.id }, host: { id: dashboardAccount.id } },
      });
      toast({
        variant: 'success',
        message: <FormattedMessage defaultMessage="Organization converted to vendor" id="HwKF7/" />,
      });
      setEditVendor(result.data.convertOrganizationToVendor);
      setDisplayConvertToVendor(false);
      await query.refetch();
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  }, [convertOrganizationToVendor, account, dashboardAccount, toast, intl, query]);

  const handleTransactionTableRowClick = React.useCallback<TransactionsTableProps['onClickRow']>(
    row => {
      if ('expense' in row.original && row.original?.expense) {
        setOpenExpenseId(row.original.expense.legacyId);
        return true;
      } else if ('order' in row.original && row.original?.order) {
        setOpenContributionId(row.original.order.legacyId);
        return true;
      }
      return false;
    },
    [setOpenContributionId, setOpenExpenseId],
  );

  const tabs = React.useMemo(
    () =>
      [
        {
          id: AccountDetailView.OVERVIEW,
          label: <FormattedMessage defaultMessage="Overview" id="AdminPanel.Menu.Overview" />,
        },
        {
          id: AccountDetailView.TRANSACTIONS,
          label: <FormattedMessage defaultMessage="Money Movement" id="MoneyMovement" />,
        },
        query.data?.account?.type === CollectiveType.INDIVIDUAL && {
          id: AccountDetailView.FINANCIAL_CONTROLS,
          label: <FormattedMessage defaultMessage="Managed Disbursements" id="ManagedDisbursements" />,
        },
        {
          id: AccountDetailView.ACTIVITIES,
          label: <FormattedMessage defaultMessage="Activities" id="Activities" />,
        },
        ...(query.data?.account?.type === CollectiveType.INDIVIDUAL && isFeatureEnabled(dashboardAccount, FEATURES.KYC)
          ? [
              {
                id: AccountDetailView.KYC,
                label: 'KYC',
                count: Object.values(
                  query.data?.account && 'kycStatus' in query.data.account ? query.data.account.kycStatus : {},
                ).filter(kyc => !!kyc?.['status']).length,
              },
            ]
          : []),
      ].filter(Boolean),
    [query.data, dashboardAccount],
  );

  const handleTabChange = React.useCallback(
    (tab: AccountDetailView) => {
      setSelectedTab(tab);
    },
    [setSelectedTab],
  );

  const legalName = account?.legalName !== account?.name && account?.legalName;
  const canBeConvertedToVendor = account?.type === 'ORGANIZATION' ? account['canBeVendorOf'] : false;

  const rejectedExpensesCount = account?.rejectedExpenses?.totalCount || 0;
  const spamExpensesCount = account?.spamExpenses?.totalCount || 0;

  return (
    <div className="flex h-full flex-col">
      <button className="mb-4 flex w-fit items-center text-xs text-gray-500" onClick={() => history.back()}>
        <ArrowLeft size="14px" className="mr-1" />
        <FormattedMessage defaultMessage="Go Back" id="GoBack" />
      </button>
      <DashboardHeader
        title={
          <div className="flex items-center gap-3">
            {isLoading ? (
              <React.Fragment>
                <Skeleton className="aspect-square size-9" />
                <Skeleton className="h-6 w-48" />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Avatar collective={account} size={60} />
                <div className="flex flex-col">
                  <div>
                    {account.name || account.slug}
                    {legalName && <span className="ml-1 font-semibold text-muted-foreground">{`(${legalName})`}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge size="sm" type="outline" className="gap-1 rounded-full">
                      {getCollectiveTypeIcon(account?.type || props.expectedAccountType, { size: 12 })}
                      {formatCollectiveType(intl, account?.type || props.expectedAccountType)}
                    </Badge>
                    {account?.type === CollectiveType.INDIVIDUAL &&
                      isFeatureEnabled(dashboardAccount, FEATURES.KYC) && (
                        <KYCStatusBadge
                          kycStatus={
                            query.data?.account && 'kycStatus' in query.data.account ? query.data.account.kycStatus : {}
                          }
                        />
                      )}
                    <TaxFormBadge taxForms={taxForms} host={query.data?.host} />
                    {rejectedExpensesCount > 0 && (
                      <Badge size="sm" type={'error'}>
                        <FormattedMessage
                          defaultMessage="{count} rejected expenses"
                          id="RejectedExpensesCount"
                          values={{
                            count: rejectedExpensesCount,
                          }}
                        />
                      </Badge>
                    )}
                    {spamExpensesCount > 0 && (
                      <Badge size="sm" type={'error'}>
                        <FormattedMessage
                          defaultMessage="{count} spam expenses"
                          id="SpamExpensesCount"
                          values={{
                            count: spamExpensesCount,
                          }}
                        />
                      </Badge>
                    )}
                  </div>
                </div>
              </React.Fragment>
            )}
          </div>
        }
        actions={
          <React.Fragment>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/${account?.slug}`}>
                <FormattedMessage defaultMessage="View Profile" id="viewProfile" />
              </Link>
            </Button>
            <CopyID
              value={typeof window !== 'undefined' && window.location.href}
              className="relative inline-flex h-9 items-center justify-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
              Icon={null}
              toastOnCopy
            >
              <FormattedMessage defaultMessage="Copy URL" id="P8QaSQ" />
            </CopyID>
            {account?.type === CollectiveType.VENDOR && (
              <React.Fragment>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditVendor(account as unknown as VendorFieldsFragment);
                  }}
                  disabled={!query.data?.host}
                >
                  <FormattedMessage id="Edit" defaultMessage="Edit" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleSetArchive(account as unknown as VendorFieldsFragment);
                  }}
                >
                  {(account as unknown as VendorFieldsFragment).isArchived ? (
                    <FormattedMessage id="collective.unarchive.confirm.btn" defaultMessage="Unarchive" />
                  ) : (
                    <FormattedMessage id="collective.archive.confirm.btn" defaultMessage="Archive" />
                  )}
                </Button>
              </React.Fragment>
            )}
            {canBeConvertedToVendor && (
              <Button
                size="sm"
                onClick={() => {
                  setDisplayConvertToVendor(true);
                }}
              >
                <FormattedMessage defaultMessage="Convert to Vendor" id="ConvertToVendor" />
              </Button>
            )}
          </React.Fragment>
        }
      />
      <div className="mt-4 flex flex-grow flex-col gap-4">
        {query.error ? (
          <MessageBoxGraphqlError error={query.error} />
        ) : (
          <React.Fragment>
            <Tabs tabs={tabs} selectedId={selectedTab as string} onChange={handleTabChange} />
            {selectedTab === AccountDetailView.OVERVIEW && (
              <AccountDetailsOverviewTab
                query={query}
                expectedAccountType={props.expectedAccountType}
                handleTransactionTableRowClick={handleTransactionTableRowClick}
                handleTabChange={handleTabChange}
              />
            )}
            {selectedTab === AccountDetailView.TRANSACTIONS && account && (
              <AccountDetailTransactionsTab
                account={account}
                hostSlug={dashboardAccount.slug}
                handleTransactionTableRowClick={handleTransactionTableRowClick}
              />
            )}
            {selectedTab === AccountDetailView.ACTIVITIES && (
              <ActivitiesTab account={account} host={dashboardAccount} setOpenExpenseId={setOpenExpenseId} />
            )}
            {selectedTab === AccountDetailView.FINANCIAL_CONTROLS && (
              <AccountDetailManagedDisbursementsTab
                query={query}
                openExpenseLegacyId={openExpenseId}
                setOpenExpenseLegacyId={setOpenExpenseId}
              />
            )}
            {selectedTab === AccountDetailView.KYC && (
              <KYCTabPeopleDashboard requestedByAccount={dashboardAccount} verifyAccount={props.account} />
            )}
          </React.Fragment>
        )}
      </div>
      {openExpenseId && (
        <ExpenseDrawer openExpenseLegacyId={openExpenseId} handleClose={() => setOpenExpenseId(null)} />
      )}
      {openContributionId && (
        <ContributionDrawer
          open
          onClose={() => setOpenContributionId(null)}
          orderId={openContributionId}
          getActions={() => ({})}
        />
      )}
      {editVendor && query.data?.host && (
        <StyledModal onClose={() => setEditVendor(null)}>
          <VendorForm
            host={query.data.host}
            supportsTaxForm={query.data.host.requiredLegalDocuments?.includes?.(LegalDocumentType.US_TAX_FORM)}
            vendor={editVendor}
            onSuccess={() => {
              setEditVendor(null);
              query.refetch();
            }}
            onCancel={() => setEditVendor(null)}
            isModal
          />
        </StyledModal>
      )}
      {displayConvertToVendor && (
        <ConfirmationModal
          width="100%"
          maxWidth="570px"
          onClose={() => setDisplayConvertToVendor(false)}
          header={
            <FormattedMessage
              defaultMessage="Convert {orgname} into a managed vendor?"
              values={{ orgname: account.name }}
              id="convertVendorHeader"
            />
          }
          continueHandler={handleConvertOrganizationToVendor}
        >
          <p>
            <FormattedMessage
              defaultMessage="By doing so, this organization will be: {br}- Transformed into a vendor; {br}- No longer be accessible to its admins as an organization on the platform; and, {br}- Will no longer have a public profile."
              id="Ai2X+o"
              values={{ br: <br /> }}
            />
          </p>
        </ConfirmationModal>
      )}
    </div>
  );
}
