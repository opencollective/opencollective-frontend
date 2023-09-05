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
import Home from './sections/Home';
import ManageContributions from './sections/ManageContributions';
import Transactions from './sections/Transactions';
import {
  COLLECTIVE_SECTIONS,
  FISCAL_HOST_SECTIONS,
  HOST_DASHBOARD_SECTIONS,
  LEGACY_COLLECTIVE_SETTINGS_SECTIONS,
  SECTION_LABELS,
} from './constants';

const ADMIN_PANEL_SECTIONS = {
  [HOST_DASHBOARD_SECTIONS.HOSTED_COLLECTIVES]: HostDashboardHostedCollectives,
  [HOST_DASHBOARD_SECTIONS.FINANCIAL_CONTRIBUTIONS]: FinancialContributions,
  [HOST_DASHBOARD_SECTIONS.PENDING_CONTRIBUTIONS]: PendingContributions,
  [HOST_DASHBOARD_SECTIONS.HOST_EXPENSES]: HostDashboardExpenses,
  [HOST_DASHBOARD_SECTIONS.HOST_AGREEMENTS]: HostDashboardAgreements,
  [HOST_DASHBOARD_SECTIONS.HOST_APPLICATIONS]: HostApplications,
  [HOST_DASHBOARD_SECTIONS.REPORTS]: HostDashboardReports,
  [HOST_DASHBOARD_SECTIONS.HOST_VIRTUAL_CARDS]: HostVirtualCards,
  [HOST_DASHBOARD_SECTIONS.HOST_VIRTUAL_CARD_REQUESTS]: HostVirtualCardRequests,
  [COLLECTIVE_SECTIONS.NOTIFICATIONS]: NotificationsSettings,
  [COLLECTIVE_SECTIONS.TEAM]: TeamSettings,
  // NEW
  [COLLECTIVE_SECTIONS.MANAGE_CONTRIBUTIONS]: ManageContributions,
  [COLLECTIVE_SECTIONS.EXPENSES]: Expenses,
  [COLLECTIVE_SECTIONS.DASHBOARD_OVERVIEW]: Home,
  [COLLECTIVE_SECTIONS.CONTRIBUTORS]: Contributors,
  [COLLECTIVE_SECTIONS.CONTRIBUTIONS]: Contributions,
  [COLLECTIVE_SECTIONS.TRANSACTIONS]: Transactions,
};

const FISCAL_HOST_SETTINGS_SECTIONS = {
  [FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS]: InvoicesReceipts,
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
      <Container width="100%" px={2}>
        <LoadingPlaceholder height={26} mb={4} maxWidth={500} />
        <LoadingPlaceholder height={300} />
      </Container>
    );
  }

  const AdminSectionComponent = ADMIN_PANEL_SECTIONS[section];
  if (AdminSectionComponent) {
    return (
      <Container width="100%">
        {/* @ts-ignore-next-line */}
        <AdminSectionComponent account={collective} hostSlug={collective.slug} subpath={subpath} isDashboard={true} />
      </Container>
    );
  }

  // Fiscal Host Settings
  const FiscalHostSettingsComponent = FISCAL_HOST_SETTINGS_SECTIONS[section];
  if (FiscalHostSettingsComponent) {
    return (
      <Container width="100%">
        <FiscalHostSettingsComponent collective={collective} />
      </Container>
    );
  }

  // Form
  if (values(LEGACY_COLLECTIVE_SETTINGS_SECTIONS).includes(section)) {
    return (
      <Container width="100%">
        {SECTION_LABELS[section] && (
          <Box mb={3}>
            <Title>{formatMessage(SECTION_LABELS[section])}</Title>
          </Box>
        )}
        <AccountSettings account={collective} section={section} />
      </Container>
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
