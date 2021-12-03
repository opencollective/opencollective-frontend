import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { getApplicableTaxes } from '@opencollective/taxes';
import { CardElement } from '@stripe/react-stripe-js';
import { find, get, intersection, isEmpty, isNil, omitBy, pick } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import { getGQLV2FrequencyFromInterval } from '../../lib/constants/intervals';
import { MODERATION_CATEGORIES_ALIASES } from '../../lib/constants/moderation-categories';
import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from '../../lib/constants/payment-methods';
import { TierTypes } from '../../lib/constants/tiers-types';
import { TransactionTypes } from '../../lib/constants/transactions';
import { formatCurrency } from '../../lib/currency-utils';
import { formatErrorMessage, getErrorFromGraphqlException } from '../../lib/errors';
import { isPastEvent } from '../../lib/events';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { addCreateCollectiveMutation } from '../../lib/graphql/mutations';
import { setGuestToken } from '../../lib/guest-accounts';
import { getStripe, stripeTokenToPaymentMethod } from '../../lib/stripe';
import { getDefaultInterval, getDefaultTierAmount, getTierMinAmount, isFixedContribution } from '../../lib/tier-utils';
import { isTrustedRedirectHost, objectToQueryString } from '../../lib/url-helpers';
import { reportValidityHTML5 } from '../../lib/utils';

import { isValidExternalRedirect } from '../../pages/external-redirect';
import Container from '../Container';
import ContributeFAQ from '../faqs/ContributeFAQ';
import { Box, Grid } from '../Grid';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import Steps from '../Steps';
import { withUser } from '../UserProvider';

import { orderResponseFragment } from './graphql/fragments';
import CollectiveTitleContainer from './CollectiveTitleContainer';
import { CRYPTO_CURRENCIES, PAYMENT_FLOW, STEPS } from './constants';
import ContributionFlowButtons from './ContributionFlowButtons';
import ContributionFlowHeader from './ContributionFlowHeader';
import ContributionFlowStepContainer from './ContributionFlowStepContainer';
import ContributionFlowStepsProgress from './ContributionFlowStepsProgress';
import ContributionSummary from './ContributionSummary';
import { validateNewOrg } from './CreateOrganizationForm';
import SafeTransactionMessage from './SafeTransactionMessage';
import SignInToContributeAsAnOrganization from './SignInToContributeAsAnOrganization';
import { validateGuestProfile } from './StepProfileGuestForm';
import { NEW_ORGANIZATION_KEY } from './StepProfileLoggedInForm';
import { getGQLV2AmountInput, getTotalAmount, NEW_CREDIT_CARD_KEY } from './utils';

const StepsProgressBox = styled(Box)`
  min-height: 120px;
  max-width: 450px;

  @media screen and (max-width: 640px) {
    width: 100%;
    max-width: 100%;
  }
`;

const STEP_LABELS = defineMessages({
  profile: {
    id: 'menu.profile',
    defaultMessage: 'Profile',
  },
  details: {
    id: 'contribute.step.details',
    defaultMessage: 'Details',
  },
  payment: {
    id: 'contribute.step.payment',
    defaultMessage: 'Payment info',
  },
  summary: {
    id: 'Summary',
    defaultMessage: 'Summary',
  },
});

const OTHER_MESSAGES = defineMessages({
  tipAmountContributionWarning: {
    id: 'Warning.TipAmountContributionWarning',
    defaultMessage:
      'You are about to make a contribution of {contributionAmount} to {accountName}, with a tip to the Open Collective platform of {tipAmount}. The tip amount looks unusually high.{newLine}{newLine}Are you sure you want to do this?',
  },
  pastEventWarning: {
    id: 'Warning.PastEvent',
    defaultMessage: `You're contributing to a past event.`,
  },
});

class ContributionFlow extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      currency: PropTypes.string.isRequired,
      platformContributionAvailable: PropTypes.bool,
      parent: PropTypes.shape({
        slug: PropTypes.string,
      }),
    }).isRequired,
    host: PropTypes.object.isRequired,
    tier: PropTypes.object,
    intl: PropTypes.object,
    createOrder: PropTypes.func.isRequired,
    confirmOrder: PropTypes.func.isRequired,
    disabledPaymentMethodTypes: PropTypes.arrayOf(PropTypes.string),
    fixedInterval: PropTypes.string,
    fixedAmount: PropTypes.number,
    platformContribution: PropTypes.number,
    skipStepDetails: PropTypes.bool,
    hideHeader: PropTypes.bool,
    loadingLoggedInUser: PropTypes.bool,
    hideCreditCardPostalCode: PropTypes.bool,
    isEmbed: PropTypes.bool,
    step: PropTypes.string,
    redirect: PropTypes.string,
    tags: PropTypes.arrayOf(PropTypes.string),
    verb: PropTypes.string,
    paymentFlow: PropTypes.string,
    error: PropTypes.string,
    contributeAs: PropTypes.string,
    defaultEmail: PropTypes.string,
    defaultName: PropTypes.string,
    /** @ignore from withUser */
    refetchLoggedInUser: PropTypes.func,
    /** @ignore from withUser */
    LoggedInUser: PropTypes.object,
    createCollective: PropTypes.func.isRequired, // from mutation
    router: PropTypes.object,
  };

  constructor(props) {
    super(props);
    this.mainContainerRef = React.createRef();
    this.formRef = React.createRef();
    this.state = {
      error: null,
      stripe: null,
      stripeElements: null,
      isSubmitted: false,
      isSubmitting: false,
      stepProfile: null,
      stepPayment: null,
      stepSummary: null,
      showSignIn: false,
      createdOrder: null,
      stepDetails: {
        quantity: 1,
        interval: props.fixedInterval || getDefaultInterval(props.tier),
        amount: props.paymentFlow === PAYMENT_FLOW.CRYPTO ? '' : props.fixedAmount || getDefaultTierAmount(props.tier),
        platformContribution: props.platformContribution,
        currency: CRYPTO_CURRENCIES[0],
      },
    };
  }

  componentDidUpdate(oldProps) {
    if (oldProps.LoggedInUser && !this.props.LoggedInUser) {
      this.setState({ stepProfile: null, stepSummary: null, stepPayment: null });
      this.pushStepRoute(STEPS.PROFILE);
    }
  }

  submitOrder = async () => {
    const { stepDetails, stepProfile, stepSummary } = this.state;
    this.setState({ error: null, isSubmitting: true });

    let fromAccount, guestInfo;
    if (stepProfile.isGuest) {
      guestInfo = pick(stepProfile, ['email', 'name', 'legalName', 'location', 'captcha']);
    } else {
      fromAccount = typeof stepProfile.id === 'string' ? { id: stepProfile.id } : { legacyId: stepProfile.id };
    }

    try {
      const response = await this.props.createOrder({
        variables: {
          order: {
            quantity: stepDetails.quantity,
            amount:
              this.props.paymentFlow === PAYMENT_FLOW.CRYPTO
                ? { valueInCents: 100 } // Insert dummy value for crypto contribution until the transaction is reconciled
                : { valueInCents: stepDetails.amount },
            frequency: getGQLV2FrequencyFromInterval(stepDetails.interval),
            guestInfo,
            fromAccount,
            toAccount: pick(this.props.collective, ['id']),
            data:
              this.props.paymentFlow === PAYMENT_FLOW.CRYPTO
                ? {
                    thegivingblock: {
                      pledgeAmount: stepDetails.amount,
                      pledgeCurrency: stepDetails.currency.value,
                    },
                  }
                : null,
            customData: stepDetails.customData,
            paymentMethod: await this.getPaymentMethod(),
            platformContributionAmount: getGQLV2AmountInput(stepDetails.platformContribution, undefined),
            tier: this.props.tier && { legacyId: this.props.tier.legacyId },
            context: { isEmbed: this.props.isEmbed || false },
            tags: this.props.tags,
            taxes: stepSummary && [
              {
                type: stepSummary.taxType,
                amount: getGQLV2AmountInput(stepSummary.amount, 0),
                country: stepSummary.countryISO,
                idNumber: stepSummary.number,
              },
            ],
          },
        },
      });

      return this.handleOrderResponse(response.data.createOrder, stepProfile.email);
    } catch (e) {
      this.setState({ isSubmitting: false });
      this.showError(getErrorFromGraphqlException(e));
    }
  };

  handleOrderResponse = async ({ order, stripeError, guestToken }, email) => {
    if (guestToken && order) {
      setGuestToken(email, order.id, guestToken);
    }

    if (stripeError) {
      return this.handleStripeError(order, stripeError, email, guestToken);
    } else if (this.props.paymentFlow === PAYMENT_FLOW.CRYPTO) {
      this.setState({ isSubmitted: true, isSubmitting: false, createdOrder: order });
    } else {
      return this.handleSuccess(order);
    }
  };

  handleStripeError = async (order, stripeError, email, guestToken) => {
    const { message, account, response } = stripeError;
    if (!response) {
      this.setState({ isSubmitting: false, error: message });
    } else if (response.paymentIntent) {
      const isAlipay = response.paymentIntent.allowed_source_types[0] === 'alipay';
      const stripe = await getStripe(null, account);
      const result = isAlipay
        ? await stripe.confirmAlipayPayment(response.paymentIntent.client_secret, {
            return_url: `${window.location.origin}/api/services/stripe/alipay/callback?OrderId=${order.id}`,
          })
        : await stripe.handleCardAction(response.paymentIntent.client_secret);
      if (result.error) {
        this.setState({ isSubmitting: false, error: result.error.message });
      } else if (result.paymentIntent && result.paymentIntent.status === 'requires_confirmation') {
        this.setState({ isSubmitting: true, error: null });
        try {
          const response = await this.props.confirmOrder({ variables: { order: { id: order.id }, guestToken } });
          return this.handleOrderResponse(response.data.confirmOrder, email);
        } catch (e) {
          this.setState({ isSubmitting: false, error: e.message });
        }
      }
    }
  };

  handleSuccess = async order => {
    this.setState({ isSubmitted: true, isSubmitting: false });
    this.props.refetchLoggedInUser(); // to update memberships

    if (isValidExternalRedirect(this.props.redirect)) {
      const url = new URL(this.props.redirect);
      url.searchParams.set('orderId', order.legacyId);
      url.searchParams.set('orderIdV2', order.id);
      url.searchParams.set('status', order.status);
      const transaction = find(order.transactions, { type: TransactionTypes.CREDIT });
      if (transaction) {
        url.searchParams.set('transactionid', transaction.legacyId);
        url.searchParams.set('transactionIdV2', transaction.id);
      }

      const verb = 'donate';
      const fallback = `/${this.props.collective.slug}/${verb}/success?OrderId=${order.id}`;
      if (isTrustedRedirectHost(url.host)) {
        window.location.href = url.href;
      } else {
        await this.props.router.push({ pathname: '/external-redirect', query: { url: url.href, fallback } });
        return this.scrollToTop();
      }
    } else {
      const email = this.state.stepProfile?.email;
      return this.pushStepRoute('success', { OrderId: order.id, email });
    }
  };

  showError = error => {
    this.setState({ error });
    this.scrollToTop();
  };

  getPaymentMethod = async () => {
    const { stepPayment, stripe, stripeElements } = this.state;

    if (!stepPayment?.paymentMethod) {
      return null;
    }

    const paymentMethod = {
      // TODO: cleanup after this version is deployed in production

      // Migration Step 1
      // type: stepPayment.paymentMethod.providerType,
      // legacyType: stepPayment.paymentMethod.providerType,
      // service: stepPayment.paymentMethod.service,
      // newType: stepPayment.paymentMethod.type,

      // Migration Step 2
      legacyType: stepPayment.paymentMethod.providerType,
      service: stepPayment.paymentMethod.service,
      newType: stepPayment.paymentMethod.type,

      // Migration Step 3
      // service: stepPayment.paymentMethod.service,
      // type: stepPayment.paymentMethod.type,
    };

    // Payment Method already registered
    if (stepPayment.paymentMethod.id) {
      paymentMethod.id = stepPayment.paymentMethod.id;

      // New Credit Card
    } else if (stepPayment.key === NEW_CREDIT_CARD_KEY) {
      const cardElement = stripeElements.getElement(CardElement);
      const { token } = await stripe.createToken(cardElement);
      const pm = stripeTokenToPaymentMethod(token);

      paymentMethod.name = pm.name;
      paymentMethod.isSavedForLater = stepPayment.paymentMethod.isSavedForLater;
      paymentMethod.creditCardInfo = { token: pm.token, ...pm.data };

      // PayPal
    } else if (stepPayment.paymentMethod.service === PAYMENT_METHOD_SERVICE.PAYPAL) {
      const paypalFields = ['token', 'data', 'orderId', 'subscriptionId'];
      paymentMethod.paypalInfo = pick(stepPayment.paymentMethod.paypalInfo, paypalFields);
      // Define the right type (doesn't matter that much today, but make it future proof)
      if (paymentMethod.paypalInfo.subscriptionId) {
        paymentMethod.type === PAYMENT_METHOD_TYPE.SUBSCRIPTION;
      }
    }

    return paymentMethod;
  };

  getEmailRedirectURL() {
    let currentPath = window.location.pathname;
    if (window.location.search) {
      currentPath = currentPath + window.location.search;
    } else {
      currentPath = `${currentPath}?`;
    }

    return encodeURIComponent(currentPath);
  }

  /** Validate step profile, create new incognito/org if necessary */
  validateStepProfile = async action => {
    const { stepProfile, stepDetails, error } = this.state;

    if (error) {
      this.setState({ error: null });
    }

    if (!this.checkFormValidity()) {
      return false;
    }

    // Can only ignore validation if going back
    if (!stepProfile) {
      return action === 'prev';
    } else if (stepProfile.isGuest) {
      return validateGuestProfile(stepProfile, stepDetails, this.showError);
    }

    // Check if we're creating a new profile
    if (stepProfile.id === 'incognito' || stepProfile.id === NEW_ORGANIZATION_KEY) {
      if (stepProfile.type === 'ORGANIZATION' && !validateNewOrg(stepProfile)) {
        return false;
      }

      this.setState({ isSubmitting: true });

      try {
        const { data: result } = await this.props.createCollective(stepProfile);
        const createdProfile = result.createCollective;
        await this.props.refetchLoggedInUser();
        this.setState({ stepProfile: createdProfile, isSubmitting: false });
      } catch (error) {
        this.setState({ error: error.message, isSubmitting: false });
        window.scrollTo(0, 0);
        return false;
      }
    }

    // Check that the contributor is not blocked from contributing to the collective
    const containsRejectedCategories = this.getContributorRejectedCategories(stepProfile);
    if (!isEmpty(containsRejectedCategories)) {
      this.setState({
        stepProfile: { ...this.state.stepProfile, contributorRejectedCategories: containsRejectedCategories },
      });
    }

    return true;
  };

  getContributorRejectedCategories = account => {
    const rejectedCategories = get(this.props.collective, 'settings.moderation.rejectedCategories', []);
    const contributorCategories = get(account, 'categories', []);

    if (rejectedCategories.length === 0 || contributorCategories.length === 0) {
      return [];
    }

    // Example:
    // MODERATION_CATEGORIES_ALIASES = ['CASINO_GAMBLING': ['casino', 'gambling'], 'VPN_PROXY': ['vpn', 'proxy']]
    // - when contributorCategories = ['CASINO_GAMBLING'], returns ['CASINO_GAMBLING']
    // - when contributorCategories = ['vpn'] or ['proxy'], returns ['VPN_PROXY']
    const contributorRejectedCategories = Object.keys(MODERATION_CATEGORIES_ALIASES).filter(key => {
      return (
        contributorCategories.includes(key) ||
        intersection(MODERATION_CATEGORIES_ALIASES[key], contributorCategories).length !== 0
      );
    });

    return intersection(rejectedCategories, contributorRejectedCategories);
  };

  /** Steps component callback  */
  onStepChange = async step => {
    this.setState({ showSignIn: false });
    // To create an order we need a payment method to be set. This is normally set at final stage but for crypto flow we
    // need to set this before the final step of the flow
    if (this.props.paymentFlow === PAYMENT_FLOW.CRYPTO) {
      this.setState({
        stepPayment: {
          key: 'crypto',
          paymentMethod: {
            service: PAYMENT_METHOD_SERVICE.THEGIVINGBLOCK,
            type: PAYMENT_METHOD_TYPE.CRYPTO,
          },
        },
      });
    }

    // This checkout step is where the QR code is displayed for crypto
    if (step.name === 'checkout') {
      await this.submitOrder();
    }

    if (!this.state.error) {
      await this.pushStepRoute(step.name);
    }
  };

  /** Navigate to another step, ensuring all route params are preserved */
  pushStepRoute = async (stepName, queryParams = {}) => {
    const { collective, tier, isEmbed } = this.props;
    const encodeListArg = list => (!list?.length ? undefined : list.join(','));
    const verb = this.props.verb || 'donate';
    const step = stepName === 'details' ? '' : stepName;
    const allQueryParams = {
      interval: this.props.fixedInterval,
      disabledPaymentMethodTypes: encodeListArg(this.props.disabledPaymentMethodTypes),
      tags: encodeListArg(this.props.tags),
      ...pick(this.props, [
        'interval',
        'description',
        'redirect',
        'contributeAs',
        'defaultEmail',
        'defaultName',
        'useTheme',
        'hideHeader',
        'hideCreditCardPostalCode',
      ]),
      ...queryParams,
    };

    let route = `/${collective.slug}/${verb}/${step}`;

    if (isEmbed) {
      if (tier) {
        route = `/embed/${collective.slug}/contribute/${tier.slug}-${tier.legacyId}/${step}`;
      } else {
        route = `/embed/${collective.slug}/donate/${step}`;
      }
    } else if (tier) {
      if (tier.type === 'TICKET' && collective.parent) {
        route = `/${collective.parent.slug}/events/${collective.slug}/order/${tier.legacyId}/${step}`;
      } else {
        // Enforce "contribute" verb for ordering tiers
        route = `/${collective.slug}/contribute/${tier.slug}-${tier.legacyId}/checkout/${step}`;
      }
    } else if (verb === 'contribute' || verb === 'new-contribute') {
      // Never use `contribute` as verb if not using a tier (would introduce a route conflict)
      route = `/${collective.slug}/donate/${step}`;
    } else if (verb === 'donate' && this.props.paymentFlow === PAYMENT_FLOW.CRYPTO) {
      route = `/${collective.slug}/donate/crypto/${step}`;
    }

    // Reset errors if any
    if (this.state.error) {
      this.setState({ error: null });
    }

    // Navigate to the new route
    await this.props.router.push({ pathname: route, query: omitBy(allQueryParams, value => !value) });
    this.scrollToTop();
  };

  scrollToTop = () => {
    if (this.mainContainerRef.current) {
      this.mainContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  };

  // Memoized helpers
  isFixedContribution = memoizeOne(isFixedContribution);
  getTierMinAmount = memoizeOne(getTierMinAmount);
  getApplicableTaxes = memoizeOne(getApplicableTaxes);

  canHaveFeesOnTop() {
    if (!this.props.collective.platformContributionAvailable) {
      return false;
    } else if (this.props.tier?.type === TierTypes.TICKET) {
      return false;
    } else {
      return true;
    }
  }

  checkFormValidity = () => {
    return reportValidityHTML5(this.formRef.current);
  };

  /** Returns the steps list */
  getSteps() {
    const { intl, fixedInterval, fixedAmount, collective, host, tier, LoggedInUser, paymentFlow } = this.props;
    const { stepDetails, stepProfile, stepPayment, stepSummary } = this.state;
    const isFixedContribution = this.isFixedContribution(tier, fixedAmount, fixedInterval);
    const minAmount = this.getTierMinAmount(tier);
    const noPaymentRequired = minAmount === 0 && (isFixedContribution || stepDetails?.amount === 0);
    const isStepProfileCompleted = Boolean((stepProfile && LoggedInUser) || stepProfile?.isGuest);
    const isCrypto = paymentFlow === PAYMENT_FLOW.CRYPTO;

    const steps = [
      {
        name: 'details',
        label: intl.formatMessage(STEP_LABELS.details),
        isCompleted: Boolean(stepDetails),
        validate: () => {
          if (isCrypto) {
            return true;
          } else if (
            !this.checkFormValidity() ||
            !stepDetails ||
            stepDetails.amount < minAmount ||
            !stepDetails.quantity
          ) {
            return false;
          } else if (!isNil(tier?.availableQuantity) && stepDetails.quantity > tier.availableQuantity) {
            return false;
          } else if (
            stepDetails.amount &&
            stepDetails.platformContribution &&
            stepDetails.platformContribution / stepDetails.amount >= 0.5
          ) {
            const currency = tier?.amount.currency || collective.currency;
            return confirm(
              intl.formatMessage(OTHER_MESSAGES.tipAmountContributionWarning, {
                contributionAmount: formatCurrency(stepDetails.amount, currency, { locale: intl.locale }),
                tipAmount: formatCurrency(stepDetails.platformContribution, currency, { locale: intl.locale }),
                accountName: collective.name,
                newLine: '\n',
              }),
            );
          } else {
            return true;
          }
        },
      },
      {
        name: 'profile',
        label: intl.formatMessage(STEP_LABELS.profile),
        isCompleted: isStepProfileCompleted,
        validate: this.validateStepProfile,
      },
    ];

    // Show the summary step only if the order has tax
    if (!noPaymentRequired && this.getApplicableTaxes(collective, host, tier?.type).length) {
      steps.push({
        name: 'summary',
        label: intl.formatMessage(STEP_LABELS.summary),
        isCompleted: noPaymentRequired || get(stepSummary, 'isReady', false),
      });
    }

    // Hide step payment if using a free tier with fixed price
    // Also hide payment screen if using crypto payment method, we handle crypto flow in the `checkout` step below
    if (!noPaymentRequired && !isCrypto) {
      steps.push({
        name: 'payment',
        label: intl.formatMessage(STEP_LABELS.payment),
        isCompleted: !stepProfile?.contributorRejectedCategories,
        validate: action => {
          if (action === 'prev') {
            return true;
          } else {
            const isCompleted = Boolean(noPaymentRequired || stepPayment);
            if (isCompleted && stepPayment?.key === NEW_CREDIT_CARD_KEY) {
              return stepPayment.paymentMethod?.stripeData?.complete;
            } else {
              return isCompleted;
            }
          }
        },
      });
    }

    if (isCrypto) {
      steps.push({
        name: 'checkout',
        label: intl.formatMessage(STEP_LABELS.payment),
        isCompleted: !stepProfile?.contributorRejectedCategories,
      });
    }

    return steps;
  }

  getPaypalButtonProps({ currency }) {
    const { stepPayment, stepDetails, stepSummary } = this.state;
    if (stepPayment?.paymentMethod?.service === PAYMENT_METHOD_SERVICE.PAYPAL) {
      const { host, collective, tier } = this.props;
      return {
        host: host,
        collective,
        tier,
        currency: currency,
        style: { size: 'responsive', height: 47 },
        totalAmount: getTotalAmount(stepDetails, stepSummary),
        interval: stepDetails?.interval,
        onClick: () => this.setState({ isSubmitting: true }),
        onCancel: () => this.setState({ isSubmitting: false }),
        onError: e => this.setState({ isSubmitting: false, error: `PayPal error: ${e.message}` }),
        // New callback, used by `PayWithPaypalButton`
        onSuccess: paypalInfo => {
          this.setState(
            state => ({
              stepPayment: {
                ...state.stepPayment,
                paymentMethod: {
                  service: PAYMENT_METHOD_SERVICE.PAYPAL,
                  type: PAYMENT_METHOD_TYPE.PAYMENT,
                  paypalInfo,
                },
              },
            }),
            this.submitOrder,
          );
        },
      };
    }
  }

  getRedirectUrlForSignIn = () => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const { stepDetails } = this.state;
    const stepDetailsParams = objectToQueryString({
      amount: stepDetails.amount / 100,
      interval: stepDetails.interval || undefined,
      quantity: stepDetails.quantity !== 1 ? stepDetails.quantity : undefined,
      platformContribution: !isNil(stepDetails.platformContribution)
        ? stepDetails.platformContribution / 100
        : undefined,
    });

    const path = window.location.pathname;
    if (window.location.search) {
      return `${path}${window.location.search}&${stepDetailsParams.slice(1)}`;
    } else {
      return `${path}${stepDetailsParams}`;
    }
  };

  cryptoOrderCompleted = () => {
    const { createdOrder } = this.state;
    this.pushStepRoute('success', { OrderId: createdOrder.id });
  };

  render() {
    const {
      collective,
      host,
      tier,
      LoggedInUser,
      loadingLoggedInUser,
      skipStepDetails,
      isEmbed,
      paymentFlow,
      error: backendError,
    } = this.props;
    const { error, isSubmitted, isSubmitting, stepDetails, stepSummary, stepProfile, stepPayment } = this.state;
    const isCrypto = paymentFlow === PAYMENT_FLOW.CRYPTO;
    const currency = isCrypto ? stepDetails.currency.value : tier?.amount.currency || collective.currency;
    const isLoading = isCrypto ? isSubmitting : isSubmitted || isSubmitting;
    const pastEvent = collective.type === CollectiveType.EVENT && isPastEvent(collective);

    return (
      <Steps
        steps={this.getSteps()}
        currentStepName={this.props.step}
        onStepChange={this.onStepChange}
        onComplete={isCrypto && isSubmitted ? this.cryptoOrderCompleted : this.submitOrder}
        skip={skipStepDetails ? ['details'] : null}
      >
        {({
          steps,
          currentStep,
          lastVisitedStep,
          goNext,
          goBack,
          goToStep,
          prevStep,
          nextStep,
          isValidating,
          isValidStep,
        }) => (
          <Container
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={[3, 4, 5]}
            mb={4}
            data-cy="cf-content"
            ref={this.mainContainerRef}
          >
            {!this.props.hideHeader && (
              <Box px={[2, 3]} mb={4}>
                <ContributionFlowHeader collective={collective} isEmbed={isEmbed} />
              </Box>
            )}
            <StepsProgressBox mb={3} width={[1.0, 0.8]}>
              <ContributionFlowStepsProgress
                steps={steps}
                currentStep={currentStep}
                lastVisitedStep={lastVisitedStep}
                goToStep={goToStep}
                stepProfile={stepProfile}
                stepDetails={stepDetails}
                stepPayment={stepPayment}
                stepSummary={stepSummary}
                isCrypto={isCrypto}
                isSubmitted={this.state.isSubmitted}
                loading={isValidating || isLoading}
                currency={currency}
                isFreeTier={this.getTierMinAmount(tier) === 0}
              />
            </StepsProgressBox>
            {/* main container */}
            {(currentStep.name !== STEPS.DETAILS && loadingLoggedInUser) || !isValidStep ? (
              <Box py={[4, 5]}>
                <Loading />
              </Box>
            ) : currentStep.name === STEPS.PROFILE && !LoggedInUser && this.state.showSignIn ? (
              <SignInToContributeAsAnOrganization
                defaultEmail={stepProfile?.email}
                redirect={this.getRedirectUrlForSignIn()}
                onCancel={() => this.setState({ showSignIn: false })}
              />
            ) : (
              <Grid
                px={[2, 3]}
                gridTemplateColumns={[
                  'minmax(200px, 600px)',
                  null,
                  '0fr minmax(300px, 600px) 1fr',
                  '1fr minmax(300px, 600px) 1fr',
                ]}
              >
                <Box />
                <Box as="form" ref={this.formRef} onSubmit={e => e.preventDefault()} maxWidth="100%">
                  {(error || backendError) && (
                    <MessageBox type="error" withIcon mb={3} data-cy="contribution-flow-error">
                      {formatErrorMessage(this.props.intl, error) || backendError}
                    </MessageBox>
                  )}
                  {pastEvent && (
                    <MessageBox type="warning" withIcon mb={3} data-cy="contribution-flow-warning">
                      {this.props.intl.formatMessage(OTHER_MESSAGES.pastEventWarning)}
                    </MessageBox>
                  )}
                  <ContributionFlowStepContainer
                    collective={collective}
                    tier={tier}
                    mainState={this.state}
                    onChange={data => this.setState(data)}
                    step={currentStep}
                    isCrypto={isCrypto}
                    showFeesOnTop={this.canHaveFeesOnTop()}
                    onNewCardFormReady={({ stripe, stripeElements }) => this.setState({ stripe, stripeElements })}
                    defaultProfileSlug={this.props.contributeAs}
                    defaultEmail={this.props.defaultEmail}
                    defaultName={this.props.defaultName}
                    taxes={this.getApplicableTaxes(collective, host, tier?.type)}
                    onSignInClick={() => this.setState({ showSignIn: true })}
                    isEmbed={isEmbed}
                    isSubmitting={isValidating || isLoading}
                    order={this.state.createdOrder}
                    disabledPaymentMethodTypes={this.props.disabledPaymentMethodTypes}
                    hideCreditCardPostalCode={this.props.hideCreditCardPostalCode}
                  />
                  <Box mt={40}>
                    <ContributionFlowButtons
                      goNext={goNext}
                      // for crypto flow the user should not be able to go back after the order is created at checkout step
                      goBack={isCrypto && currentStep.name === 'checkout' ? null : goBack}
                      step={currentStep}
                      prevStep={prevStep}
                      nextStep={nextStep}
                      isValidating={isValidating || isLoading}
                      paypalButtonProps={!nextStep ? this.getPaypalButtonProps({ currency }) : null}
                      totalAmount={getTotalAmount(stepDetails, stepSummary)}
                      currency={currency}
                      isCrypto={isCrypto}
                    />
                  </Box>
                  {!isEmbed && (
                    <Box textAlign="center" mt={5}>
                      <CollectiveTitleContainer collective={collective} useLink>
                        <FormattedMessage
                          id="ContributionFlow.backToCollectivePage"
                          defaultMessage="Back to Collective Page"
                        />
                      </CollectiveTitleContainer>
                    </Box>
                  )}
                </Box>

                <Box minWidth={[null, '300px']} mt={[4, null, 0]} ml={[0, 3, 4, 5]}>
                  <Box maxWidth={['100%', null, 300]} px={[1, null, 0]}>
                    <SafeTransactionMessage />
                    <Box mt={4}>
                      <ContributionSummary
                        collective={collective}
                        stepDetails={stepDetails}
                        stepSummary={stepSummary}
                        stepPayment={stepPayment}
                        currency={currency}
                        isCrypto={isCrypto}
                      />
                    </Box>
                    <ContributeFAQ collective={collective} mt={4} titleProps={{ mb: 2 }} isCrypto={isCrypto} />
                  </Box>
                </Box>
              </Grid>
            )}
          </Container>
        )}
      </Steps>
    );
  }
}

const addCreateOrderMutation = graphql(
  gqlV2/* GraphQL */ `
    mutation CreateOrder($order: OrderCreateInput!) {
      createOrder(order: $order) {
        ...OrderResponseFragment
      }
    }
    ${orderResponseFragment}
  `,
  {
    name: 'createOrder',
    options: { context: API_V2_CONTEXT },
  },
);

const addConfirmOrderMutation = graphql(
  gqlV2/* GraphQL */ `
    mutation ConfirmOrder($order: OrderReferenceInput!, $guestToken: String) {
      confirmOrder(order: $order, guestToken: $guestToken) {
        ...OrderResponseFragment
      }
    }
    ${orderResponseFragment}
  `,
  {
    name: 'confirmOrder',
    options: { context: API_V2_CONTEXT },
  },
);

export default injectIntl(
  withUser(addConfirmOrderMutation(addCreateOrderMutation(addCreateCollectiveMutation(withRouter(ContributionFlow))))),
);
