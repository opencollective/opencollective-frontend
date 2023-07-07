import React from 'react';
import PropTypes from 'prop-types';
import { values } from 'lodash';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import AccountSettings from '../admin-panel/sections/AccountSettings';
import FinancialContributions from '../admin-panel/sections/FinancialContributions';
import HostVirtualCards from '../admin-panel/sections/HostVirtualCards';
import InvoicesReceipts from '../admin-panel/sections/invoices-receipts/InvoicesReceipts';
import NotificationsSettings from '../admin-panel/sections/NotificationsSettings';
import PendingContributions from '../admin-panel/sections/PendingContributions';
import TeamSettings from '../admin-panel/sections/Team';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import PendingApplications from '../host-dashboard/applications/PendingApplications';
import HostDashboardAgreements from '../host-dashboard/HostDashboardAgreements';
import HostDashboardExpenses from '../host-dashboard/HostDashboardExpenses';
import HostDashboardHostedCollectives from '../host-dashboard/HostDashboardHostedCollectives';
import HostDashboardReports from '../host-dashboard/HostDashboardReports';
import LoadingPlaceholder from '../LoadingPlaceholder';
import NotFound from '../NotFound';
import { H1, H2, P } from '../Text';
import TopSideBar from './TopSideBar';
import Contributions from './sections/Contributions';
import Expenses from './sections/Expenses';
import ManageContributions from './sections/ManageContributions';
import Overview from './sections/Overview';
import Transactions from './sections/Transactions';
import { FormattedMessage } from 'react-intl';
import StyledHr from '../StyledHr';
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
  [HOST_DASHBOARD_SECTIONS.PENDING_APPLICATIONS]: PendingApplications,
  [HOST_DASHBOARD_SECTIONS.REPORTS]: HostDashboardReports,
  [HOST_DASHBOARD_SECTIONS.HOST_VIRTUAL_CARDS]: HostVirtualCards,
  // [COLLECTIVE_SECTIONS.NOTIFICATIONS]: NotificationsSettings,
  // [COLLECTIVE_SECTIONS.TEAM]: TeamSettings,
  // NEW
  [COLLECTIVE_SECTIONS.MANAGE_CONTRIBUTIONS]: ManageContributions,
  [COLLECTIVE_SECTIONS.EXPENSES]: Expenses,
  [COLLECTIVE_SECTIONS.OVERVIEW]: Overview,
  [COLLECTIVE_SECTIONS.CONTRIBUTIONS]: Contributions,
  [COLLECTIVE_SECTIONS.TRANSACTIONS]: Transactions,
};

const FISCAL_HOST_SETTINGS_SECTIONS = {
  [FISCAL_HOST_SECTIONS.INVOICES_RECEIPTS]: InvoicesReceipts,
  [COLLECTIVE_SECTIONS.NOTIFICATIONS]: NotificationsSettings,
  [COLLECTIVE_SECTIONS.TEAM]: TeamSettings,
};

const Title = styled(H2)`
  font-size: 24px;
  font-weight: 700;
  line-height: 36px;
  letter-spacing: -0.025em;
`;

const AdminPanelSection = ({ collective, isLoading, section, subpath, useTopBar }) => {
  const { formatMessage } = useIntl();

  if (isLoading) {
    return (
      <Flex flex={1} flexDirection="column" alignItems="center" width="100%" px={2}>
        <LoadingPlaceholder height={26} mb={4} maxWidth={500} />
        <LoadingPlaceholder height={300} />
      </Flex>
    );
  }

  const AdminSectionComponent = ADMIN_PANEL_SECTIONS[section];
  if (AdminSectionComponent) {
    return (
      <Flex flex={1} justifyContent="start">
        <AdminSectionComponent account={collective} hostSlug={collective.slug} subpath={subpath} isDashboard={true} />
      </Flex>
    );
  }

  // Fiscal Host Settings
  const FiscalHostSettingsComponent = FISCAL_HOST_SETTINGS_SECTIONS[section];

  // Form
  if (values(LEGACY_COLLECTIVE_SETTINGS_SECTIONS).includes(section) || FiscalHostSettingsComponent) {
    return (
      <Flex flex={1} mx="auto" flexDirection="column" alignItems="start" maxWidth={1200}>
        <H1 fontSize="24px" lineHeight="36px" fontWeight={700} color="black.900" letterSpacing="-.025em">
          <FormattedMessage defaultMessage="Settings" />
        </H1>
        <P mt={1} color="#71717a" fontSize="14px" lineHeight="20px" letterSpacing={0} fontWeight={400}>
          <FormattedMessage id="Dashboard.Settings.Description" defaultMessage="Manage your account settings" />
        </P>
        <StyledHr my={3} width={'100%'} borderColor="#e5e7eb" />
        <Flex flex={1} flexDirection="row" gridGap={3}>
          <TopSideBar />

          <Flex flex={1} flexDirection="column">
            {FiscalHostSettingsComponent ? (
              <FiscalHostSettingsComponent collective={collective} account={collective} />
            ) : (
              <React.Fragment>
                {SECTION_LABELS[section] && (
                  <Box mb={3}>
                    <Title>{formatMessage(SECTION_LABELS[section])}</Title>
                  </Box>
                )}
                <AccountSettings account={collective} section={section} />
              </React.Fragment>
            )}
          </Flex>
        </Flex>
      </Flex>
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
