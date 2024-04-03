import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get, omit } from 'lodash';
import { withRouter } from 'next/router';
import { injectIntl } from 'react-intl';

import { checkIfOCF } from '../lib/collective';
import { GQLV2_SUPPORTED_PAYMENT_METHOD_TYPES } from '../lib/constants/payment-methods';
import { generateNotFoundError, getErrorFromGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
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
import { OCFBannerWithData } from '../components/OCFBanner';
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
    const { data = {}, LoggedInUser, error } = this.props;
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
      if (contributionBlocker.reason === CONTRIBUTION_BLOCKER.NO_CUSTOM_CONTRIBUTION) {
        return <Redirect to={`${getCollectivePageRoute(account)}/contribute`} />;
      }

      const isOCF = checkIfOCF(account.host);
      return (
        <React.Fragment>
          {isOCF ? (
            <div className="mx-auto max-w-[500px] py-16">
              <OCFBannerWithData collective={account} isSimplified />
            </div>
          ) : (
            <ContributionBlocker blocker={contributionBlocker} account={account} />
          )}
        </React.Fragment>
      );
    } else {
      return <ContributionFlowContainer collective={account} host={account.host} tier={tier} error={error} />;
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
        collective={data.account}
      >
        {this.renderPageContent()}
      </Page>
    );
  }
}

const addContributionFlowData = graphql(contributionFlowAccountQuery, {
  options: props => ({
    variables: { collectiveSlug: props.collectiveSlug, tierId: props.tierId, includeTier: Boolean(props.tierId) },
    context: API_V2_CONTEXT,
  }),
});

// ignore unused exports default
// next.js export
export default addContributionFlowData(withUser(injectIntl(withStripeLoader(withRouter(NewContributionFlowPage)))));
