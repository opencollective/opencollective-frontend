import React from 'react';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import { ALL_SECTIONS, SECTION_LABELS } from '../../../components/dashboard/constants';
import { DashboardContext } from '../../../components/dashboard/DashboardContext';
import DashboardHeader from '../../../components/dashboard/DashboardHeader';
import DashboardPage from '../../../components/dashboard/DashboardPage';
import AccountSettings from '../../../components/dashboard/sections/AccountSettings';

export default function TiersPage(props) {
  const router = useRouter();

  return (
    <DashboardPage {...props} Component={TicketsComponent} slug={router.query.slug} section={ALL_SECTIONS.TICKETS} />
  );
}

function TicketsComponent() {
  const { account } = React.useContext(DashboardContext);
  const intl = useIntl();

  return (
    <React.Fragment>
      <DashboardHeader className="mb-2" title={intl.formatMessage(SECTION_LABELS[ALL_SECTIONS.TICKETS])} />
      <AccountSettings account={account} section={ALL_SECTIONS.TICKETS} />
    </React.Fragment>
  );
}
