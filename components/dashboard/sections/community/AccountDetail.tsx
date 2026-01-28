import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { compact, pick } from 'lodash';
import { ArrowLeft, BookKey, Dot, Mail } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { FEATURES, isFeatureEnabled } from '@/lib/allowed-features';
import { CollectiveType } from '@/lib/constants/collectives';
import { i18nGraphqlException } from '@/lib/errors';
import { gql } from '@/lib/graphql/helpers';
import type { CommunityAccountDetailQuery, VendorFieldsFragment } from '@/lib/graphql/types/v2/graphql';
import type { AccountReferenceInput } from '@/lib/graphql/types/v2/schema';
import { AccountType, CommunityRelationType, KycProvider, LegalDocumentType } from '@/lib/graphql/types/v2/schema';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import formatCollectiveType from '@/lib/i18n/collective-type';
import { formatCommunityRelation } from '@/lib/i18n/community-relation';
import { getCountryDisplayName, getFlagEmoji } from '@/lib/i18n/countries';
import { getDashboardRoute } from '@/lib/url-helpers';

import { ContributionDrawer } from '@/components/contributions/ContributionDrawer';
import HeroSocialLinks from '@/components/crowdfunding-redesign/SocialLinks';
import ExpenseDrawer from '@/components/expenses/ExpenseDrawer';
import { KYCTabPeopleDashboard } from '@/components/kyc/dashboard/KYCTabPeopleDashboard';
import LocationAddress from '@/components/LocationAddress';
import StackedAvatars from '@/components/StackedAvatars';
import StyledModal from '@/components/StyledModal';
import { DataTable } from '@/components/table/DataTable';
import Tabs from '@/components/Tabs';
import { InfoList, InfoListItem } from '@/components/ui/InfoList';
import { VendorContactTag } from '@/components/vendors/common';
import { setVendorArchiveMutation, vendorFieldFragment } from '@/components/vendors/queries';
import VendorForm from '@/components/vendors/VendorForm';

import Avatar from '../../../Avatar';
import ConfirmationModal from '../../../ConfirmationModal';
import { CopyID } from '../../../CopyId';
import DateTime from '../../../DateTime';
import Link from '../../../Link';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { Skeleton } from '../../../ui/Skeleton';
import { useToast } from '../../../ui/useToast';
import type { DashboardContextType } from '../../DashboardContext';
import { DashboardContext } from '../../DashboardContext';
import DashboardHeader from '../../DashboardHeader';

import { ActivitiesTab } from './AccountDetailActivitiesTab';
import { ContributionsTab } from './AccountDetailContributionsTab';
import { ExpensesTab } from './AccountDetailExpensesTab';
import { AccountTaxFormStatus } from './AccountTaxFormStatus';
import {
  associatedTableColumns,
  getMembersTableColumns,
  RichActivityDate,
  useAssociatedCollectiveActions,
} from './common';
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
  EXPENSES = 'EXPENSES',
  CONTRIBUTIONS = 'CONTRIBUTIONS',
  ACTIVITIES = 'ACTIVITIES',
  KYC = 'KYC',
}

type ContributionDrawerProps = {
  onClose: () => void;
  account?: AccountReferenceInput;
  host?: DashboardContextType['account'];
  expectedAccountType?: AccountType;
};

export function ContributorDetails(props: ContributionDrawerProps) {
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

  const kycStatus = query.data?.account && 'kycStatus' in query.data.account ? query.data.account['kycStatus'] : {};
  const tabs = React.useMemo(
    () => [
      {
        id: AccountDetailView.OVERVIEW,
        label: <FormattedMessage defaultMessage="Overview" id="AdminPanel.Menu.Overview" />,
      },
      {
        id: AccountDetailView.EXPENSES,
        label: <FormattedMessage defaultMessage="Expenses" id="Expenses" />,
        count: query.data?.account?.communityStats?.transactionSummary[0]?.expenseCountAcc || 0,
      },
      {
        id: AccountDetailView.CONTRIBUTIONS,
        label: <FormattedMessage defaultMessage="Contributions" id="Contributions" />,
        count: query.data?.account?.communityStats?.transactionSummary[0]?.contributionCountAcc || 0,
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
              count: Object.values(pick(kycStatus, [KycProvider.MANUAL.toLowerCase()])).filter(
                status => status !== null,
              ).length,
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

  const getActions = useAssociatedCollectiveActions({ accountSlug: account?.slug });
  const relations = compact(account?.communityStats?.relations).filter(
    (relation, _, relations) => !(relation === 'EXPENSE_SUBMITTER' && relations.includes(CommunityRelationType.PAYEE)),
  );

  const legalName = account?.legalName !== account?.name && account?.legalName;
  const taxForms = query.data?.host?.hostedLegalDocuments;
  const vendorInfo = account?.type === 'VENDOR' ? account['vendorInfo'] : null;
  const canBeConvertedToVendor = account?.type === 'ORGANIZATION' ? account['canBeVendorOf'] : false;

  return (
    <div className="flex h-full flex-col">
      <button className="mb-4 flex w-fit items-center text-xs text-gray-500" onClick={() => history.back()}>
        <ArrowLeft size="14px" className="mr-1" />
        <FormattedMessage defaultMessage="Go Back" id="GoBack" />
      </button>
      <DashboardHeader
        title={
          <div className="flex items-center gap-2">
            {isLoading ? (
              <React.Fragment>
                <Skeleton className="aspect-square size-9" />
                <Skeleton className="h-6 w-48" />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Avatar collective={account} size={36} />
                {account.name || account.slug}
                {legalName && <span className="font-semibold text-muted-foreground">{`(${legalName})`}</span>}
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
      <div className="mt-2 flex justify-between">
        {isLoading ? (
          <Skeleton className="h-4 w-32" />
        ) : (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1 align-middle">
              <div className="inline-flex items-center gap-0.5 rounded-md bg-transparent px-2 py-1 align-middle text-xs font-medium text-nowrap text-muted-foreground ring-1 ring-slate-300 ring-inset">
                {formatCollectiveType(intl, account?.type || props.expectedAccountType)}
              </div>
              {relations.map(role => (
                <div
                  key={role}
                  className="inline-flex items-center gap-0.5 rounded-md bg-transparent px-2 py-1 align-middle text-xs font-medium text-nowrap text-muted-foreground ring-1 ring-slate-300 ring-inset"
                >
                  {formatCommunityRelation(intl, role)}
                </div>
              ))}
            </div>
            <Dot size={14} />
            <div className="flex items-center gap-1">
              <BookKey size={14} />
              <CopyID
                value={props.account.id}
                tooltipLabel={<FormattedMessage defaultMessage="Copy Account ID" id="D+P5Yx" />}
                className="inline-flex items-center gap-1"
                Icon={null}
              >
                {props.account.id.split('-')[0]}...
              </CopyID>
            </div>
            {account && 'email' in account && (
              <React.Fragment>
                <Dot size={14} />
                <div className="flex items-center gap-1">
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
      </div>
      <div className="mt-4 flex flex-grow flex-col gap-8">
        {query.error ? (
          <MessageBoxGraphqlError error={query.error} />
        ) : (
          <React.Fragment>
            <Tabs tabs={tabs} selectedId={selectedTab as string} onChange={handleTabChange} />
            <div
              className="grid grid-cols-1 gap-12 aria-hidden:hidden xl:grid-cols-4"
              aria-hidden={selectedTab !== AccountDetailView.OVERVIEW}
            >
              <div className="space-y-4 xl:order-2">
                <h2 className="tight text-xl font-bold text-slate-800">
                  <FormattedMessage defaultMessage="Details" id="Details" />
                </h2>

                <InfoList
                  variant="compact"
                  className="grid-cols-1 rounded-lg border p-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-1"
                >
                  <InfoListItem
                    title={<FormattedMessage defaultMessage="Legal name" id="OozR1Y" />}
                    value={account?.legalName}
                    isLoading={isLoading}
                  />
                  <InfoListItem
                    title={<FormattedMessage defaultMessage="Display name" id="Fields.displayName" />}
                    value={account?.name || account?.slug}
                    isLoading={isLoading}
                  />
                  <InfoListItem
                    title={<FormattedMessage defaultMessage="Location" id="SectionLocation.Title" />}
                    value={
                      (account?.location?.country || account?.location?.address) && (
                        <LocationAddress location={account.location} />
                      )
                    }
                    isLoading={isLoading}
                  />
                  <InfoListItem
                    title={
                      account?.type === 'VENDOR' ? (
                        <FormattedMessage id="agreement.createdOn" defaultMessage="Created on" />
                      ) : (
                        <FormattedMessage defaultMessage="Joined the platform on" id="Vf1x2A" />
                      )
                    }
                    value={account?.createdAt && <DateTime value={account.createdAt} dateStyle="long" />}
                    isLoading={isLoading}
                  />
                  <InfoListItem
                    title={<FormattedMessage defaultMessage="First interaction with Host" id="mJq3cC" />}
                    value={
                      account?.communityStats?.firstInteractionAt && (
                        <RichActivityDate
                          date={account?.communityStats?.firstInteractionAt}
                          activity={query.data?.firstActivity?.nodes?.[0]}
                        />
                      )
                    }
                    isLoading={isLoading}
                  />
                  <InfoListItem
                    title={<FormattedMessage defaultMessage="Last interaction with Host" id="0k5yUb" />}
                    value={
                      account?.communityStats?.lastInteractionAt && (
                        <RichActivityDate
                          date={account?.communityStats?.lastInteractionAt}
                          activity={query.data?.lastActivity?.nodes?.[0]}
                        />
                      )
                    }
                    isLoading={isLoading}
                  />
                  <InfoListItem
                    title={<FormattedMessage defaultMessage="Tax form" id="TaxForm" />}
                    value={
                      taxForms?.nodes[0] && (
                        <div className="flex flex-col items-start gap-1">
                          <AccountTaxFormStatus
                            taxForm={taxForms.nodes[0]}
                            host={query.data?.host}
                            onRefetch={() => query.refetch()}
                          />
                          {taxForms?.totalCount > 1 && (
                            <Link
                              className="font-normal text-muted-foreground hover:text-foreground hover:underline"
                              href={getDashboardRoute(dashboardAccount, `host-tax-forms?account=${account?.slug}`)}
                            >
                              <FormattedMessage defaultMessage="View all" id="TaxForm.ViewAll" />
                            </Link>
                          )}
                        </div>
                      )
                    }
                    isLoading={isLoading}
                  />
                  {account?.type === 'VENDOR' && vendorInfo && (
                    <React.Fragment>
                      <InfoListItem
                        title={<FormattedMessage defaultMessage="Visible to" id="zJePa1" />}
                        value={
                          'visibleToAccounts' in account && account.visibleToAccounts.length > 0 ? (
                            <StackedAvatars
                              accounts={account.visibleToAccounts}
                              imageSize={24}
                              withHoverCard={{ includeAdminMembership: true }}
                            />
                          ) : (
                            <FormattedMessage defaultMessage="All hosted accounts" id="M7USSD" />
                          )
                        }
                      />
                      {vendorInfo.contact && (
                        <InfoListItem
                          title={<FormattedMessage defaultMessage="Vendor Contact" id="p1twtU" />}
                          value={
                            <VendorContactTag>
                              {vendorInfo.contact.name}
                              {vendorInfo.contact.email && (
                                <a href={`mailto:${vendorInfo.contact.email}`} className="font-normal">
                                  {vendorInfo.contact.email}
                                </a>
                              )}
                            </VendorContactTag>
                          }
                        />
                      )}
                      {vendorInfo.taxType && (
                        <InfoListItem
                          title={<FormattedMessage defaultMessage="Company Identifier" id="K0kNyF" />}
                          value={
                            <React.Fragment>
                              {vendorInfo.taxType}: {vendorInfo.taxId}
                            </React.Fragment>
                          }
                        />
                      )}
                      {vendorInfo.notes && (
                        <InfoListItem
                          title={<FormattedMessage id="expense.notes" defaultMessage="Notes" />}
                          value={vendorInfo.notes}
                        />
                      )}
                    </React.Fragment>
                  )}
                </InfoList>
              </div>
              <div className="space-y-4 xl:order-1 xl:col-span-3">
                <h2 className="text-xl font-bold text-slate-800">
                  <FormattedMessage
                    defaultMessage="With {hostName}"
                    id="WithHostname"
                    values={{ hostName: dashboardAccount.name }}
                  />
                  <p className="text-sm font-normal text-muted-foreground">
                    <FormattedMessage
                      defaultMessage="Interactions between this {type, select, ORGANIZATION {organization} INDIVIDUAL {individual} VENDOR {vendor} other {account}} and {hostName}."
                      id="e6Nl5I"
                      values={{ type: account?.type || props.expectedAccountType, hostName: dashboardAccount.name }}
                    />
                  </p>
                </h2>
                <DataTable
                  data={[]
                    .concat(account?.communityStats?.associatedCollectives || [])
                    .concat(account?.communityStats?.associatedOrganizations || [])}
                  columns={associatedTableColumns(intl)}
                  loading={isLoading}
                  getActions={getActions}
                />
                {account && 'adminOf' in account && [AccountType.INDIVIDUAL].includes(props.expectedAccountType) && (
                  <React.Fragment>
                    <h2 className="text-xl font-bold text-slate-800">
                      <FormattedMessage defaultMessage="Associated Organizations" id="E9PjGp" />
                      <p className="text-sm font-normal text-muted-foreground">
                        <FormattedMessage
                          defaultMessage="Organizations managed by this {type, select, ORGANIZATION {organization} INDIVIDUAL {individual} VENDOR {vendor} other {account}}."
                          id="psQUwJ"
                          values={{ type: account?.type || props.expectedAccountType, hostName: dashboardAccount.name }}
                        />
                      </p>
                    </h2>
                    <DataTable
                      data={account.adminOf.nodes || []}
                      columns={getMembersTableColumns(intl, false)}
                      loading={isLoading}
                    />
                  </React.Fragment>
                )}
                {[AccountType.ORGANIZATION, AccountType.COLLECTIVE].includes(
                  account?.type || props.expectedAccountType,
                ) && (
                  <React.Fragment>
                    <h2 className="text-xl font-bold text-slate-800">
                      <FormattedMessage defaultMessage="Members" id="+a+2ug" />
                      <p className="text-sm font-normal text-muted-foreground">
                        <FormattedMessage
                          defaultMessage="Individuals that manage this {type, select, ORGANIZATION {organization} COLLECTIVE {collective} other {account}}."
                          id="X1b0YV"
                          values={{ type: account?.type || props.expectedAccountType }}
                        />
                      </p>
                    </h2>
                    <DataTable
                      data={account?.members?.nodes || []}
                      columns={getMembersTableColumns(intl)}
                      loading={isLoading}
                    />
                  </React.Fragment>
                )}
              </div>
            </div>
            {selectedTab === AccountDetailView.CONTRIBUTIONS && (
              <ContributionsTab account={account} host={props.host} setOpenContributionId={setOpenContributionId} />
            )}
            {!isLoading && selectedTab === AccountDetailView.EXPENSES && (
              <ExpensesTab
                account={account}
                host={dashboardAccount}
                setOpenExpenseId={setOpenExpenseId}
                expectedAccountType={props.expectedAccountType}
              />
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
      {editVendor && (
        <StyledModal onClose={() => setEditVendor(null)}>
          <VendorForm
            host={dashboardAccount}
            supportsTaxForm={
              'host' in dashboardAccount &&
              'requiredLegalDocuments' in dashboardAccount.host &&
              dashboardAccount.host.requiredLegalDocuments?.includes?.(LegalDocumentType.US_TAX_FORM)
            }
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
