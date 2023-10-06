import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import cookie from 'cookie';
import { getRequestIntl } from '../lib/i18n/request';

// import Banner from '../components/collectives/Banner';
import JoinUsSection from '../components/collectives/sections/JoinUs';
import CollaborateWithMoney from '../components/home/CollaborateWithMoneySection';
import DedicatedTeam from '../components/home/DedicatedTeamSection';
import GetToKnowUs from '../components/home/GetToKnowUsSection';
import OpenCollectiveIs from '../components/home/OpenCollectiveIsSection';
import RaiseMoney from '../components/home/RaiseMoneySection';
import TheFutureIsCollective from '../components/home/TheFutureIsCollectiveSection';
import Page from '../components/Page';

const messages = defineMessages({
  defaultTitle: {
    defaultMessage: 'Raise and spend money with full transparency.',
  },
  defaultDescription: {
    defaultMessage:
      'Open Collective is a legal and financial toolbox for groups. It’s a fundraising + legal status + money management platform for your community. What do you want to do?',
  },
});

const HomePage = () => {
  const { formatMessage } = useIntl();

  return (
    <Page
      metaTitle={formatMessage(messages.defaultTitle)}
      title={formatMessage(messages.defaultTitle)}
      description={formatMessage(messages.defaultDescription)}
    >
      {/*
      <Banner />
      */}
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

export const getServerSideProps = async context => {
  const cookies = cookie.parse((context.req && context.req.headers.cookie) || '');
  console.log('cookies', cookies);
  const redirectToDashboard = cookies.redirectToDashboard === 'true';

  if (redirectToDashboard) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  const { req, res } = context;
  if (res && req) {
    const { locale } = getRequestIntl(req);
    if (locale === 'en') {
      res.setHeader('Cache-Control', 'public, s-maxage=3600');
    }
  }

  let skipDataFromTree = false;

  // If on server side
  if (req) {
    skipDataFromTree = true;
  }
  return { props: { skipDataFromTree } };
};

export default HomePage;
