import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import CaseStudies from '../components/become-a-host/CaseStudiesSection';
import FiscalSponsorship from '../components/become-a-host/FiscalSponsorshipSection';
import WhatAreTheBenefits from '../components/become-a-host/WhatAreTheBenefitsSection';
import WhoAreFiscalHosts from '../components/become-a-host/WhoAreFiscalHostsSection';
import JoinUs from '../components/home/sections/JoinUs';
import Page from '../components/Page';

const menuItems = { pricing: true, howItWorks: true };

const messages = defineMessages({
  defaultTitle: {
    id: 'OC.tagline',
    defaultMessage: 'Make your community sustainable. Collect and spend money transparently.',
  },
});

const BecomeAHost = () => {
  const { formatMessage } = useIntl();
  return (
    <Page menuItems={menuItems} description={formatMessage(messages.defaultTitle)}>
      <FiscalSponsorship />
      <WhoAreFiscalHosts />
      <WhatAreTheBenefits />
      <CaseStudies />
      <JoinUs page="becomeAHost" />
    </Page>
  );
};

export default BecomeAHost;
