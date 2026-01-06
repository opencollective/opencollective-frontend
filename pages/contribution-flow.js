import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get, omit } from 'lodash';
import { withRouter } from 'next/router';
import { injectIntl } from 'react-intl';

import { GQLV2_SUPPORTED_PAYMENT_METHOD_TYPES } from '../lib/constants/payment-methods';
import { generateNotFoundError, getErrorFromGraphqlException } from '../lib/errors';
import { addParentToURLIfMissing, getCollectivePageRoute } from '../lib/url-helpers';

import Container from '../components/Container';
import ContributionBlocker, {
  CONTRIBUTION_BLOCKER,
  getContributionBlocker,
} from '../components/contribution-flow/ContributionBlocker';
import { contributionFlowAccountQuery } from '../components/contribution-flow/graphql/queries';
import ContributionFlowContainer from '../components/contribution-flow/index';
import { getContributionFlowMetadata } from '../components/contribution-flow/utils';
import ErrorPage from '../components/ErrorPage';
import Loading from '../components/Loading';
import Page from '../components/Page';
import Redirect from '../components/Redirect';
import { withStripeLoader } from '../components/StripeProvider';
import { withUser } from '../components/UserProvider';

class NewContributionFlowPage extends React.Component {
  static getInitialProps({ query }) {
    return {
      // Route parameters
      collectiveSlug: query.eventSlug || query.collectiveSlug,
      tierId: parseInt(query.tierId) || null,
      // Query parameters
      error: query.error,
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
      me: PropTypes.object,
      tier: PropTypes.object,
      refetch: PropTypes.func,
    }), // from withData
    intl: PropTypes.object,
    loadStripe: PropTypes.func,
    LoggedInUser: PropTypes.object,
    loadingLoggedInUser: PropTypes.bool,
    router: PropTypes.object,
  };

  componentDidMount() {
    this.loadExternalScripts();
    const { router, data } = this.props;
    const account = data?.account;
    const queryParameters = {
      ...omit(router.query, ['verb', 'step', 'collectiveSlug']),
    };
    addParentToURLIfMissing(router, account, `/${router.query.verb}/${router.query.step ?? ''}`, queryParameters);
  }

  componentDidUpdate(prevProps) {
    const hostPath = 'data.account.host';
    if (get(this.props, hostPath) !== get(prevProps, hostPath)) {
      this.loadExternalScripts();
    }
    if (this.props.LoggedInUser && !this.props.data.me) {
      this.props.data.refetch();
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
    return getContributionFlowMetadata(intl, data?.account, data?.tier);
  }

  renderPageContent() {
    const { data = {}, LoggedInUser, error } = this.props;
    const { account, tier, me } = data;

    if (data.loading) {
      return (
        <Container py={[5, 6]}>
          <Loading />
        </Container>
      );
    }

    const contributionBlocker = getContributionBlocker(LoggedInUser, account, tier, Boolean(this.props.tierId));

    if (contributionBlocker) {
      if (contributionBlocker.reason === CONTRIBUTION_BLOCKER.NO_CUSTOM_CONTRIBUTION) {
        return <Redirect to={`${getCollectivePageRoute(account)}/contribute`} />;
      }

      return <ContributionBlocker blocker={contributionBlocker} account={account} />;
    } else {
      return (
        <ContributionFlowContainer
          collective={account}
          host={account.host}
          tier={tier}
          contributorProfiles={me?.contributorProfiles || []}
          error={error}
        />
      );
    }
  }

  getNoRobots = () => {
    const { router } = this.props;
    const personalInfoFields = ['contributeAs', 'customData', 'redirect', 'email', 'name', 'legalName'];
    return personalInfoFields.some(field => Boolean(router.query?.[field]));
  };

  render() {
    const { data } = this.props;
    if (!data.loading && !data.account) {
      const error = data.error
        ? getErrorFromGraphqlException(data.error)
        : generateNotFoundError(this.props.collectiveSlug);

      return <ErrorPage error={error} />;
    }

    return (
      <Page
        {...this.getPageMetadata()}
        showFooter={false}
        showMenuItems={false}
        showSearch={false}
        collective={data.account}
        noRobots={this.getNoRobots()}
      >
        {this.renderPageContent()}
      </Page>
    );
  }
}

const addContributionFlowData = graphql(contributionFlowAccountQuery, {
  options: props => ({
    variables: { collectiveSlug: props.collectiveSlug, tierId: props.tierId, includeTier: Boolean(props.tierId) },
  }),
});

// next.js export
// ts-unused-exports:disable-next-line
export default addContributionFlowData(withUser(injectIntl(withStripeLoader(withRouter(NewContributionFlowPage)))));
