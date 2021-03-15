import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { injectIntl } from 'react-intl';
import { isEmail } from 'validator';

import { getBraintree } from '../../lib/braintree';
import { GQLV2_PAYMENT_METHOD_TYPES } from '../../lib/constants/payment-methods';
import { generateNotFoundError, getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { floatAmountToCents } from '../../lib/math';
import { compose, parseToBoolean } from '../../lib/utils';

import CollectiveThemeProvider from '../../components/CollectiveThemeProvider';
import Container from '../../components/Container';
import { STEPS } from '../../components/contribution-flow/constants';
import ContributionBlocker, { getContributionBlocker } from '../../components/contribution-flow/ContributionBlocker';
import ContributionFlowSuccess from '../../components/contribution-flow/ContributionFlowSuccess';
import {
  contributionFlowAccountQuery,
  contributionFlowAccountWithTierQuery,
} from '../../components/contribution-flow/graphql/queries';
import ContributionFlowContainer from '../../components/contribution-flow/index';
import { getContributionFlowMetadata } from '../../components/contribution-flow/utils';
import EmbeddedPage from '../../components/EmbeddedPage';
import ErrorPage from '../../components/ErrorPage';
import { Box } from '../../components/Grid';
import Loading from '../../components/Loading';
import MessageBox from '../../components/MessageBox';
import { withStripeLoader } from '../../components/StripeProvider';
import { withUser } from '../../components/UserProvider';

class NewContributionFlowPage extends React.Component {
  static getInitialProps({ query, res }) {
    // Whitelist interval
    if (['monthly', 'yearly'].includes(query.interval)) {
      query.interval = query.interval.replace('ly', '');
    } else if (!['month', 'year'].includes(query.interval)) {
      query.interval = null;
    }

    if (res) {
      res.removeHeader('X-Frame-Options');
    }

    if (query.data) {
      try {
        query.data = JSON.parse(query.data);
      } catch (err) {
        // TODO: this should be reported to the user
        // eslint-disable-next-line no-console
        console.error(err);
      }
    }

    const getFloatAmount = amountStr => {
      return !amountStr ? null : floatAmountToCents(parseFloat(amountStr));
    };

    return {
      collectiveSlug: query.eventSlug || query.collectiveSlug,
      totalAmount: getFloatAmount(query.amount) || parseInt(query.totalAmount) || null,
      platformContribution: getFloatAmount(query.platformContribution),
      step: query.step || 'details',
      tierId: parseInt(query.tierId) || null,
      quantity: parseInt(query.quantity) || 1,
      description: query.description ? decodeURIComponent(query.description) : undefined,
      interval: query.interval,
      verb: query.verb,
      redirect: query.redirect,
      customData: query.data,
      skipStepDetails: query.skipStepDetails ? parseToBoolean(query.skipStepDetails) : false,
      contributeAs: query.contributeAs,
      defaultEmail: query.defaultEmail && isEmail(query.defaultEmail) ? query.defaultEmail : null,
      defaultName: query.defaultName,
      useTheme: query.useTheme ? parseToBoolean(query.useTheme) : false,
    };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    verb: PropTypes.string,
    redirect: PropTypes.string,
    description: PropTypes.string,
    quantity: PropTypes.number,
    totalAmount: PropTypes.number,
    platformContribution: PropTypes.number,
    interval: PropTypes.string,
    tierId: PropTypes.number,
    customData: PropTypes.object,
    contributeAs: PropTypes.string,
    defaultEmail: PropTypes.string,
    defaultName: PropTypes.string,
    skipStepDetails: PropTypes.bool,
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
    useTheme: PropTypes.bool,
    step: PropTypes.oneOf(Object.values(STEPS)),
  };

  componentDidMount() {
    this.loadExternalScripts();
  }

  componentDidUpdate(prevProps) {
    const hostPath = 'data.account.host';
    if (get(this.props, hostPath) !== get(prevProps, hostPath)) {
      this.loadExternalScripts();
    }
  }

  loadExternalScripts() {
    const supportedPaymentMethods = get(this.props.data, 'account.host.supportedPaymentMethods', []);
    if (supportedPaymentMethods.includes(GQLV2_PAYMENT_METHOD_TYPES.CREDIT_CARD)) {
      this.props.loadStripe();
    }
    if (supportedPaymentMethods.includes(GQLV2_PAYMENT_METHOD_TYPES.BRAINTREE_PAYPAL)) {
      getBraintree();
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
    const { data = {}, step, LoggedInUser } = this.props;
    const { account, tier } = data;

    if (data.loading) {
      return (
        <Container py={[5, 6]}>
          <Loading />
        </Container>
      );
    }

    const contributionBLocker = getContributionBlocker(LoggedInUser, account, tier, Boolean(this.props.tierId));
    if (contributionBLocker) {
      return <ContributionBlocker blocker={contributionBLocker} account={account} />;
    } else if (step === 'success') {
      return <ContributionFlowSuccess collective={account} isEmbed />;
    } else if (!get(data.account, 'settings.beta.embedContributionFlow')) {
      return (
        <MessageBox type="info" withIcon m={4}>
          Embedded contribution flow feature is not enabled for this account
        </MessageBox>
      );
    } else {
      return (
        <Box height="100%" pt={3}>
          <ContributionFlowContainer
            isEmbed
            useTheme={this.props.useTheme}
            collective={account}
            host={account.host}
            tier={tier}
            step={step}
            verb={this.props.verb}
            redirect={this.props.redirect}
            description={this.props.description}
            defaultQuantity={this.props.quantity}
            fixedInterval={this.props.interval}
            fixedAmount={this.props.totalAmount}
            platformContribution={this.props.platformContribution}
            customData={this.props.customData}
            skipStepDetails={this.props.skipStepDetails}
            contributeAs={this.props.contributeAs}
            defaultEmail={this.props.defaultEmail}
            defaultName={this.props.defaultName}
          />
        </Box>
      );
    }
  }

  render() {
    const { data, useTheme } = this.props;
    if (!data.loading && !data.account) {
      const error = data.error
        ? getErrorFromGraphqlException(data.error)
        : generateNotFoundError(this.props.collectiveSlug);

      return <ErrorPage error={error} />;
    } else {
      return (
        <CollectiveThemeProvider collective={useTheme ? data.account : null}>
          <EmbeddedPage>{this.renderPageContent()}</EmbeddedPage>
        </CollectiveThemeProvider>
      );
    }
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

export default addGraphql(withUser(injectIntl(withStripeLoader(NewContributionFlowPage))));
