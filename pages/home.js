import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import Banner from '../components/collectives/Banner';
import JoinUsSection from '../components/collectives/sections/JoinUs';
import CollaborateWithMoney from '../components/home/CollaborateWithMoneySection';
import DedicatedTeam from '../components/home/DedicatedTeamSection';
import GetToKnowUs from '../components/home/GetToKnowUsSection';
import OpenCollectiveIs from '../components/home/OpenCollectiveIsSection';
import RaiseMoney from '../components/home/RaiseMoneySection';
import TheFutureIsCollective from '../components/home/TheFutureIsCollectiveSection';
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
      <Banner />
      <TheFutureIsCollective />
      <RaiseMoney />
      <OpenCollectiveIs />
      <CollaborateWithMoney />
      <DedicatedTeam />
      <GetToKnowUs />
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
