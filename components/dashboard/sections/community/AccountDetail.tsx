import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { pick } from 'lodash';
import { ArrowLeft, BookKey, Dot, Mail } from 'lucide-react';
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
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import formatCollectiveType from '@/lib/i18n/collective-type';
import { getCountryDisplayName, getFlagEmoji } from '@/lib/i18n/countries';

import { ContributionDrawer } from '@/components/contributions/ContributionDrawer';
import HeroSocialLinks from '@/components/crowdfunding-redesign/SocialLinks';
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

import { ActivitiesTab } from './AccountDetailActivitiesTab';
import { AccountDetailsOverviewTab } from './AccountDetailOverviewTab';
import { AccountDetailTransactionsTab } from './AccountDetailTransactionsTab';
import { getCollectiveTypeIcon } from './common';
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

enum AccountDetailView {
  OVERVIEW = 'OVERVIEW',
  TRANSACTIONS = 'TRANSACTIONS',
  ACTIVITIES = 'ACTIVITIES',
  KYC = 'KYC',
}

type AccountDetailsProps = {
  onClose: () => void;
  account?: AccountReferenceInput;
  host?: DashboardContextType['account'];
  expectedAccountType?: AccountType;
};

export function AccountDetails(props: AccountDetailsProps) {
  const { account: dashboardAccount } = React.useContext(DashboardContext);
  const intl = useIntl();
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = React.useState<AccountDetailView>(AccountDetailView.OVERVIEW);
  const [openExpenseId, setOpenExpenseId] = React.useState(null);
  const [openContributionId, setOpenContributionId] = React.useState(null);
  const [editVendor, setEditVendor] = React.useState<VendorFieldsFragment>(null);
  const [displayConvertToVendor, setDisplayConvertToVendor] = React.useState(false);

  const { LoggedInUser } = useLoggedInUser();

  const query = useQuery<CommunityAccountDetailQuery>(communityAccountDetailQuery, {
    variables: {
      accountId: props.account.id,
      hostSlug: dashboardAccount.slug,
      isIndividual: props.expectedAccountType === AccountType.INDIVIDUAL,
    },
    // Since tabs data is loaded on demand, we don't want to refetch when switching tabs
    nextFetchPolicy: 'standby',
  });
  const isLoading = query.loading || !query.data;
  const account = query.data?.account;
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

  const kycStatus = query.data?.account && 'kycStatus' in query.data.account ? query.data.account.kycStatus : {};
  const tabs = React.useMemo(
    () => [
      {
        id: AccountDetailView.OVERVIEW,
        label: <FormattedMessage defaultMessage="Overview" id="AdminPanel.Menu.Overview" />,
      },
      {
        id: AccountDetailView.TRANSACTIONS,
        label: <FormattedMessage defaultMessage="Money Movements" id="MoneyMovements" />,
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
              count: Object.values(kycStatus || {}).filter(kyc => !!kyc?.['status']).length,
            },
          ]
        : []),
    ],
    [query.data, query.data?.account?.type, LoggedInUser, kycStatus],
  );

  const handleTabChange = React.useCallback(
    (tab: AccountDetailView) => {
      setSelectedTab(tab);
    },
    [setSelectedTab],
  );

  const legalName = account?.legalName !== account?.name && account?.legalName;
  const canBeConvertedToVendor = account?.type === 'ORGANIZATION' ? account['canBeVendorOf'] : false;

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
                <Avatar collective={account} size={48} />
                {account.name || account.slug}
                {legalName && <span className="font-semibold text-muted-foreground">{`(${legalName})`}</span>}
                <Badge className="gap-1 rounded-full">
                  {getCollectiveTypeIcon(account?.type || props.expectedAccountType, { size: 12 })}
                  {formatCollectiveType(intl, account?.type || props.expectedAccountType)}
                </Badge>
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
      {isLoading ? (
        <Skeleton className="h-4 w-32" />
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2 overflow-hidden text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookKey size={14} />
            <CopyID
              value={account?.publicId || props.account.id}
              tooltipLabel={<FormattedMessage defaultMessage="Copy Account ID" id="D+P5Yx" />}
              className="inline-flex items-center gap-1"
              Icon={null}
            >
              {account?.publicId || `${props.account.id.split('-')[0]}...`}
            </CopyID>
          </div>
          {account && 'email' in account && (
            <React.Fragment>
              <Dot size={14} />
              <div className="flex items-center gap-1 overflow-hidden">
                <Mail size={14} />
                <CopyID
                  value={account.email}
                  tooltipLabel={<FormattedMessage defaultMessage="Copy Email" id="8NlxGY" />}
                  className="inline-flex items-center gap-1"
                  Icon={null}
                >
                  {account.email}
                </CopyID>
              </div>
            </React.Fragment>
          )}
          {account?.location?.country && (
            <React.Fragment>
              <Dot size={14} />
              <div className="flex items-center gap-1">
                <span>{getFlagEmoji(account.location.country)}</span>
                <span>{getCountryDisplayName(intl, account.location.country)}</span>
              </div>
            </React.Fragment>
          )}
          {account?.socialLinks?.length > 0 && (
            <React.Fragment>
              <Dot size={14} />
              <HeroSocialLinks className="size-6" socialLinks={account.socialLinks} />
            </React.Fragment>
          )}
        </div>
      )}
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
                setOpenContributionId={setOpenContributionId}
                setOpenExpenseId={setOpenExpenseId}
              />
            )}
            {selectedTab === AccountDetailView.TRANSACTIONS && account && (
              <AccountDetailTransactionsTab account={account} hostSlug={dashboardAccount.slug} />
            )}
            {selectedTab === AccountDetailView.ACTIVITIES && (
              <ActivitiesTab account={account} host={dashboardAccount} setOpenExpenseId={setOpenExpenseId} />
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
