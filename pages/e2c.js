import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import ExitToCommunitySection from '../components/e2c/ExitToCommunitySection';
import InvestingInTheCommons from '../components/e2c/InvestingInTheCommonsSection';
import OCIsATechPlatform from '../components/e2c/OCIsATechPlatformSection';
import WhatDoesE2CMean from '../components/e2c/WhatDoesE2CMeanSection';
import JoinUs from '../components/home/sections/JoinUs';
import LearnMore from '../components/home/sections/LearnMore';
import WeAreOpen from '../components/home/sections/WeAreOpen';
import Page from '../components/Page';

const menuItems = { pricing: true };

const messages = defineMessages({
  defaultTitle: {
    id: 'OC.e2c',
    defaultMessage: 'Exit to Community',
  },
});

const E2C = () => {
  const { formatMessage } = useIntl();
  return (
    <Page menuItems={menuItems} description={formatMessage(messages.defaultTitle)}>
      <ExitToCommunitySection />
      <WhatDoesE2CMean />
      <InvestingInTheCommons />
      <OCIsATechPlatform />
      <WeAreOpen />
      <LearnMore page="e2c" />
      <JoinUs page="e2c" />
    </Page>
  );
};

export default E2C;
