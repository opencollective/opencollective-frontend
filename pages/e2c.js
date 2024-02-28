import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import LearnMore from '../components/collectives/sections/LearnMore';
import WeAreOpen from '../components/collectives/sections/WeAreOpen';
import ExitToCommunity from '../components/e2c/ExitToCommunitySection';
import InvestingInTheCommons from '../components/e2c/InvestingInTheCommonsSection';
import JoinTheMovement from '../components/e2c/JoinTheMovementSection';
import OCIsATechPlatform from '../components/e2c/OCIsATechPlatformSection';
import ResourcesSection from '../components/e2c/ResourcesSection';
import WhatDoesE2CMean from '../components/e2c/WhatDoesE2CMeanSection';
import Page from '../components/Page';

const messages = defineMessages({
  defaultTitle: {
    id: 'OC.e2c',
    defaultMessage: 'Exit to Community',
  },
});

const E2C = () => {
  const { formatMessage } = useIntl();
  return (
    <Page description={formatMessage(messages.defaultTitle)}>
      <ExitToCommunity />
      <WhatDoesE2CMean />
      <InvestingInTheCommons />
      <OCIsATechPlatform />
      <ResourcesSection />
      <WeAreOpen />
      <LearnMore page="e2c" />
      <JoinTheMovement />
    </Page>
  );
};

// ignore unused exports default
// next.js export
export default E2C;
