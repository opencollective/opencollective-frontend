import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get, omit } from 'lodash';
import { withRouter } from 'next/router';
import { injectIntl } from 'react-intl';

import { GQLV2_SUPPORTED_PAYMENT_METHOD_TYPES } from '../lib/constants/payment-methods';
import { generateNotFoundError, getErrorFromGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { addParentToURLIfMissing, getCollectivePageRoute } from '../lib/url-helpers';
import { compose } from '../lib/utils';

import Container from '../components/Container';
import { PAYMENT_FLOW } from '../components/contribution-flow/constants';
import ContributionBlocker, {
  CONTRIBUTION_BLOCKER,
  getContributionBlocker,
} from '../components/contribution-flow/ContributionBlocker';
import {
  contributionFlowAccountQuery,
  contributionFlowAccountWithTierQuery,
} from '../components/contribution-flow/graphql/queries';
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
      paymentFlow: query.paymentFlow,
      // Query parameters
      error: query.error,
    };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    paymentFlow: PropTypes.string,
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
    const { data = {}, paymentFlow, LoggedInUser, error } = this.props;
    const { account, tier } = data;
    const isCrypto = paymentFlow === PAYMENT_FLOW.CRYPTO;

    if (data.loading) {
      return (
        <Container py={[5, 6]}>
          <Loading />
        </Container>
      );
    }

    const contributionBlocker = getContributionBlocker(
      LoggedInUser,
      account,
      tier,
      Boolean(this.props.tierId),
      isCrypto,
    );

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
          paymentFlow={paymentFlow}
          error={error}
        />
      );
    }
  }

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
        menuItemsV2={{ solutions: false, product: false, company: false, docs: false }}
        showSearch={false}
      >
        {this.renderPageContent()}
      </Page>
    );
  }
}

const addAccountData = graphql(contributionFlowAccountQuery, {
  skip: props => Boolean(props.tierId),
  options: props => ({
    variables: { collectiveSlug: props.collectiveSlug },
    context: API_V2_CONTEXT,
  }),
});

const addAccountWithTierData = graphql(contributionFlowAccountWithTierQuery, {
  skip: props => !props.tierId,
  options: props => ({
    variables: { collectiveSlug: props.collectiveSlug, tier: { legacyId: props.tierId } },
    context: API_V2_CONTEXT,
  }),
});

const addGraphql = compose(addAccountData, addAccountWithTierData);

export default addGraphql(withUser(injectIntl(withStripeLoader(withRouter(NewContributionFlowPage)))));
