import React from 'react';
import { defineMessages, useIntl } from 'react-intl';
import { parseCookies } from 'nookies';
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

// HomePage.getInitialProps = ({ req, res }) => {
//   if (res && req) {
//     const { locale } = getRequestIntl(req);
//     if (locale === 'en') {
//       res.setHeader('Cache-Control', 'public, s-maxage=3600');
//     }
//   }

//   let skipDataFromTree = false;

//   // If on server side
//   if (req) {
//     skipDataFromTree = true;
//   }

//   return { skipDataFromTree };
// };

export const getServerSideProps = async ctx => {
  const cookies = parseCookies(ctx);
  const rootPath = cookies.rootPath;
  console.log({ query: ctx.query, ctx });
  // const props = getPropsFromQuery(ctx.query);
  // const variables = getVariablesFromQuery(ctx.query);

  // // Fetch data from GraphQL API for SSR
  // const client = initClient();
  // const { data, error } = await client.query({
  //   query: expensesPageQuery,
  //   variables,
  //   context: API_V2_CONTEXT,
  //   fetchPolicy: 'network-only',
  //   errorPolicy: 'ignore',
  // });

  // return {
  //   props: {
  //     ...props,
  //     data,
  //     error: error || null,
  //   },
  // };
  if (ctx.req.url === '/' && rootPath === 'dashboard') {
    console.log('redirecting');
    // Redirect to another page if the cookie has a certain value
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }

  // Otherwise, return the usual props
  return {
    props: {},
  };
};

export default HomePage;
