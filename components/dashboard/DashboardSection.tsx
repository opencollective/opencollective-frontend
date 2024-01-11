import React from 'react';
import PropTypes from 'prop-types';
import { values } from 'lodash';
import { useIntl } from 'react-intl';

import { isIndividualAccount } from '../../lib/collective';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { PREVIEW_FEATURE_KEYS } from '../../lib/preview-features';

import { HostAdminAccountingSection } from '../admin-panel/sections/accounting';
import AccountSettings from '../admin-panel/sections/AccountSettings';
import InvoicesReceipts from '../admin-panel/sections/invoices-receipts/InvoicesReceipts';
import NotificationsSettings from '../admin-panel/sections/NotificationsSettings';
import Team from '../admin-panel/sections/Team';
import Container from '../Container';
import LoadingPlaceholder from '../LoadingPlaceholder';
import NotFound from '../NotFound';

import HostApplications from './sections/collectives/HostApplications';
import HostedCollectives from './sections/collectives/HostedCollectives';
import HostFinancialContributions from './sections/contributions/HostFinancialContributions';
import IncomingContributions from './sections/contributions/IncomingContributions';
import OutgoingContributions from './sections/contributions/OutgoingContributions';
import Contributors from './sections/Contributors';
import HostExpenses from './sections/expenses/HostDashboardExpenses';
import ReceivedExpenses from './sections/expenses/ReceivedExpenses';
import SubmittedExpenses from './sections/expenses/SubmittedExpenses';
import HostDashboardAgreements from './sections/HostDashboardAgreements';
import HostDashboardReports from './sections/HostDashboardReports';
import HostVirtualCardRequests from './sections/HostVirtualCardRequests';
import HostVirtualCards from './sections/HostVirtualCards';
import { CollectiveOverview } from './sections/Overview/CollectiveOverview';
import IndividualOverview from './sections/Overview/IndividualOverview';
import Transactions from './sections/Transactions';
import AccountTransactions from './sections/transactions/AccountTransactions';
import HostTransactions from './sections/transactions/HostTransactions';
import Vendors from './sections/Vendors';
import VirtualCards from './sections/virtual-cards/VirtualCards';
import { LEGACY_SECTIONS, LEGACY_SETTINGS_SECTIONS, SECTION_LABELS, SECTIONS, SETTINGS_SECTIONS } from './constants';
import DashboardHeader from './DashboardHeader';

const DASHBOARD_COMPONENTS = {
  [SECTIONS.HOSTED_COLLECTIVES]: HostedCollectives,
  [SECTIONS.CHART_OF_ACCOUNTS]: HostAdminAccountingSection,
  [SECTIONS.HOST_FINANCIAL_CONTRIBUTIONS]: HostFinancialContributions,
  [SECTIONS.HOST_EXPENSES]: HostExpenses,
  [SECTIONS.HOST_AGREEMENTS]: HostDashboardAgreements,
  [SECTIONS.HOST_APPLICATIONS]: HostApplications,
  [SECTIONS.REPORTS]: HostDashboardReports,
  [SECTIONS.HOST_VIRTUAL_CARDS]: HostVirtualCards,
  [SECTIONS.HOST_VIRTUAL_CARD_REQUESTS]: HostVirtualCardRequests,
  [SECTIONS.OVERVIEW]: CollectiveOverview,
  [SECTIONS.EXPENSES]: ReceivedExpenses,
  [SECTIONS.SUBMITTED_EXPENSES]: SubmittedExpenses,
  [SECTIONS.CONTRIBUTORS]: Contributors,
  [SECTIONS.INCOMING_CONTRIBUTIONS]: IncomingContributions,
  [SECTIONS.OUTGOING_CONTRIBUTIONS]: OutgoingContributions,
  [SECTIONS.TRANSACTIONS]: Transactions,
  [SECTIONS.HOST_TRANSACTIONS]: HostTransactions,
  [SECTIONS.VIRTUAL_CARDS]: VirtualCards,
  [SECTIONS.TEAM]: Team,
  [SECTIONS.VENDORS]: Vendors,
};

const SETTINGS_COMPONENTS = {
  [SETTINGS_SECTIONS.INVOICES_RECEIPTS]: InvoicesReceipts,
  [SETTINGS_SECTIONS.NOTIFICATIONS]: NotificationsSettings,
};

const DashboardSection = ({ account, isLoading, section, subpath }) => {
  const { formatMessage } = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const useNewTransactionsPage = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.NEW_TRANSACTION_PAGE);

  if (isLoading) {
    return (
      <div className="w-full">
        <LoadingPlaceholder height={26} mb={4} maxWidth={500} />
        <LoadingPlaceholder height={300} />
      </div>
    );
  }

  let DashboardComponent = DASHBOARD_COMPONENTS[section];
  if (DashboardComponent) {
    if (section === SECTIONS.TRANSACTIONS && useNewTransactionsPage) {
      DashboardComponent = AccountTransactions;
    }
    if (section === SECTIONS.OVERVIEW && isIndividualAccount(account)) {
      DashboardComponent = IndividualOverview;
    }
    return (
      <div className="w-full">
        <DashboardComponent accountSlug={account.slug} subpath={subpath} isDashboard />
      </div>
    );
  }

  if (values(LEGACY_SECTIONS).includes(section)) {
    return (
      <div className="w-full max-w-screen-lg">
        {SECTION_LABELS[section] && <DashboardHeader className="mb-2" title={formatMessage(SECTION_LABELS[section])} />}

        <AccountSettings account={account} section={section} />
      </div>
    );
  }

  // Settings component
  const SettingsComponent = SETTINGS_COMPONENTS[section];
  if (SettingsComponent) {
    return (
      // <div className="flex max-w-screen-lg justify-center">
      <div className="max-w-screen-md flex-1">
        <SettingsComponent account={account} accountSlug={account.slug} subpath={subpath} />
      </div>
      // </div>
    );
  }

  if (values(LEGACY_SETTINGS_SECTIONS).includes(section)) {
    return (
      // <div className="flex max-w-screen-lg justify-center">
      <div className="max-w-screen-md flex-1">
        {SECTION_LABELS[section] && <DashboardHeader className="mb-2" title={formatMessage(SECTION_LABELS[section])} />}

        <AccountSettings account={account} section={section} />
      </div>
      // </div>
    );
  }

  return (
    <Container display="flex" justifyContent="center" alignItems="center">
      <NotFound />
    </Container>
  );
};

DashboardSection.propTypes = {
  isLoading: PropTypes.bool,
  section: PropTypes.string,
  subpath: PropTypes.arrayOf(PropTypes.string),
  /** The account. Can be null if isLoading is true */
  account: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string,
    isHost: PropTypes.bool,
  }),
};

export default DashboardSection;
