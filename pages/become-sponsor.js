import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import GiftOfGivingSection from '../components/become-a-sponsor/GiftOfGivingSection';
import MoreFeaturesSection from '../components/become-a-sponsor/MoreFeaturesSection';
import Page from '../components/Page';

const menuItems = { pricing: true, howItWorks: true };

const messages = defineMessages({
  defaultTitle: {
    id: 'OC.tagline',
    defaultMessage: 'Make your community sustainable. Collect and spend money transparently.',
  },
});

const BecomeASponsor = () => {
  const { formatMessage } = useIntl();
  return (
    <Page menuItems={menuItems} description={formatMessage(messages.defaultTitle)}>
      <MoreFeaturesSection />
      <GiftOfGivingSection />
    </Page>
  );
};

export default BecomeASponsor;
