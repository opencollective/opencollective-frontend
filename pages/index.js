import React from 'react';

import Page from '../components/Page';
import MakeCommunitySection from '../components/home/sections/MakeCommunity';
import WhatCanYouDoSection from '../components/home/sections/WhatCanYouDo';
import FeaturesSection from '../components/home/sections/Features';
import OCUsersSection from '../components/home/sections/OCUsers';
import FiscalHostSection from '../components/home/sections/FiscalHost';
import WeAreOpenSection from '../components/home/sections/WeAreOpen';
import LearnMoreSection from '../components/home/sections/LearnMore';
import JoinUsSection from '../components/home/sections/JoinUs';
import { useIntl, defineMessages } from 'react-intl';
import CovidBanner from '../components/banners/CovidBanner';

const menuItems = { pricing: true, howItWorks: true };

const messages = defineMessages({
  defaultTitle: {
    id: 'OC.tagline',
    defaultMessage: 'Make your community sustainable. Collect and spend money transparently.',
  },
});

const HomePage = () => {
  const { formatMessage } = useIntl();
  return (
    <Page menuItems={menuItems} description={formatMessage(messages.defaultTitle)}>
      <MakeCommunitySection />
      <WhatCanYouDoSection />
      <FeaturesSection />
      <OCUsersSection />
      <FiscalHostSection />
      <WeAreOpenSection />
      <LearnMoreSection />
      <JoinUsSection />
      <CovidBanner showLink={true} />
    </Page>
  );
};

export default HomePage;
