import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { defineMessages, useIntl } from 'react-intl';

import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { getFromLocalStorage, LOCAL_STORAGE_KEYS } from '../lib/local-storage';
import { PREVIEW_FEATURE_KEYS } from '../lib/preview-features';

import JoinUsSection from '../components/collectives/sections/JoinUs';
import Dashboard from '../components/dashboard';
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
  const { LoggedInUser, loadingLoggedInUser } = useLoggedInUser();
  const router = useRouter();
  const hasDashboardEnabled = LoggedInUser?.hasPreviewFeatureEnabled(PREVIEW_FEATURE_KEYS.DASHBOARD);
  useEffect(() => {
    if (router.asPath === '/' && hasDashboardEnabled) {
      router.replace(`/dashboard`, undefined, { shallow: true });
    } else if (router.asPath === '/dashboard' && !hasDashboardEnabled) {
      router.replace(`/`, undefined, { shallow: true });
    }
  }, [hasDashboardEnabled]);

  if (hasDashboardEnabled && router.asPath !== '/home') {
    return <Dashboard />;
  }
  // prevent flashing of landing page when loading user, also check if there is a token to prevent showing this to non-logged in users and robots
  if (getFromLocalStorage(LOCAL_STORAGE_KEYS.ACCESS_TOKEN) && loadingLoggedInUser) {
    return null;
  }

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

HomePage.getInitialProps = ({ req, res }) => {
  if (res && req && (req.language || req.locale === 'en')) {
    res.set('Cache-Control', 'public, s-maxage=3600');
  }

  let skipDataFromTree = false;

  // If on server side
  if (req) {
    skipDataFromTree = true;
  }

  return {
    skipDataFromTree,
    scripts: { googleMaps: true },
  };
};

export default HomePage;
