import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { get } from 'lodash';
import { injectIntl } from 'react-intl';
import { isEmail, isHexColor } from 'validator';

import { GQLV2_SUPPORTED_PAYMENT_METHOD_TYPES } from '../../lib/constants/payment-methods';
import { floatAmountToCents } from '../../lib/currency-utils';
import { generateNotFoundError, getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { compose, parseToBoolean } from '../../lib/utils';

import CollectiveThemeProvider from '../../components/CollectiveThemeProvider';
import Container from '../../components/Container';
import { PAYMENT_FLOW, STEPS } from '../../components/contribution-flow/constants';
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

    const backgroundColor = query.backgroundColor ? `#${query.backgroundColor}` : null;
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
      hideCreditCardPostalCode: parseToBoolean(query.hideCreditCardPostalCode),
      redirect: query.redirect,
      customData: query.data,
      skipStepDetails: query.skipStepDetails ? parseToBoolean(query.skipStepDetails) : false,
      contributeAs: query.contributeAs,
      disabledPaymentMethodTypes: query.disabledPaymentMethodTypes
        ? query.disabledPaymentMethodTypes.split(',')
        : undefined,
      defaultEmail: query.defaultEmail && isEmail(query.defaultEmail) ? query.defaultEmail : null,
      defaultName: query.defaultName,
      useTheme: query.useTheme ? parseToBoolean(query.useTheme) : false,
      hideHeader: query.hideHeader ? parseToBoolean(query.hideHeader) : false,
      backgroundColor: backgroundColor && isHexColor(backgroundColor) ? backgroundColor : undefined,
      error: query.error,
      tags: query.tags ? query.tags.split(',') : undefined,
    };
  }

  static propTypes = {
    collectiveSlug: PropTypes.string.isRequired,
    paymentFlow: PropTypes.string,
    verb: PropTypes.string,
    redirect: PropTypes.string,
    description: PropTypes.string,
    backgroundColor: PropTypes.string,
    disabledPaymentMethodTypes: PropTypes.arrayOf(PropTypes.string),
    quantity: PropTypes.number,
    totalAmount: PropTypes.number,
    platformContribution: PropTypes.number,
    interval: PropTypes.string,
    tierId: PropTypes.number,
    customData: PropTypes.object,
    error: PropTypes.string,
    contributeAs: PropTypes.string,
    defaultEmail: PropTypes.string,
    defaultName: PropTypes.string,
    skipStepDetails: PropTypes.bool,
    hideCreditCardPostalCode: PropTypes.bool,
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
    hideHeader: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.string),
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
    const { data = {}, step, paymentFlow, LoggedInUser } = this.props;
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
      return <ContributionBlocker blocker={contributionBlocker} account={account} />;
    } else if (step === 'success') {
      return <ContributionFlowSuccess collective={account} isEmbed />;
    } else {
      return (
        <Box height="100%" pt={3}>
          <ContributionFlowContainer
            isEmbed
            useTheme={this.props.useTheme}
            hideHeader={this.props.hideHeader}
            collective={account}
            host={account.host}
            tier={tier}
            step={step}
            verb={this.props.verb}
            redirect={this.props.redirect}
            description={this.props.description}
            defaultQuantity={this.props.quantity}
            disabledPaymentMethodTypes={this.props.disabledPaymentMethodTypes}
            fixedInterval={this.props.interval}
            fixedAmount={this.props.totalAmount}
            platformContribution={this.props.platformContribution}
            customData={this.props.customData}
            skipStepDetails={this.props.skipStepDetails}
            hideCreditCardPostalCode={this.props.hideCreditCardPostalCode}
            contributeAs={this.props.contributeAs}
            defaultEmail={this.props.defaultEmail}
            defaultName={this.props.defaultName}
            tags={this.props.tags}
            error={this.props.error}
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
          <EmbeddedPage background={this.props.backgroundColor}>{this.renderPageContent()}</EmbeddedPage>
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
