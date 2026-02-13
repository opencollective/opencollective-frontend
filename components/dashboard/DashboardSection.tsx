import React, { useContext } from 'react';
import { values } from 'lodash';
import { useIntl } from 'react-intl';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import type { DashboardQuery } from '@/lib/graphql/types/v2/graphql';

import Container from '../Container';
import { KYCRequests } from '../kyc/dashboard/KYCRequests';
import LoadingPlaceholder from '../LoadingPlaceholder';
import NotFound from '../NotFound';
import AccountSettingsForm from '../root-actions/AccountSettings';
import AccountType from '../root-actions/AccountType';
import { AnonymizeAccount } from '../root-actions/AnonymizeAccount';
import BanAccount from '../root-actions/BanAccounts';
import BanAccountsWithSearch from '../root-actions/BanAccountsWithSearch';
import ClearCacheForAccountForm from '../root-actions/ClearCacheForAccountForm';
import ConnectAccountsForm from '../root-actions/ConnectAccountsForm';
import MergeAccountsForm from '../root-actions/MergeAccountsForm';
import MoveAuthoredContributions from '../root-actions/MoveAuthoredContributions';
import MoveExpenses from '../root-actions/MoveExpenses';
import MoveReceivedContributions from '../root-actions/MoveReceivedContributions';
import RecurringContributions from '../root-actions/RecurringContributions';
import RootActivityLog from '../root-actions/RootActivityLog';
import UnhostAccountForm from '../root-actions/UnhostAccountForm';

import { HostAdminAccountingSection } from './sections/accounting';
import Accounts from './sections/accounts';
import AccountSettings from './sections/AccountSettings';
import AllCollectives from './sections/collectives/AllCollectives';
import HostApplications from './sections/collectives/HostApplications';
import HostedCollectives from './sections/collectives/HostedCollectives';
import PeopleRouter from './sections/community/People';
import HostExpectedFunds from './sections/contributions/HostExpectedFunds';
import IncomingContributions from './sections/contributions/IncomingContributions';
import IncompleteContributions from './sections/contributions/IncompleteContributions';
import OutgoingContributions from './sections/contributions/OutgoingContributions';
import Contributors from './sections/Contributors';
import ApprovePaymentRequests from './sections/expenses/ApprovePaymentRequests';
import HostExpenses from './sections/expenses/HostDashboardExpenses';
import HostPaymentRequests from './sections/expenses/HostPaymentRequests';
import { PaidDisbursements } from './sections/expenses/PaidDisbursements';
import PayDisbursements from './sections/expenses/PayDisbursements';
import PaymentRequests from './sections/expenses/PaymentRequests';
import ReceivedExpenses from './sections/expenses/ReceivedExpenses';
import SubmittedExpenses from './sections/expenses/SubmittedExpenses';
import Exports from './sections/exports';
import { ApproveGrantRequests } from './sections/funds-and-grants/ApproveGrantRequests';
import { Grants } from './sections/funds-and-grants/Grants';
import { HostedFunds } from './sections/funds-and-grants/HostedFunds';
import { HostedGrants } from './sections/funds-and-grants/HostedGrants';
import { SubmittedGrants } from './sections/funds-and-grants/SubmittedGrants';
import HostDashboardAgreements from './sections/HostDashboardAgreements';
import HostVirtualCardRequests from './sections/HostVirtualCardRequests';
import HostVirtualCards from './sections/HostVirtualCards';
import InvoicesReceipts from './sections/invoices-receipts/InvoicesReceipts';
import HostDashboardTaxForms from './sections/legal-documents/HostDashboardTaxForms';
import NotificationsSettings from './sections/NotificationsSettings';
import Overview from './sections/overview/Overview';
import { DashboardPlatformSubscription } from './sections/platform-subscription/DashboardPlatformSubscription';
import Reports from './sections/reports/Reports';
import Search from './sections/search/Search';
import LegacyPlatformSubscribers from './sections/subscriptions/LegacyPlatformSubscribers';
import PlatformSubscribers from './sections/subscriptions/PlatformSubscribers';
import { TaxInformationSettingsSection } from './sections/tax-information';
import Team from './sections/Team';
import AccountTransactions from './sections/transactions/AccountTransactions';
import AllTransactions from './sections/transactions/AllTransactions';
import HostTransactions from './sections/transactions/HostTransactions';
import { CSVTransactionsImports } from './sections/transactions-imports/CSVTransactionsImports';
import { OffPlatformConnections } from './sections/transactions-imports/OffPlatformConnections';
import { OffPlatformTransactions } from './sections/transactions-imports/OffPlatformTransactions';
import Updates from './sections/updates';
import Vendors from './sections/Vendors';
import VirtualCards from './sections/virtual-cards/VirtualCards';
import {
  ALL_SECTIONS,
  LEGACY_SECTIONS,
  LEGACY_SETTINGS_SECTIONS,
  ROOT_PROFILE_KEY,
  ROOT_SECTIONS,
  SECTION_LABELS,
  SECTIONS,
  SETTINGS_SECTIONS,
} from './constants';
import { DashboardContext } from './DashboardContext';
import DashboardErrorBoundary from './DashboardErrorBoundary';
import DashboardHeader from './DashboardHeader';
import { WorkspaceAccount } from '@/lib/LoggedInUser';

const DASHBOARD_COMPONENTS = {
  [SECTIONS.HOSTED_COLLECTIVES]: HostedCollectives,
  [SECTIONS.CHART_OF_ACCOUNTS]: HostAdminAccountingSection,
  [SECTIONS.OFF_PLATFORM_CONNECTIONS]: OffPlatformConnections,
  [SECTIONS.OFF_PLATFORM_TRANSACTIONS]: OffPlatformTransactions,
  [SECTIONS.LEDGER_CSV_IMPORTS]: CSVTransactionsImports,
  [SECTIONS.HOST_EXPENSES]: HostExpenses,
  [SECTIONS.PAY_DISBURSEMENTS]: PayDisbursements,
  [SECTIONS.PAID_DISBURSEMENTS]: PaidDisbursements,
  [SECTIONS.APPROVE_PAYMENT_REQUESTS]: ApprovePaymentRequests,
  [SECTIONS.HOST_PAYMENT_REQUESTS]: HostPaymentRequests,
  [SECTIONS.HOST_AGREEMENTS]: HostDashboardAgreements,
  [SECTIONS.HOST_TAX_FORMS]: HostDashboardTaxForms,
  [SECTIONS.HOST_APPLICATIONS]: HostApplications,
  [SECTIONS.REPORTS]: Reports,
  [SECTIONS.HOST_VIRTUAL_CARDS]: HostVirtualCards,
  [SECTIONS.HOST_VIRTUAL_CARD_REQUESTS]: HostVirtualCardRequests,
  [SECTIONS.OVERVIEW]: Overview,
  [SECTIONS.EXPENSES]: ReceivedExpenses,
  [SECTIONS.PAYMENT_REQUESTS]: PaymentRequests,
  [SECTIONS.SUBMITTED_EXPENSES]: SubmittedExpenses,
  [SECTIONS.HOSTED_FUNDS]: HostedFunds,
  [SECTIONS.HOSTED_GRANTS]: HostedGrants,
  [SECTIONS.GRANTS]: Grants,
  [SECTIONS.APPROVE_GRANT_REQUESTS]: ApproveGrantRequests,
  [SECTIONS.SUBMITTED_GRANTS]: SubmittedGrants,
  [SECTIONS.CONTRIBUTORS]: Contributors,
  [SECTIONS.PEOPLE]: PeopleRouter,
  [SECTIONS.KYC]: KYCRequests,
  [SECTIONS.INCOMING_CONTRIBUTIONS]: IncomingContributions,
  [SECTIONS.OUTGOING_CONTRIBUTIONS]: OutgoingContributions,
  [SECTIONS.HOST_EXPECTED_FUNDS]: HostExpectedFunds,
  [SECTIONS.INCOMPLETE_CONTRIBUTIONS]: IncompleteContributions,
  [SECTIONS.TRANSACTIONS]: AccountTransactions,
  [SECTIONS.HOST_TRANSACTIONS]: HostTransactions,
  [SECTIONS.UPDATES]: Updates,
  [SECTIONS.VIRTUAL_CARDS]: VirtualCards,
  [SECTIONS.TEAM]: Team,
  [SECTIONS.VENDORS]: Vendors,
  [SECTIONS.ACCOUNTS]: Accounts,
  [SECTIONS.SEARCH]: Search,
};

const LEGACY_SETTINGS_COMPONENTS = {
  [LEGACY_SETTINGS_SECTIONS.EXPORTS]: Exports,
};

const SETTINGS_COMPONENTS = {
  [SETTINGS_SECTIONS.INVOICES_RECEIPTS]: InvoicesReceipts,
  [SETTINGS_SECTIONS.NOTIFICATIONS]: NotificationsSettings,
  [SETTINGS_SECTIONS.TAX_INFORMATION]: TaxInformationSettingsSection,
  [SECTIONS.PLATFORM_SUBSCRIPTION]: DashboardPlatformSubscription,
};

const ROOT_COMPONENTS = {
  [SECTIONS.HOST_TRANSACTIONS]: AllTransactions,
  [ALL_SECTIONS.ACTIVITY_LOG]: RootActivityLog,
  [ROOT_SECTIONS.ALL_COLLECTIVES]: AllCollectives,
  [ROOT_SECTIONS.BAN_ACCOUNTS]: BanAccount,
  [ROOT_SECTIONS.ANONYMIZE_ACCOUNT]: AnonymizeAccount,
  [ROOT_SECTIONS.SEARCH_AND_BAN]: BanAccountsWithSearch,
  [ROOT_SECTIONS.MOVE_AUTHORED_CONTRIBUTIONS]: MoveAuthoredContributions,
  [ROOT_SECTIONS.MOVE_RECEIVED_CONTRIBUTIONS]: MoveReceivedContributions,
  [ROOT_SECTIONS.MOVE_EXPENSES]: MoveExpenses,
  [ROOT_SECTIONS.CLEAR_CACHE]: ClearCacheForAccountForm,
  [ROOT_SECTIONS.CONNECT_ACCOUNTS]: ConnectAccountsForm,
  [ROOT_SECTIONS.MERGE_ACCOUNTS]: MergeAccountsForm,
  [ROOT_SECTIONS.UNHOST_ACCOUNTS]: UnhostAccountForm,
  [ROOT_SECTIONS.ACCOUNT_SETTINGS]: AccountSettingsForm,
  [ROOT_SECTIONS.ACCOUNT_TYPE]: AccountType,
  [ROOT_SECTIONS.RECURRING_CONTRIBUTIONS]: RecurringContributions,
  [ROOT_SECTIONS.LEGACY_SUBSCRIBERS]: LegacyPlatformSubscribers,
  [ROOT_SECTIONS.SUBSCRIBERS]: PlatformSubscribers,
};

interface DashboardSectionProps {
  isLoading?: boolean;
  section?: string;
  subpath?: string[];
}

const DashboardSection = ({ isLoading, section, subpath }: DashboardSectionProps) => {
  const { LoggedInUser } = useLoggedInUser();
  const { activeSlug, account } = useContext(DashboardContext);

  const { formatMessage } = useIntl();

  // Only show the full loading placeholder when LoggedInUser hasn't loaded yet
  if (isLoading) {
    return (
      <div className="w-full pb-6">
        <LoadingPlaceholder height={26} mb={4} maxWidth={500} />
        <LoadingPlaceholder height={300} />
      </div>
    );
  }

  // Use activeSlug for accountSlug (available immediately), account may still be loading
  const accountSlug = activeSlug;

  const RootComponent = ROOT_COMPONENTS[section];
  if (RootComponent && LoggedInUser.isRoot && activeSlug === ROOT_PROFILE_KEY) {
    return (
      <div className="w-full">
        <DashboardErrorBoundary>
          <RootComponent subpath={subpath} isDashboard />
        </DashboardErrorBoundary>
      </div>
    );
  }

  const DashboardComponent = DASHBOARD_COMPONENTS[section];
  if (DashboardComponent) {
    return (
      <div className="h-full w-full">
        <DashboardErrorBoundary>
          <DashboardComponent accountSlug={accountSlug} subpath={subpath} isDashboard />
        </DashboardErrorBoundary>
      </div>
    );
  }

  // Legacy settings component (new sections without AccountSettings)
  const LegacySettingsComponent = LEGACY_SETTINGS_COMPONENTS[section];
  if (LegacySettingsComponent) {
    return (
      <div className="w-full">
        <DashboardErrorBoundary>
          <LegacySettingsComponent accountSlug={accountSlug} subpath={subpath} />
        </DashboardErrorBoundary>
      </div>
    );
  }

  // Settings component -- requires account for legacy AccountSettings wrapper
  const SettingsComponent = SETTINGS_COMPONENTS[section];
  if (SettingsComponent) {
    return (
      <div className="mx-auto w-full max-w-(--breakpoint-md)">
        <DashboardErrorBoundary>
          <SettingsComponent account={account} accountSlug={accountSlug} subpath={subpath} />
        </DashboardErrorBoundary>
      </div>
    );
  }

  if (values(LEGACY_SECTIONS).includes(section)) {
    return (
      <div className="w-full">
        {SECTION_LABELS[section] && section !== ALL_SECTIONS.GIFT_CARDS && (
          <DashboardHeader className="mb-2" title={formatMessage(SECTION_LABELS[section])} />
        )}

        <DashboardErrorBoundary>
          <AccountSettings account={account} section={section} />
        </DashboardErrorBoundary>
      </div>
    );
  }

  if (values(LEGACY_SETTINGS_SECTIONS).includes(section)) {
    return (
      <div className="mx-auto w-full max-w-(--breakpoint-md)">
        {SECTION_LABELS[section] && section !== ALL_SECTIONS.GIFT_CARDS && (
          <DashboardHeader className="mb-2" title={formatMessage(SECTION_LABELS[section])} />
        )}
        <DashboardErrorBoundary>
          <AccountSettings account={account} section={section} />
        </DashboardErrorBoundary>
      </div>
    );
  }

  return (
    <Container display="flex" justifyContent="center" alignItems="center">
      <NotFound />
    </Container>
  );
};

export default DashboardSection;
