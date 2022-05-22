import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import JoinUsSection from '../components/home/sections/JoinUs';
import CollaborateWithMoney from '../components/new-homepage/CollaborateWithMoneySection';
import DedicatedTeam from '../components/new-homepage/DedicatedTeamSection';
import GetToKnowUs from '../components/new-homepage/GetToKnowUsSection';
import OpenCollectiveIs from '../components/new-homepage/OpenCollectiveIsSection';
import RaiseMoney from '../components/new-homepage/RaiseMoneySection';
import TheFutureIsCollective from '../components/new-homepage/TheFutureIsCollectiveSection';
import Page from '../components/Page';

const menuItems = { pricing: true, howItWorks: true };

const messages = defineMessages({
  defaultTitle: {
    id: 'OC.tagline',
    defaultMessage: 'Make your community sustainable. Collect and spend money transparently.',
  },
});

const NewHomePage = () => {
  const { formatMessage } = useIntl();
  return (
    <Page menuItems={menuItems} description={formatMessage(messages.defaultTitle)}>
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

NewHomePage.getInitialProps = ({ req, res }) => {
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

export default NewHomePage;
