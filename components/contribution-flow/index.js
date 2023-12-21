import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { getApplicableTaxes } from '@opencollective/taxes';
import { CardElement } from '@stripe/react-stripe-js';
import { get, intersection, isEmpty, isEqual, isNil, omitBy, pick } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { AnalyticsEvent } from '../../lib/analytics/events';
import { track } from '../../lib/analytics/plausible';
import { AnalyticsProperty } from '../../lib/analytics/properties';
import { getCollectiveTypeForUrl } from '../../lib/collective.lib';
import { CollectiveType } from '../../lib/constants/collectives';
import { getGQLV2FrequencyFromInterval } from '../../lib/constants/intervals';
import { MODERATION_CATEGORIES_ALIASES } from '../../lib/constants/moderation-categories';
import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from '../../lib/constants/payment-methods';
import { TierTypes } from '../../lib/constants/tiers-types';
import { formatCurrency } from '../../lib/currency-utils';
import { formatErrorMessage, getErrorFromGraphqlException } from '../../lib/errors';
import { isPastEvent } from '../../lib/events';
import { Experiment, isExperimentEnabled } from '../../lib/experiments/experiments';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import { addCreateCollectiveMutation } from '../../lib/graphql/v1/mutations';
import { setGuestToken } from '../../lib/guest-accounts';
import { getStripe, stripeTokenToPaymentMethod } from '../../lib/stripe';
import { confirmPayment } from '../../lib/stripe/confirm-payment';
import { getDefaultInterval, getDefaultTierAmount, getTierMinAmount, isFixedContribution } from '../../lib/tier-utils';
import { followOrderRedirectUrl, getCollectivePageRoute } from '../../lib/url-helpers';
import { reportValidityHTML5 } from '../../lib/utils';

import { isValidExternalRedirect } from '../../pages/external-redirect';
import { isCaptchaEnabled } from '../Captcha';
import Container from '../Container';
import ContributeFAQ from '../faqs/ContributeFAQ';
import { Box, Grid } from '../Grid';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import Steps from '../Steps';
import { P } from '../Text';
import { withUser } from '../UserProvider';

import { orderResponseFragment } from './graphql/fragments';
import CollectiveTitleContainer from './CollectiveTitleContainer';
import { INCOGNITO_PROFILE_ALIAS, PERSONAL_PROFILE_ALIAS, STEPS } from './constants';
import ContributionFlowButtons from './ContributionFlowButtons';
import ContributionFlowHeader from './ContributionFlowHeader';
import ContributionFlowStepContainer from './ContributionFlowStepContainer';
import ContributionFlowStepsProgress from './ContributionFlowStepsProgress';
import ContributionFlowSuccess from './ContributionFlowSuccess';
import ContributionSummary from './ContributionSummary';
import { validateNewOrg } from './CreateOrganizationForm';
import { PlatformTipOption } from './PlatformTipContainer';
import { DEFAULT_PLATFORM_TIP_PERCENTAGE } from './PlatformTipInput';
import {
  ContributionFlowUrlQueryHelper,
  EmbedContributionFlowUrlQueryHelper,
  stepsDataToUrlParamsData,
} from './query-parameters';
import SafeTransactionMessage from './SafeTransactionMessage';
import SignInToContributeAsAnOrganization from './SignInToContributeAsAnOrganization';
import { validateGuestProfile } from './StepProfileGuestForm';
import { NEW_ORGANIZATION_KEY } from './StepProfileLoggedInForm';
import {
  getContributeProfiles,
  getGQLV2AmountInput,
  getGuestInfoFromStepProfile,
  getTotalAmount,
  isSupportedInterval,
  NEW_CREDIT_CARD_KEY,
  STRIPE_PAYMENT_ELEMENT_KEY,
} from './utils';

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
    id: 'Details',
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
      'You are about to make a contribution of {contributionAmount} to {accountName} that includes a {tipAmount} tip to the Open Collective platform. The tip amount looks unusually high.{newLine}{newLine}Are you sure you want to do this?',
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
    loadingLoggedInUser: PropTypes.bool,
    isEmbed: PropTypes.bool,
    error: PropTypes.string,
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

    const { collective, tier, LoggedInUser } = props;
    const queryParams = this.getQueryParams();
    const currency = tier?.amount?.currency || collective.currency;
    const amount = queryParams.amount || getDefaultTierAmount(tier, collective, currency);
    const quantity = queryParams.quantity || 1;
    this.state = {
      error: null,
      stripe: null,
      stripeElements: null,
      isSubmitted: false,
      isSubmitting: false,
      isInitializing: true,
      isNavigating: false,
      showSignIn: false,
      createdOrder: null,
      forceSummaryStep: this.getCurrentStepName() !== STEPS.DETAILS, // If not starting the flow with the details step, we force the summary step to make sure contributors have an easy way to review their contribution
      // Steps data
      stepProfile: this.getDefaultStepProfile(),
      stepPayment: {
        key: queryParams.paymentMethod,
        isKeyOnly: true, // For the step payment to recognize if it needs to load the payment method
      },
      stepSummary: null,
      stepDetails: {
        quantity,
        interval: isSupportedInterval(collective, tier, LoggedInUser, queryParams.interval)
          ? queryParams.interval
          : getDefaultInterval(props.tier),
        amount,
        platformTip: this.canHavePlatformTips() ? Math.round(amount * quantity * DEFAULT_PLATFORM_TIP_PERCENTAGE) : 0,
        platformTipOption: PlatformTipOption.FIFTEEN_PERCENT,
        isNewPlatformTip: isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, LoggedInUser),
        currency,
      },
    };
  }

  async componentDidMount() {
    if (!this.props.loadingLoggedInUser && this.state.isInitializing) {
      await this.updateRouteFromState();
      this.setState({ isInitializing: false });
    }

    const step = this.getCurrentStepName();
    if (step !== 'success' && step !== 'details') {
      track(AnalyticsEvent.CONTRIBUTION_STARTED, {
        props: {
          [AnalyticsProperty.CONTRIBUTION_STEP]: this.getCurrentStepName(),
        },
      });

      if (step !== 'details') {
        // started the contribution flow at advanced step with details picked.
        track(AnalyticsEvent.CONTRIBUTION_DETAILS_STEP_COMPLETED);
      }
    }
  }

  async componentDidUpdate(oldProps) {
    if (oldProps.LoggedInUser && !this.props.LoggedInUser) {
      // User has logged out, reset the state
      this.setState({ stepProfile: null, stepSummary: null, stepPayment: null });
      this.pushStepRoute(STEPS.PROFILE);
    } else if (!oldProps.LoggedInUser && this.props.LoggedInUser) {
      // User has logged in, reload the step profile
      this.setState({ stepProfile: this.getDefaultStepProfile() });

      // reset the state if it was a guest
      if (this.state.stepProfile.isGuest) {
        const previousEmail = this.state.stepProfile.email;
        const newStepProfile = this.getDefaultStepProfile();
        const hasChangedEmail = previousEmail && previousEmail !== newStepProfile.email;
        this.setState({ stepProfile: newStepProfile, stepSummary: null, stepPayment: null });
        if (hasChangedEmail && ![STEPS.DETAILS, STEPS.PROFILE].includes(this.state.step)) {
          this.pushStepRoute(STEPS.PROFILE); // Force user to re-fill profile
        }
      }
    } else if (oldProps.loadingLoggedInUser && !this.props.loadingLoggedInUser) {
      // Login failed, reset the state to make sure we fallback on guest mode
      this.setState({ stepProfile: this.getDefaultStepProfile() });
    } else if (!this.props.loadingLoggedInUser && this.state.isInitializing) {
      await this.updateRouteFromState();
      this.setState({ isInitializing: false });
    }
  }

  updateRouteFromState = async () => {
    if (this.state.isNavigating) {
      return;
    }

    const currentStepName = this.getCurrentStepName();
    if (currentStepName !== STEPS.SUCCESS) {
      const { stepDetails, stepProfile, stepPayment } = this.state;
      const currentUrlState = this.getQueryParams();
      const expectedUrlState = stepsDataToUrlParamsData(
        this.props.LoggedInUser,
        currentUrlState,
        stepDetails,
        stepProfile,
        stepPayment,
        this.props.isEmbed,
      );
      if (!isEqual(currentUrlState, omitBy(expectedUrlState, isNil))) {
        const route = this.getRoute(currentStepName);
        const queryHelper = this.getQueryHelper();
        this.setState({ isNavigating: true }, async () => {
          await this.props.router.replace(
            { pathname: route, query: omitBy(queryHelper.encode(expectedUrlState), isNil) },
            null,
            { scroll: false, shallow: true },
          );
          this.setState({ isNavigating: false });
        });
      }
    }
  };

  _getQueryParams = memoizeOne(query => {
    return this.getQueryHelper().decode(query);
  });

  getQueryParams = () => {
    return this._getQueryParams(this.props.router.query);
  };

  // ---- Order submission & error handling ----

  submitOrder = async () => {
    const { collective, host, tier } = this.props;
    const { stepDetails, stepProfile, stepSummary } = this.state;
    this.setState({ error: null, isSubmitting: true });

    let fromAccount, guestInfo;
    if (stepProfile.isGuest) {
      guestInfo = getGuestInfoFromStepProfile(stepProfile);
    } else {
      fromAccount = typeof stepProfile.id === 'string' ? { id: stepProfile.id } : { legacyId: stepProfile.id };
    }

    const props = {
      [AnalyticsProperty.CONTRIBUTION_HAS_PLATFORM_TIP]: stepDetails.amount && stepDetails.platformTip > 0,
      [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_PERCENTAGE]:
        stepDetails.amount && stepDetails.platformTip > 0 ? stepDetails.platformTip / stepDetails.amount : 0,
      [AnalyticsProperty.CONTRIBUTION_IS_NEW_PLATFORM_TIP]: stepDetails.isNewPlatformTip,
    };

    track(AnalyticsEvent.CONTRIBUTION_SUBMITTED, {
      props,
    });

    try {
      const totalAmount = getTotalAmount(stepDetails, stepSummary);
      const skipTaxes = !totalAmount || isEmpty(this.getApplicableTaxes(collective, host, tier?.type));
      const response = await this.props.createOrder({
        variables: {
          order: {
            quantity: stepDetails.quantity,
            amount: { valueInCents: stepDetails.amount },
            frequency: getGQLV2FrequencyFromInterval(stepDetails.interval),
            guestInfo,
            fromAccount,
            fromAccountInfo: {
              location: pick(stepProfile.location, ['name', 'address', 'country', 'structured']),
              legalName: stepProfile.legalName,
              name: stepProfile.name,
            },
            toAccount: pick(this.props.collective, ['id']),
            customData: stepDetails.customData,
            paymentMethod: await this.getPaymentMethod(),
            platformTipAmount: getGQLV2AmountInput(stepDetails.platformTip, undefined),
            tier: this.props.tier && { legacyId: this.props.tier.legacyId },
            context: { isEmbed: this.props.isEmbed || false, isNewPlatformTipFlow: stepDetails.isNewPlatformTip },
            tags: this.getQueryParams().tags,
            taxes: skipTaxes
              ? null
              : [
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
      this.handleError();
      this.showError(getErrorFromGraphqlException(e));
    }
  };

  handleOrderResponse = async ({ order, stripeError, guestToken }, email) => {
    const { stepPayment } = this.state;

    if (guestToken && order) {
      setGuestToken(email, order.id, guestToken);
    }

    if (
      stepPayment?.paymentMethod?.service === PAYMENT_METHOD_SERVICE.STRIPE &&
      (stepPayment?.key === STRIPE_PAYMENT_ELEMENT_KEY ||
        stepPayment.paymentMethod.type === PAYMENT_METHOD_TYPE.US_BANK_ACCOUNT ||
        stepPayment.paymentMethod.type === PAYMENT_METHOD_TYPE.SEPA_DEBIT)
    ) {
      const { stripeData } = stepPayment;

      const baseRoute = this.props.collective.parent?.slug
        ? `${window.location.origin}/${this.props.collective.parent?.slug}/${getCollectiveTypeForUrl(
            this.props.collective,
          )}/${this.props.collective.slug}`
        : `${window.location.origin}/${this.props.collective.slug}`;

      const returnUrl = new URL(`${baseRoute}/donate/success`);
      returnUrl.searchParams.set('OrderId', order.id);

      const queryParams = this.getQueryParams();
      if (queryParams.redirect) {
        returnUrl.searchParams.set('redirect', queryParams.redirect);
        if (queryParams.shouldRedirectParent) {
          returnUrl.searchParams.set('shouldRedirectParent', queryParams.shouldRedirectParent);
        }
      }

      try {
        await confirmPayment(stripeData?.stripe, stripeData?.paymentIntentClientSecret, {
          returnUrl: returnUrl.href,
          elements: stripeData?.elements,
          type: stepPayment?.paymentMethod?.type,
          paymentMethodId: stepPayment?.paymentMethod?.data?.stripePaymentMethodId,
        });
        this.setState({ isSubmitted: true, isSubmitting: false });
        return this.handleSuccess(order);
      } catch (e) {
        this.setState({ isSubmitting: false, error: e.message });
      }
    } else if (stripeError) {
      return this.handleStripeError(order, stripeError, email, guestToken);
    } else {
      return this.handleSuccess(order);
    }
  };

  handleError = message => {
    track(AnalyticsEvent.CONTRIBUTION_ERROR);
    this.setState({ isSubmitting: false, error: message });
  };

  handleStripeError = async (order, stripeError, email, guestToken) => {
    const { message, account, response } = stripeError;
    if (!response) {
      this.handleError(message);
    } else if (response.paymentIntent) {
      const isAlipay = response.paymentIntent.allowed_source_types[0] === 'alipay';
      const stripe = await getStripe(null, account);
      const result = isAlipay
        ? await stripe.confirmAlipayPayment(response.paymentIntent.client_secret, {
            // eslint-disable-next-line camelcase
            return_url: `${window.location.origin}/api/services/stripe/alipay/callback?OrderId=${order.id}`,
          })
        : await stripe.handleCardAction(response.paymentIntent.client_secret);
      if (result.error) {
        this.handleError(result.error.message);
      } else if (result.paymentIntent && result.paymentIntent.status === 'requires_confirmation') {
        this.setState({ isSubmitting: true, error: null });
        try {
          const response = await this.props.confirmOrder({ variables: { order: { id: order.id }, guestToken } });
          return this.handleOrderResponse(response.data.confirmOrder, email);
        } catch (e) {
          this.handleError(e.message);
        }
      }
    }
  };

  handleSuccess = async order => {
    this.setState({ isSubmitted: true, isSubmitting: false });
    this.props.refetchLoggedInUser(); // to update memberships
    const queryParams = this.getQueryParams();
    if (isValidExternalRedirect(queryParams.redirect)) {
      followOrderRedirectUrl(this.props.router, this.props.collective, order, queryParams.redirect, {
        shouldRedirectParent: queryParams.shouldRedirectParent,
      });
    } else {
      const email = this.state.stepProfile?.email;
      return this.pushStepRoute('success', { replace: false, query: { OrderId: order.id, email } });
    }
  };

  showError = error => {
    this.setState({ error });
    this.scrollToTop();
  };

  // ---- Getters ----

  getContributeProfiles = memoizeOne(getContributeProfiles);

  getDefaultStepProfile() {
    const { LoggedInUser, loadingLoggedInUser, collective, tier } = this.props;
    const profiles = this.getContributeProfiles(LoggedInUser, collective, tier);
    const queryParams = this.getQueryParams();

    // We want to wait for the user to be logged in before matching the profile
    if (loadingLoggedInUser) {
      return { slug: queryParams.contributeAs };
    }

    // If there's a default profile set in contributeAs, use it
    let contributorProfile;
    if (queryParams.contributeAs && queryParams.contributeAs !== PERSONAL_PROFILE_ALIAS) {
      if (queryParams.contributeAs === INCOGNITO_PROFILE_ALIAS) {
        contributorProfile = profiles.find(({ isIncognito }) => isIncognito);
      } else {
        contributorProfile = profiles.find(({ slug }) => slug === queryParams.contributeAs);
      }
    }

    if (contributorProfile) {
      return contributorProfile;
    } else if (profiles[0]) {
      // Otherwise to the logged-in user personal profile, if any
      return profiles[0];
    }

    // Otherwise, it's a guest contribution
    return {
      isGuest: true,
      email: queryParams.email || '',
      name: queryParams.name || '',
      legalName: queryParams.legalName || '',
    };
  }

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

    if (
      stepPayment.paymentMethod.type === PAYMENT_METHOD_TYPE.US_BANK_ACCOUNT ||
      stepPayment.paymentMethod.type === PAYMENT_METHOD_TYPE.SEPA_DEBIT ||
      stepPayment.paymentMethod.type === PAYMENT_METHOD_TYPE.BACS_DEBIT ||
      stepPayment.paymentMethod.type === PAYMENT_METHOD_TYPE.PAYMENT_INTENT
    ) {
      paymentMethod.paymentIntentId = stepPayment.paymentMethod.paymentIntentId;
      paymentMethod.isSavedForLater = stepPayment.paymentMethod.isSavedForLater;
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
      if (isCaptchaEnabled() && !stepProfile.captcha) {
        this.setState({ error: this.props.intl.formatMessage({ defaultMessage: 'Captcha is required.' }) });
        window.scrollTo(0, 0);
        return false;
      }
      return validateGuestProfile(stepProfile, stepDetails, this.props.tier);
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

    if (!this.state.error) {
      await this.pushStepRoute(step.name);
    }
  };

  /** Navigate to another step, ensuring all route params are preserved */
  pushStepRoute = async (stepName, { query: newQueryParams, replace = false } = {}) => {
    // Reset errors if any
    this.setState({ error: null, isNavigating: true });

    // Navigate to the new route
    const { router } = this.props;
    const queryParams = this.getQueryParams();
    const queryHelper = this.getQueryHelper();
    const encodedQueryParams = newQueryParams || queryHelper.encode(queryParams);
    const route = this.getRoute(stepName === 'details' ? '' : stepName);
    const navigateFn = replace ? router.replace : router.push;
    await navigateFn({ pathname: route, query: omitBy(encodedQueryParams, value => !value) }, null, { shallow: true });
    this.setState({ isNavigating: false });
    this.scrollToTop();

    // Reinitialize form on success
    if (stepName === 'success') {
      this.setState({ isSubmitted: false, isSubmitting: false, stepPayment: null });
    }
  };

  getQueryHelper = () => {
    return this.props.isEmbed ? EmbedContributionFlowUrlQueryHelper : ContributionFlowUrlQueryHelper;
  };

  /** Get the route for the given step. Doesn't include query string. */
  getRoute = step => {
    const { collective, tier, isEmbed, router } = this.props;
    const verb = router.query.verb || 'donate';
    const stepRoute = !step || step === STEPS.DETAILS ? '' : `/${step}`;
    if (isEmbed) {
      if (tier) {
        return `/embed${getCollectivePageRoute(collective)}/contribute/${tier.slug}-${tier.legacyId}${stepRoute}`;
      } else {
        return `/embed${getCollectivePageRoute(collective)}/donate${stepRoute}`;
      }
    } else if (tier) {
      if (tier.type === 'TICKET' && collective.parent) {
        return `${getCollectivePageRoute(collective)}/order/${tier.legacyId}${stepRoute}`;
      } else {
        // Enforce "contribute" verb for ordering tiers
        return `${getCollectivePageRoute(collective)}/contribute/${tier.slug}-${tier.legacyId}/checkout${stepRoute}`;
      }
    } else if (verb === 'contribute' || verb === 'new-contribute') {
      // Never use `contribute` as verb if not using a tier (would introduce a route conflict)
      return `${getCollectivePageRoute(collective)}/donate${stepRoute}`;
    }

    return `${getCollectivePageRoute(collective)}/${verb}${stepRoute}`;
  };

  getRedirectUrlForSignIn = () => {
    if (typeof window === 'undefined') {
      return undefined;
    } else {
      return `${window.location.pathname}${window.location.search || ''}`;
    }
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

  canHavePlatformTips() {
    const { tier, collective } = this.props;
    if (!collective.platformContributionAvailable) {
      return false;
    } else if (!tier) {
      return true;
    } else if (tier.type === TierTypes.TICKET) {
      return false;
    } else if (tier.amountType === 'FIXED' && !tier.amount.valueInCents) {
      return false; // No platform tips for free tiers
    } else {
      return true;
    }
  }

  checkFormValidity = () => {
    return reportValidityHTML5(this.formRef.current);
  };

  getCurrentStepName = () => {
    return this.props.router.query.step || STEPS.DETAILS;
  };

  /** Returns the steps list */
  getSteps() {
    const { intl, collective, host, tier, LoggedInUser } = this.props;
    const { stepDetails, stepProfile, stepPayment, stepSummary } = this.state;
    const isFixedContribution = this.isFixedContribution(tier);
    const currency = tier?.amount.currency || collective.currency;
    const minAmount = this.getTierMinAmount(tier, currency);
    const noPaymentRequired = minAmount === 0 && (isFixedContribution || stepDetails?.amount === 0);
    const isStepProfileCompleted = Boolean(
      (stepProfile && LoggedInUser) || (stepProfile?.isGuest && validateGuestProfile(stepProfile, stepDetails, tier)),
    );

    const steps = [
      {
        name: 'details',
        label: intl.formatMessage(STEP_LABELS.details),
        isCompleted: Boolean(stepDetails),
        validate: () => {
          if (
            !this.checkFormValidity() ||
            !stepDetails ||
            stepDetails.amount < minAmount || // Min amount is per-item, so we don't need to multiply by quantity
            !stepDetails.quantity
          ) {
            return false;
          } else if (!isNil(tier?.availableQuantity) && stepDetails.quantity > tier.availableQuantity) {
            return false;
          } else if (
            stepDetails.amount &&
            stepDetails.platformTip &&
            stepDetails.platformTip / (stepDetails.amount * stepDetails.quantity) >= 0.5
          ) {
            return confirm(
              intl.formatMessage(OTHER_MESSAGES.tipAmountContributionWarning, {
                contributionAmount: formatCurrency(getTotalAmount(stepDetails, stepSummary), currency, {
                  locale: intl.locale,
                }),
                tipAmount: formatCurrency(stepDetails.platformTip, currency, { locale: intl.locale }),
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
    if (
      !noPaymentRequired &&
      (this.getApplicableTaxes(collective, host, tier?.type).length || this.state.forceSummaryStep)
    ) {
      steps.push({
        name: 'summary',
        label: intl.formatMessage(STEP_LABELS.summary),
        isCompleted: get(stepSummary, 'isReady', false),
      });
    }

    // Hide step payment if using a free tier with fixed price
    if (!noPaymentRequired) {
      steps.push({
        name: 'payment',
        label: intl.formatMessage(STEP_LABELS.payment),
        isCompleted: !stepProfile?.contributorRejectedCategories && stepPayment?.isCompleted,
        validate: action => {
          if (action === 'prev') {
            return true;
          } else if (stepPayment?.isKeyOnly) {
            return false; // Need to redirect to the payment step to load the payment method
          } else if (stepPayment?.key === STRIPE_PAYMENT_ELEMENT_KEY) {
            return stepPayment.isCompleted;
          } else {
            const isCompleted = Boolean(noPaymentRequired || stepPayment);
            if (
              !stepProfile.captcha &&
              isCaptchaEnabled() &&
              !LoggedInUser &&
              stepPayment?.key === NEW_CREDIT_CARD_KEY
            ) {
              this.showError(intl.formatMessage({ defaultMessage: 'Captcha is required.' }));
              return false;
            } else if (isCompleted && stepPayment?.key === NEW_CREDIT_CARD_KEY) {
              return stepPayment.paymentMethod?.stripeData?.complete;
            } else {
              return isCompleted;
            }
          }
        },
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
        onError: e => this.setState({ isSubmitting: false, error: e.message }),
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

  render() {
    const { collective, host, tier, LoggedInUser, loadingLoggedInUser, isEmbed, error: backendError } = this.props;
    const { error, isSubmitted, isSubmitting, stepDetails, stepSummary, stepProfile, stepPayment } = this.state;
    const isLoading = isSubmitted || isSubmitting;
    const pastEvent = collective.type === CollectiveType.EVENT && isPastEvent(collective);
    const queryParams = this.getQueryParams();
    const currency = tier?.amount.currency || collective.currency;
    const currentStepName = this.getCurrentStepName();

    if (currentStepName === STEPS.SUCCESS) {
      return <ContributionFlowSuccess collective={collective} />;
    }

    return (
      <Steps
        steps={this.getSteps()}
        currentStepName={currentStepName}
        onStepChange={this.onStepChange}
        onComplete={this.submitOrder}
        delayCompletionCheck={Boolean(loadingLoggedInUser && stepProfile)}
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
            {!this.getQueryParams().hideHeader && (
              <Box px={[2, 3]} mb={4}>
                <ContributionFlowHeader collective={collective} isEmbed={isEmbed} />
              </Box>
            )}
            {!queryParams.hideSteps && (
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
                  isSubmitted={this.state.isSubmitted}
                  loading={isValidating || isLoading}
                  currency={currency}
                  isFreeTier={this.getTierMinAmount(tier, currency) === 0}
                />
              </StepsProgressBox>
            )}
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
                    onChange={data => this.setState(data, this.updateRouteFromState)}
                    step={currentStep}
                    showPlatformTip={this.canHavePlatformTips()}
                    onNewCardFormReady={({ stripe, stripeElements }) => this.setState({ stripe, stripeElements })}
                    taxes={this.getApplicableTaxes(collective, host, tier?.type)}
                    onSignInClick={() => this.setState({ showSignIn: true })}
                    isEmbed={isEmbed}
                    isSubmitting={isValidating || isLoading}
                    disabledPaymentMethodTypes={queryParams.disabledPaymentMethodTypes}
                    hideCreditCardPostalCode={queryParams.hideCreditCardPostalCode}
                    contributeProfiles={this.getContributeProfiles(LoggedInUser, collective, tier)}
                  />
                  <Box mt={40}>
                    <ContributionFlowButtons
                      goNext={goNext}
                      goBack={queryParams.hideSteps && currentStep.name === STEPS.PAYMENT ? null : goBack} // We don't want to show the back button when linking directly to the payment step with `hideSteps=true`
                      step={currentStep}
                      prevStep={prevStep}
                      nextStep={nextStep}
                      isValidating={isValidating || isLoading}
                      paypalButtonProps={!nextStep ? this.getPaypalButtonProps({ currency }) : null}
                      currency={currency}
                      tier={tier}
                      stepDetails={stepDetails}
                      stepSummary={stepSummary}
                      disabled={this.state.isInitializing || this.state.isNavigating}
                    />
                  </Box>
                  {!isEmbed && (
                    <Box textAlign="center" mt={5}>
                      <CollectiveTitleContainer collective={collective} useLink>
                        <FormattedMessage
                          id="ContributionFlow.backToCollectivePage"
                          defaultMessage="Back to {accountName}'s Page"
                          values={{ accountName: collective.name }}
                        />
                      </CollectiveTitleContainer>
                    </Box>
                  )}
                </Box>
                {!queryParams.hideFAQ && (
                  <Box minWidth={[null, '300px']} mt={[4, null, 0]} ml={[0, 3, 4, 5]}>
                    <Box maxWidth={['100%', null, 300]} px={[1, null, 0]}>
                      <SafeTransactionMessage />
                      {currentStepName !== STEPS.SUMMARY && (
                        <Container fontSize="12px" mt={4}>
                          <P fontWeight="500" fontSize="inherit" mb={3}>
                            <FormattedMessage id="ContributionSummary" defaultMessage="Contribution Summary" />
                          </P>
                          <ContributionSummary
                            collective={collective}
                            stepDetails={stepDetails}
                            stepSummary={stepSummary}
                            stepPayment={stepPayment}
                            currency={currency}
                            tier={tier}
                          />
                        </Container>
                      )}
                      <ContributeFAQ collective={collective} mt={4} titleProps={{ mb: 2 }} />
                    </Box>
                  </Box>
                )}
              </Grid>
            )}
          </Container>
        )}
      </Steps>
    );
  }
}

const addCreateOrderMutation = graphql(
  gql`
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
  gql`
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
