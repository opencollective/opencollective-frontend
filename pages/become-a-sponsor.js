import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import GiftOfGivingSection from '../components/become-a-sponsor/GiftOfGivingSection';
import MoreFeaturesSection from '../components/become-a-sponsor/MoreFeaturesSection';
import SupportCommunitiesSection from '../components/become-a-sponsor/SupportCommunitiesSection';
import SupportProjectsSection from '../components/become-a-sponsor/SupportProjectsSection';
import TransparencySection from '../components/become-a-sponsor/TransparencySection';
import Page from '../components/Page';

const messages = defineMessages({
  defaultTitle: {
    id: 'OC.tagline',
    defaultMessage: 'Make your community sustainable. Collect and spend money transparently.',
  },
});

const BecomeASponsor = () => {
  const { formatMessage } = useIntl();
  return (
    <Page description={formatMessage(messages.defaultTitle)}>
      <SupportProjectsSection />
      <SupportCommunitiesSection />
      <TransparencySection />
      <MoreFeaturesSection />
      <GiftOfGivingSection />
    </Page>
  );
};

// ignore unused exports default
// next.js export
export default BecomeASponsor;
