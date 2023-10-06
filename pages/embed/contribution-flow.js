import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { withRouter } from 'next/router';
import { injectIntl } from 'react-intl';

import { GQLV2_SUPPORTED_PAYMENT_METHOD_TYPES } from '../../lib/constants/payment-methods';
import { generateNotFoundError, getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { addParentToURLIfMissing } from '../../lib/url-helpers';

import CollectiveThemeProvider from '../../components/CollectiveThemeProvider';
import Container from '../../components/Container';
import ContributionBlocker, { getContributionBlocker } from '../../components/contribution-flow/ContributionBlocker';
import { contributionFlowAccountQuery } from '../../components/contribution-flow/graphql/queries';
import ContributionFlowContainer from '../../components/contribution-flow/index';
import { EmbedContributionFlowUrlQueryHelper } from '../../components/contribution-flow/query-parameters';
import { getContributionFlowMetadata } from '../../components/contribution-flow/utils';
import EmbeddedPage from '../../components/EmbeddedPage';
import ErrorPage from '../../components/ErrorPage';
import { Box } from '../../components/Grid';
import Loading from '../../components/Loading';
import { withStripeLoader } from '../../components/StripeProvider';
import { withUser } from '../../components/UserProvider';

class EmbedContributionFlowPage extends React.Component {
  static getInitialProps({ query, res }) {
    if (res) {
      res.removeHeader('X-Frame-Options');
    }

    return {
      // Route parameters
      collectiveSlug: query.eventSlug || query.collectiveSlug,
      tierId: parseInt(query.tierId) || null,
      // Query parameters
      error: query.error,
      queryParams: EmbedContributionFlowUrlQueryHelper.decode(query),
    };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    tierId: PropTypes.number,
    error: PropTypes.string,
    data: PropTypes.shape({
      loading: PropTypes.bool,
      error: PropTypes.any,
      account: PropTypes.object,
      tier: PropTypes.object,
    }), // from withData
    intl: PropTypes.object,
    loadStripe: PropTypes.func,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    router: PropTypes.object,
    queryParams: PropTypes.shape({
      useTheme: PropTypes.bool,
      backgroundColor: PropTypes.string,
    }),
  };

  componentDidMount() {
    this.loadExternalScripts();
    const { router, data } = this.props;
    const account = data?.account;
    const path = router.asPath;
    const rawPath = path.replace(new RegExp(`^/embed/${account?.slug}/`), '/');
    addParentToURLIfMissing(router, account, rawPath, undefined, { prefix: '/embed' });
  }

  componentDidUpdate(prevProps) {
    const hostPath = 'data.account.host';
    if (get(this.props, hostPath) !== get(prevProps, hostPath)) {
      this.loadExternalScripts();
    }
  }

  loadExternalScripts() {
    const supportedPaymentMethods = get(this.props.data, 'account.host.supportedPaymentMethods', []);
    if (supportedPaymentMethods.includes(GQLV2_SUPPORTED_PAYMENT_METHOD_TYPES.CREDIT_CARD)) {
      this.props.loadStripe();
    }
  }

  getPageMetadata() {
    const { intl, data } = this.props;
    return {
      ...getContributionFlowMetadata(intl, data?.account, data?.tier),
      canonicalURL: null,
    };
  }

  renderPageContent() {
    const { data = {}, LoggedInUser } = this.props;
    const { account, tier } = data;

    if (data.loading) {
      return (
        <Container py={[5, 6]}>
          <Loading />
        </Container>
      );
    }

    const contributionBlocker = getContributionBlocker(LoggedInUser, account, tier, Boolean(this.props.tierId));
    if (contributionBlocker) {
      return <ContributionBlocker blocker={contributionBlocker} account={account} />;
    } else {
      return (
        <Box height="100%" pt={3}>
          <ContributionFlowContainer
            isEmbed
            collective={account}
            host={account.host}
            tier={tier}
            error={this.props.error}
          />
        </Box>
      );
    }
  }

  render() {
    const { data, queryParams } = this.props;
    if (!data.loading && !data.account) {
      const error = data.error
        ? getErrorFromGraphqlException(data.error)
        : generateNotFoundError(this.props.collectiveSlug);

      return <ErrorPage error={error} />;
    } else {
      return (
        <CollectiveThemeProvider collective={queryParams.useTheme ? data.account : null}>
          <EmbeddedPage backgroundColor={queryParams.backgroundColor}>{this.renderPageContent()}</EmbeddedPage>
        </CollectiveThemeProvider>
      );
    }
  }
}

const addContributionFlowData = graphql(contributionFlowAccountQuery, {
  options: props => ({
    variables: { collectiveSlug: props.collectiveSlug, tierId: props.tierId, includeTier: Boolean(props.tierId) },
    context: API_V2_CONTEXT,
  }),
});

export default addContributionFlowData(withUser(injectIntl(withStripeLoader(withRouter(EmbedContributionFlowPage)))));
