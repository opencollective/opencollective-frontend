import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import CreateCollective from '../components/home/sections/CreateCollective';
import FeaturesSection from '../components/home/sections/Features';
import FiscalHostSection from '../components/home/sections/FiscalHost';
import JoinUsSection from '../components/home/sections/JoinUs';
import LearnMoreSection from '../components/home/sections/LearnMore';
import MakeCommunitySection from '../components/home/sections/MakeCommunity';
import OCUsersSection from '../components/home/sections/OCUsers';
import WeAreOpenSection from '../components/home/sections/WeAreOpen';
import WhatCanYouDoSection from '../components/home/sections/WhatCanYouDo';
import Page from '../components/Page';

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
      <FiscalHostSection />
      <CreateCollective />
      <OCUsersSection />
      <WeAreOpenSection />
      <LearnMoreSection />
      <JoinUsSection />
    </Page>
  );
};

HomePage.getInitialProps = ({ req, res }) => {
  if (res && req && (req.language || req.locale === 'en')) {
    res.set('Cache-Control', 'public, s-maxage=3600');
  }

  let skipDataFromTree = false;

  // If on server side
  if (req) {
    skipDataFromTree = true;
  }

  return { skipDataFromTree };
};

export default HomePage;
