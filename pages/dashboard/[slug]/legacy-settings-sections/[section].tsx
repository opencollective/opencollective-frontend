import React from 'react';
import { values } from 'lodash';
import { useRouter } from 'next/router';
import { useIntl } from 'react-intl';

import { LEGACY_SECTIONS, LEGACY_SETTINGS_SECTIONS, SECTION_LABELS } from '../../../../components/dashboard/constants';
import { DashboardContext } from '../../../../components/dashboard/DashboardContext';
import DashboardHeader from '../../../../components/dashboard/DashboardHeader';
import DashboardPage from '../../../../components/dashboard/DashboardPage';
import AccountSettings from '../../../../components/dashboard/sections/AccountSettings';
import NotFound from '../../../../components/NotFound';

const SECTIONS = [...values(LEGACY_SECTIONS), ...values(LEGACY_SETTINGS_SECTIONS)];

export default function LegacySettingsSectionPage(props) {
  const router = useRouter();
  const section = router.query.section as string;

  if (!SECTIONS.includes(section)) {
    return <NotFound />;
  }

  return <DashboardPage {...props} Component={SectionComponent} slug={router.query.slug} section={section} />;
}

function SectionComponent() {
  const router = useRouter();
  const section = router.query.section as string;

  const { account } = React.useContext(DashboardContext);
  const intl = useIntl();

  return (
    <React.Fragment>
      <DashboardHeader className="mb-2" title={intl.formatMessage(SECTION_LABELS[section])} />
      <AccountSettings account={account} section={section} />
    </React.Fragment>
  );
}
