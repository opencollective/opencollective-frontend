import React from 'react';
import PropTypes from 'prop-types';
import { values } from 'lodash';
import { useIntl } from 'react-intl';

import { cn } from '../../lib/utils';

import AccountSettings from '../admin-panel/sections/AccountSettings';
import FinancialContributions from '../admin-panel/sections/FinancialContributions';
import HostVirtualCardRequests from '../admin-panel/sections/HostVirtualCardRequests';
import HostVirtualCards from '../admin-panel/sections/HostVirtualCards';
import InvoicesReceipts from '../admin-panel/sections/invoices-receipts/InvoicesReceipts';
import NotificationsSettings from '../admin-panel/sections/NotificationsSettings';
import PendingContributions from '../admin-panel/sections/PendingContributions';
import TeamSettings from '../admin-panel/sections/Team';
import Container from '../Container';
import { Box } from '../Grid';
import HostApplications from '../host-dashboard/applications/HostApplications';
import HostDashboardAgreements from '../host-dashboard/HostDashboardAgreements';
import HostDashboardExpenses from '../host-dashboard/HostDashboardExpenses';
import HostDashboardHostedCollectives from '../host-dashboard/HostDashboardHostedCollectives';
import HostDashboardReports from '../host-dashboard/HostDashboardReports';
import LoadingPlaceholder from '../LoadingPlaceholder';
import NotFound from '../NotFound';

import Contributions from './sections/Contributions';
import Contributors from './sections/Contributors';
import Expenses from './sections/Expenses';
import SubmittedExpenses from './sections/SubmittedExpenses';
import Home from './sections/Home';
import Transactions from './sections/Transactions';
import VirtualCards from './sections/virtual-cards/VirtualCards';
import { DASHBOARD_SECTIONS, DASHBOARD_SETTINGS_SECTIONS, LEGACY_SECTIONS, SECTION_LABELS } from './constants';

const DASHBOARD_COMPONENTS = {
  [DASHBOARD_SECTIONS.HOSTED_COLLECTIVES]: HostDashboardHostedCollectives,
  [DASHBOARD_SECTIONS.FINANCIAL_CONTRIBUTIONS]: FinancialContributions,
  [DASHBOARD_SECTIONS.PENDING_CONTRIBUTIONS]: PendingContributions,
  [DASHBOARD_SECTIONS.HOST_EXPENSES]: HostDashboardExpenses,
  [DASHBOARD_SECTIONS.HOST_AGREEMENTS]: HostDashboardAgreements,
  [DASHBOARD_SECTIONS.HOST_APPLICATIONS]: HostApplications,
  [DASHBOARD_SECTIONS.REPORTS]: HostDashboardReports,
  [DASHBOARD_SECTIONS.HOST_VIRTUAL_CARDS]: HostVirtualCards,
  [DASHBOARD_SECTIONS.HOST_VIRTUAL_CARD_REQUESTS]: HostVirtualCardRequests,

  // NEW
  // [COLLECTIVE_SECTIONS.MANAGE_CONTRIBUTIONS]: ManageContributions,
  [DASHBOARD_SECTIONS.EXPENSES]: Expenses,
  [DASHBOARD_SECTIONS.OVERVIEW]: Home,
  [DASHBOARD_SECTIONS.CONTRIBUTORS]: Contributors,
  [DASHBOARD_SECTIONS.CONTRIBUTIONS]: Contributions,
  [DASHBOARD_SECTIONS.TRANSACTIONS]: Transactions,
  [DASHBOARD_SECTIONS.VIRTUAL_CARDS]: VirtualCards,
  [DASHBOARD_SECTIONS.SUBMITTED_EXPENSES]: SubmittedExpenses,
};

const SETTINGS_COMPONENTS = {
  [DASHBOARD_SETTINGS_SECTIONS.INVOICES_RECEIPTS]: InvoicesReceipts,
  [DASHBOARD_SETTINGS_SECTIONS.NOTIFICATIONS]: NotificationsSettings,
  [DASHBOARD_SETTINGS_SECTIONS.TEAM]: TeamSettings,
};

const Title = ({ className, children, ...props }: { className?: string; children: React.ReactNode }) => (
  <h1 className={cn('text-2xl font-bold leading-10 tracking-tight', className)} {...props}>
    {children}
  </h1>
);

const AdminPanelSection = ({ collective, isLoading, section, subpath }) => {
  const { formatMessage } = useIntl();

  if (isLoading) {
    return (
      <div className="w-full">
        <LoadingPlaceholder height={26} mb={4} maxWidth={500} />
        <LoadingPlaceholder height={300} />
      </div>
    );
  }

  const DashboardComponent = DASHBOARD_COMPONENTS[section];
  if (DashboardComponent) {
    return (
      <div className="w-full">
        {/* @ts-ignore-next-line */}
        <DashboardComponent account={collective} hostSlug={collective.slug} subpath={subpath} isDashboard={true} />
      </div>
    );
  }

  // Settings component
  const SettingsComponent = SETTINGS_COMPONENTS[section];
  if (SettingsComponent) {
    return (
      <div className="max-w-screen-md">
        <SettingsComponent account={collective} hostSlug={collective.slug} subpath={subpath} />
      </div>
    );
  }
  // Form
  if (values(LEGACY_SECTIONS).includes(section)) {
    return (
      <div className="max-w-screen-md">
        {SECTION_LABELS[section] && (
          <Box mb={3}>
            <Title>{formatMessage(SECTION_LABELS[section])}</Title>
          </Box>
        )}
        <AccountSettings account={collective} section={section} />
      </div>
    );
  }

  return (
    <Container display="flex" justifyContent="center" alignItems="center">
      <NotFound />
    </Container>
  );
};

AdminPanelSection.propTypes = {
  isLoading: PropTypes.bool,
  section: PropTypes.string,
  subpath: PropTypes.arrayOf(PropTypes.string),
  /** The account. Can be null if isLoading is true */
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string,
    isHost: PropTypes.bool,
  }),
};

export default AdminPanelSection;
