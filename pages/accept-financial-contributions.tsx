import React from 'react';
import { graphql } from '@apollo/client/react/hoc';

import { API_V1_CONTEXT } from '../lib/graphql/helpers';

import AuthenticatedPage from '../components/AuthenticatedPage';
import { collectivePageQuery } from '../components/collective-page/graphql/queries';
import Container from '../components/Container';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import { withUser } from '../components/UserProvider';
import AcceptContributionsThroughAFiscalHost from '@/components/accept-financial-contributions/AcceptContributionsThroughAFiscalHost';
import { SuccessPage } from '@/components/accept-financial-contributions/SuccessPage';

type AcceptFinancialContributionsPageProps = {
  slug?: string;
  state?: string;
  hostSlug?: string;
  loadingLoggedInUser?: boolean;
  LoggedInUser?: Record<string, unknown>;
  data?: {
    loading?: boolean;
    error?: unknown;
    Collective?: Record<string, unknown>;
  };
};

class AcceptFinancialContributionsPage extends React.Component<AcceptFinancialContributionsPageProps> {
  static async getInitialProps({ query }: { query: { slug?: string; state?: string; hostSlug?: string } }) {
    return {
      slug: query.slug,
      state: query.state,
      hostSlug: query.hostSlug,
    };
  }

  render() {
    const { data, state, hostSlug } = this.props;

    if (!data.loading && (!data || data.error)) {
      return <ErrorPage data={data} />;
    }

    const collective = data && data.Collective;
    return (
      <AuthenticatedPage>
        {data.loading ? (
          <Container py={[5, 6]}>
            <Loading />
          </Container>
        ) : state === 'success' ? (
          <SuccessPage collective={collective as never} hostSlug={hostSlug} />
        ) : (
          <AcceptContributionsThroughAFiscalHost collective={collective as never} />
        )}
      </AuthenticatedPage>
    );
  }
}

const addCollectivePageData = graphql<
  AcceptFinancialContributionsPageProps,
  { Collective?: Record<string, unknown>; loading?: boolean; error?: unknown },
  { slug?: string },
  { data?: AcceptFinancialContributionsPageProps['data'] }
>(collectivePageQuery, {
  options: (props: AcceptFinancialContributionsPageProps) => ({
    context: API_V1_CONTEXT,
    variables: { slug: props.slug },
  }),
});

// next.js export
// ts-unused-exports:disable-next-line
export default withUser(addCollectivePageData(AcceptFinancialContributionsPage));
