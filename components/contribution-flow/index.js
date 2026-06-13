import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation } from '@apollo/client';
import { getApplicableTaxes } from '@opencollective/taxes';
import { CardElement } from '@stripe/react-stripe-js';
import { get, intersection, isEmpty, isEqual, isNil, omitBy, pick } from 'lodash-es';
import memoizeOne from 'memoize-one';
import { useRouter } from 'next/router';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import { styled } from 'styled-components';

import { AnalyticsEvent } from '../../lib/analytics/events';
import { track } from '../../lib/analytics/plausible';
import { AnalyticsProperty } from '../../lib/analytics/properties';
import { getCollectiveTypeForUrl } from '../../lib/collective';
import { CollectiveType } from '../../lib/constants/collectives';
import { getGQLV2FrequencyFromInterval } from '../../lib/constants/intervals';
import { MODERATION_CATEGORIES_ALIASES } from '../../lib/constants/moderation-categories';
import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from '../../lib/constants/payment-methods';
import { formatCurrency, roundCentsAmount } from '../../lib/currency-utils';
import { formatErrorMessage, getErrorFromGraphqlException } from '../../lib/errors';
import { isPastEvent } from '../../lib/events';
import {
  Experiment,
  isExperimentEnabled,
  isOpenSourceCollectiveHost,
  isOscTipExperiment,
  platformTipApplies,
} from '../../lib/experiments/experiments';
import { gql } from '../../lib/graphql/helpers';
import { AccountType } from '../../lib/graphql/types/v2/graphql';
import { setGuestToken } from '../../lib/guest-accounts';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
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

import { orderResponseFragment } from './graphql/fragments';
import CollectiveTitleContainer from './CollectiveTitleContainer';
import { DEFAULT_PLATFORM_TIP_PERCENTAGE, INCOGNITO_PROFILE_ALIAS, PERSONAL_PROFILE_ALIAS, STEPS } from './constants';
import ContributionFlowButtons from './ContributionFlowButtons';
import ContributionFlowHeader from './ContributionFlowHeader';
import ContributionFlowStepContainer from './ContributionFlowStepContainer';
import ContributionFlowStepsProgress from './ContributionFlowStepsProgress';
import ContributionFlowSuccess from './ContributionFlowSuccess';
import ContributionSummary from './ContributionSummary';
import { PlatformTipOption } from './PlatformTipContainer';
import {
  ContributionFlowUrlQueryHelper,
  EmbedContributionFlowUrlQueryHelper,
  stepsDataToUrlParamsData,
} from './query-parameters';
import SafeTransactionMessage from './SafeTransactionMessage';
import SignInToContributeAsAnOrganization from './SignInToContributeAsAnOrganization';
import { validateGuestProfile } from './StepProfileGuestForm';
import {
  getGQLV2AmountInput,
  getGuestInfoFromStepProfile,
  getTotalAmount,
  isSupportedInterval,
  NEW_CREDIT_CARD_KEY,
  STRIPE_PAYMENT_ELEMENT_KEY,
} from './utils';
const getQueryStringParam = param => (Array.isArray(param) ? param[0] : param);
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
const createIncognitoProfileMutation = gql`
  mutation CreateIncognitoProfile {
    createIncognitoProfile {
      id
      name
      slug
      type
      isIncognito
    }
  }
`;
const createOrderMutation = gql`
  mutation CreateOrder($order: OrderCreateInput!) {
    createOrder(order: $order) {
      ...OrderResponseFragment
    }
  }
  ${orderResponseFragment}
`;
const confirmOrderMutation = gql`
  mutation ConfirmOrder($order: OrderReferenceInput!, $guestToken: String) {
    confirmOrder(order: $order, guestToken: $guestToken) {
      ...OrderResponseFragment
    }
  }
  ${orderResponseFragment}
`;
const memoizedIsFixedContribution = memoizeOne(isFixedContribution);
const memoizedGetTierMinAmount = memoizeOne(getTierMinAmount);
const memoizedGetApplicableTaxes = memoizeOne(getApplicableTaxes);
// Memoized helpers
function getInitialState({
  collective,
  tier,
  LoggedInUser,
  queryParams,
  getCurrentStepName,
  getDefaultStepProfile,
  canHavePlatformTips,
}) {
  const currency = tier?.amount?.currency || collective.currency;
  const amount = queryParams.amount || getDefaultTierAmount(tier, collective, currency);
  const quantity = queryParams.quantity || 1;
  return {
    error: null,
    stripe: null,
    stripeElements: null,
    isSubmitted: false,
    isSubmitting: false,
    isInitializing: true,
    isNavigating: false,
    showSignIn: false,
    createdOrder: null,
    forceSummaryStep: getCurrentStepName() !== STEPS.DETAILS, // If not starting the flow with the details step, we force the summary step to make sure contributors have an easy way to review their contribution
    // Steps data
    stepProfile: getDefaultStepProfile(),
    stepPayment: {
      key: queryParams.paymentMethod,
      isKeyOnly: true, // For the step payment to recognize if it needs to load the payment method
    },
    stepSummary: null,
    stepDetails: {
      quantity,
      interval: isSupportedInterval(collective, tier, LoggedInUser, queryParams.interval)
        ? queryParams.interval
        : getDefaultInterval(tier),
      amount,
      platformTip: canHavePlatformTips()
        ? roundCentsAmount(amount * quantity * DEFAULT_PLATFORM_TIP_PERCENTAGE, currency)
        : 0,
      platformTipOption: PlatformTipOption.FIFTEEN_PERCENT,
      isNewPlatformTip: isExperimentEnabled(Experiment.NEW_PLATFORM_TIP_FLOW, LoggedInUser, { collective }),
      currency,
    },
  };
}
const ContributionFlow = ({
  collective,
  contributorProfiles,
  host,
  tier,
  isEmbed = false,
  error: backendError,
  onStepChange = undefined,
  onSuccess = undefined,
}) => {
  const router = useRouter();
  const intl = useIntl();
  const { LoggedInUser, loadingLoggedInUser, refetchLoggedInUser } = useLoggedInUser();
  const [createIncognitoProfile] = useMutation(createIncognitoProfileMutation);
  const [createOrder] = useMutation(createOrderMutation);
  const [confirmOrder] = useMutation(confirmOrderMutation);
  const mainContainerRef = useRef(null);
  const formRef = useRef(null);
  const stepSummaryRef = useRef(null);
  // OSC-only A/B: half of OSC contributors that would otherwise see the tip get the tip step hidden.
  // Cached on the instance so the variant is stable for the duration of the flow.
  const platformTipDisabledByExperimentRef = useRef(
    isOpenSourceCollectiveHost(collective?.host) &&
      isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, LoggedInUser, { collective }),
  );
  const getQueryHelper = useCallback(() => {
    return isEmbed ? EmbedContributionFlowUrlQueryHelper : ContributionFlowUrlQueryHelper;
  }, [isEmbed]);
  const getQueryParamsMemoized = useMemo(() => memoizeOne(query => getQueryHelper().decode(query)), [getQueryHelper]);
  const getQueryParams = useCallback(() => {
    return getQueryParamsMemoized(router.query);
  }, [getQueryParamsMemoized, router.query]);
  const getCurrentStepName = useCallback(() => {
    return getQueryStringParam(router.query.step) || STEPS.DETAILS;
  }, [router.query.step]);
  const canHavePlatformTips = useCallback(() => {
    if (platformTipDisabledByExperimentRef.current) {
      return false;
    }
    return platformTipApplies(collective, tier);
  }, [collective, tier]);
  const isOscTipExperimentActive = useCallback(() => {
    return isOscTipExperiment(collective, tier);
  }, [collective, tier]);
  const getDefaultStepProfile = useCallback(() => {
    const profiles = contributorProfiles || [];
    const queryParams = getQueryParams();
    // If there's a default profile set in contributeAs, use it
    let contributorProfile;
    if (queryParams.contributeAs && queryParams.contributeAs !== PERSONAL_PROFILE_ALIAS) {
      if (queryParams.contributeAs === INCOGNITO_PROFILE_ALIAS) {
        contributorProfile = profiles.find(({ account: { isIncognito } }) => isIncognito);
      } else if (queryParams.contributeAs === 'me') {
        contributorProfile = profiles.find(({ account: { type } }) => type === AccountType.INDIVIDUAL);
      } else {
        contributorProfile = profiles.find(({ account: { slug } }) => slug === queryParams.contributeAs);
      }
    }
    if (contributorProfile) {
      return contributorProfile.account;
    } else if (profiles[0]?.account) {
      // Otherwise to the logged-in user personal profile, if any
      return profiles[0].account;
    }
    // Otherwise, it's a guest contribution
    return {
      isGuest: true,
      email: queryParams.email || '',
      name: queryParams.name || '',
      legalName: queryParams.legalName || '',
    };
  }, [contributorProfiles, getQueryParams]);
  const [state, setState] = useState(() => {
    const queryParams = (isEmbed ? EmbedContributionFlowUrlQueryHelper : ContributionFlowUrlQueryHelper).decode(
      router.query,
    );
    const getCurrentStepNameForInit = () => getQueryStringParam(router.query.step) || STEPS.DETAILS;
    const canHavePlatformTipsForInit = () => {
      const platformTipDisabledByExperiment =
        isOpenSourceCollectiveHost(collective?.host) &&
        isExperimentEnabled(Experiment.OPENSOURCE_PLATFORM_TIP_AB, LoggedInUser, { collective });
      if (platformTipDisabledByExperiment) {
        return false;
      }
      return platformTipApplies(collective, tier);
    };
    const getDefaultStepProfileForInit = () => {
      const profiles = contributorProfiles || [];
      let contributorProfile;
      if (queryParams.contributeAs && queryParams.contributeAs !== PERSONAL_PROFILE_ALIAS) {
        if (queryParams.contributeAs === INCOGNITO_PROFILE_ALIAS) {
          contributorProfile = profiles.find(({ account: { isIncognito } }) => isIncognito);
        } else if (queryParams.contributeAs === 'me') {
          contributorProfile = profiles.find(({ account: { type } }) => type === AccountType.INDIVIDUAL);
        } else {
          contributorProfile = profiles.find(({ account: { slug } }) => slug === queryParams.contributeAs);
        }
      }
      if (contributorProfile) {
        return contributorProfile.account;
      } else if (profiles[0]?.account) {
        return profiles[0].account;
      }
      return {
        isGuest: true,
        email: queryParams.email || '',
        name: queryParams.name || '',
        legalName: queryParams.legalName || '',
      };
    };
    return getInitialState({
      collective,
      tier,
      LoggedInUser,
      queryParams,
      getCurrentStepName: getCurrentStepNameForInit,
      getDefaultStepProfile: getDefaultStepProfileForInit,
      canHavePlatformTips: canHavePlatformTipsForInit,
    });
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const scrollToTop = useCallback(() => {
    if (mainContainerRef.current) {
      mainContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  }, []);
  const showError = useCallback(
    error => {
      setState(prev => ({ ...prev, error }));
      scrollToTop();
    },
    [scrollToTop],
  );
  const getRoute = useCallback(
    /** Get the route for the given step. Doesn't include query string. */
    step => {
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
    },
    [collective, isEmbed, router.query.verb, tier],
  );
  const pushStepRoute = useCallback(
    /** Navigate to another step, ensuring all route params are preserved */
    async (stepName, { query: newQueryParams, replace = false } = {}) => {
      // Reset errors if any
      setState(prev => ({ ...prev, error: null, isNavigating: true }));
      // Navigate to the new route
      const queryParams = getQueryParams();
      const queryHelper = getQueryHelper();
      const encodedQueryParams = newQueryParams || queryHelper.encode(queryParams);
      const route = getRoute(stepName === 'details' ? '' : stepName);
      const navigateFn = replace ? router.replace : router.push;
      await navigateFn({ pathname: route, query: omitBy(encodedQueryParams, value => !value) }, null, {
        shallow: true,
      });
      setState(prev => ({ ...prev, isNavigating: false }));
      scrollToTop();
      // Reinitialize form on success
      if (stepName === 'success') {
        setState(prev => ({ ...prev, isSubmitted: false, isSubmitting: false, stepPayment: null }));
      }
    },
    [getQueryHelper, getQueryParams, getRoute, router.push, router.replace, scrollToTop],
  );
  const updateRouteFromState = useCallback(
    async (stateOverride = null) => {
      const currentState = stateOverride || stateRef.current;
      if (currentState.isNavigating) {
        return;
      }
      const currentStepName = getCurrentStepName();
      if (currentStepName !== STEPS.SUCCESS) {
        const { stepDetails, stepProfile, stepPayment } = currentState;
        const currentUrlState = getQueryParams();
        const expectedUrlState = stepsDataToUrlParamsData(
          LoggedInUser,
          currentUrlState,
          stepDetails,
          stepProfile,
          stepPayment,
          isEmbed,
        );
        if (!isEqual(currentUrlState, omitBy(expectedUrlState, isNil))) {
          const route = getRoute(currentStepName);
          const queryHelper = getQueryHelper();
          setState(prev => ({ ...prev, isNavigating: true }));
          await router.replace({ pathname: route, query: omitBy(queryHelper.encode(expectedUrlState), isNil) }, null, {
            scroll: false,
            shallow: true,
          });
          setState(prev => ({ ...prev, isNavigating: false }));
        }
      }
    },
    [LoggedInUser, getCurrentStepName, getQueryHelper, getQueryParams, getRoute, isEmbed, router],
  );
  const handleError = useCallback(message => {
    track(AnalyticsEvent.CONTRIBUTION_ERROR);
    setState(prev => ({ ...prev, isSubmitting: false, error: message }));
  }, []);
  const handleSuccess = useCallback(
    async order => {
      setState(prev => ({ ...prev, isSubmitted: true, isSubmitting: false }));
      refetchLoggedInUser(); // to update memberships
      const queryParams = getQueryParams();
      onSuccess?.(order);
      if (isValidExternalRedirect(queryParams.redirect)) {
        followOrderRedirectUrl(router, collective, order, queryParams.redirect, {
          shouldRedirectParent: Boolean(queryParams.shouldRedirectParent),
        });
      } else {
        const email = stateRef.current.stepProfile?.email;
        return pushStepRoute('success', { replace: false, query: { OrderId: order.id, email } });
      }
    },
    [collective, getQueryParams, onSuccess, pushStepRoute, refetchLoggedInUser, router],
  );
  const handleStripeErrorRef = useRef(null);
  const handleOrderResponse = useCallback(
    async ({ order, stripeError, guestToken }, email) => {
      const { stepPayment } = stateRef.current;
      if (guestToken && order) {
        setGuestToken(email || '', order.id, guestToken);
      }
      if (
        stepPayment?.paymentMethod?.service === PAYMENT_METHOD_SERVICE.STRIPE &&
        (stepPayment?.key === STRIPE_PAYMENT_ELEMENT_KEY ||
          stepPayment.paymentMethod.type === PAYMENT_METHOD_TYPE.US_BANK_ACCOUNT ||
          stepPayment.paymentMethod.type === PAYMENT_METHOD_TYPE.SEPA_DEBIT)
      ) {
        const { stripeData } = stepPayment;
        const baseRoute = collective.parent?.slug
          ? `${window.location.origin}/${collective.parent?.slug}/${getCollectiveTypeForUrl(collective)}/${collective.slug}`
          : `${window.location.origin}/${collective.slug}`;
        const returnUrl = new URL(`${baseRoute}/donate/success`);
        returnUrl.searchParams.set('OrderId', order.id);
        returnUrl.searchParams.set('stripeAccount', stripeData?.stripe?.stripeAccount);
        const queryParams = getQueryParams();
        if (queryParams.redirect) {
          returnUrl.searchParams.set('redirect', queryParams.redirect);
          if (queryParams.shouldRedirectParent) {
            returnUrl.searchParams.set('shouldRedirectParent', String(queryParams.shouldRedirectParent));
          }
        }
        try {
          await confirmPayment(stripeData?.stripe, stripeData?.paymentIntentClientSecret, {
            returnUrl: returnUrl.href,
            elements: stripeData?.elements,
            type: stepPayment.paymentMethod?.type,
            paymentMethodId: stepPayment.paymentMethod?.data?.stripePaymentMethodId,
          });
          setState(prev => ({ ...prev, isSubmitted: true, isSubmitting: false }));
          return handleSuccess(order);
        } catch (e) {
          setState(prev => ({
            ...prev,
            isSubmitting: false,
            error: e.message,
            stepPayment: {
              ...prev.stepPayment,
              chargeAttempt: (prev.stepPayment?.chargeAttempt || 0) + 1,
            },
          }));
        }
      } else if (stripeError) {
        return handleStripeErrorRef.current?.(order, stripeError, email, guestToken);
      } else {
        return handleSuccess(order);
      }
    },
    [collective, getQueryParams, handleSuccess],
  );
  const handleStripeError = useCallback(
    async (order, stripeError, email, guestToken) => {
      const { message, account, response } = stripeError;
      if (!response) {
        handleError(message);
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
          handleError(result.error.message);
        } else if (result.paymentIntent && result.paymentIntent.status === 'requires_confirmation') {
          setState(prev => ({ ...prev, isSubmitting: true, error: null }));
          try {
            const response = await confirmOrder({ variables: { order: { id: order.id }, guestToken } });
            return handleOrderResponse(response.data.confirmOrder, email);
          } catch (e) {
            handleError(e.message);
          }
        }
      }
    },
    [confirmOrder, handleError, handleOrderResponse],
  );
  handleStripeErrorRef.current = handleStripeError;
  // ---- Getters ----
  const getPaymentMethod = useCallback(async () => {
    const { stepPayment, stripe, stripeElements } = stateRef.current;
    if (!stepPayment?.paymentMethod) {
      return null;
    }
    const paymentMethod = pick(stepPayment.paymentMethod, ['service', 'type', 'manualPaymentProvider']);
    if (stepPayment.paymentMethod.id) {
      // Payment Method already registered
      paymentMethod.id = stepPayment.paymentMethod.id;
    } else if (stepPayment.key === NEW_CREDIT_CARD_KEY) {
      // New Credit Card
      const cardElement = stripeElements.getElement(CardElement);
      const { token } = await stripe.createToken(cardElement);
      const pm = stripeTokenToPaymentMethod(token);
      paymentMethod.name = pm.name;
      paymentMethod.isSavedForLater = stepPayment.paymentMethod.isSavedForLater;
      paymentMethod.creditCardInfo = { token: pm.token, ...pm.data };
    } else if (stepPayment.paymentMethod.service === PAYMENT_METHOD_SERVICE.PAYPAL) {
      // PayPal
      const paypalFields = ['token', 'data', 'orderId', 'subscriptionId'];
      paymentMethod.paypalInfo = pick(stepPayment.paymentMethod.paypalInfo, paypalFields);
      // Define the right type (doesn't matter that much today, but make it future proof)
      if (paymentMethod.paypalInfo.subscriptionId) {
        paymentMethod.type = PAYMENT_METHOD_TYPE.SUBSCRIPTION;
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
  }, []);
  const submitOrderRef = useRef(null);
  // ---- Order submission & error handling ----
  const submitOrder = useCallback(async () => {
    const { stepDetails, stepProfile, stepSummary } = stateRef.current;
    setState(prev => ({ ...prev, error: null, isSubmitting: true }));
    let fromAccount;
    let guestInfo;
    if (stepProfile?.isGuest) {
      guestInfo = getGuestInfoFromStepProfile(stepProfile);
    } else if (stepProfile && 'id' in stepProfile) {
      fromAccount = typeof stepProfile.id === 'string' ? { id: stepProfile.id } : { legacyId: stepProfile.id };
    }
    const platformTipBaseAmount = stepDetails.amount * stepDetails.quantity;
    const props = {
      [AnalyticsProperty.CONTRIBUTION_HAS_PLATFORM_TIP]: stepDetails.amount && stepDetails.platformTip > 0,
      [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_PERCENTAGE]:
        platformTipBaseAmount && stepDetails.platformTip > 0 ? stepDetails.platformTip / platformTipBaseAmount : 0,
      [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_VARIANT]: stepDetails.isNewPlatformTip ? 'new' : 'old',
      [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_ENABLED]: canHavePlatformTips(),
      [AnalyticsProperty.CONTRIBUTION_IS_OSC_TIP_EXPERIMENT]: isOscTipExperimentActive(),
      [AnalyticsProperty.CONTRIBUTION_HOST_SLUG]: collective?.host?.slug,
    };
    track(AnalyticsEvent.CONTRIBUTION_SUBMITTED, {
      props,
    });
    try {
      const totalAmount = getTotalAmount(stepDetails, stepSummary);
      const skipTaxes = !totalAmount || isEmpty(memoizedGetApplicableTaxes(collective, host, tier?.type));
      const response = await createOrder({
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
            toAccount: pick(collective, ['id']),
            customData: stepDetails.customData,
            paymentMethod: await getPaymentMethod(),
            platformTipAmount: getGQLV2AmountInput(stepDetails.platformTip, undefined),
            tier: tier && { legacyId: tier.legacyId },
            context: {
              isEmbed: isEmbed || false,
              isNewPlatformTipFlow: stepDetails.isNewPlatformTip,
              platformTipOffered: canHavePlatformTips(),
            },
            tags: getQueryParams().tags,
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
      return handleOrderResponse(response.data.createOrder, stepProfile?.email);
    } catch (e) {
      handleError();
      showError(getErrorFromGraphqlException(e));
    }
  }, [
    canHavePlatformTips,
    collective,
    createOrder,
    getPaymentMethod,
    getQueryParams,
    handleError,
    handleOrderResponse,
    host,
    isEmbed,
    showError,
    tier,
  ]);
  submitOrderRef.current = submitOrder;
  const getContributorRejectedCategories = useCallback(
    account => {
      const rejectedCategories = get(collective, 'settings.moderation.rejectedCategories', []);
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
    },
    [collective],
  );
  const checkFormValidity = useCallback(() => {
    return reportValidityHTML5(formRef.current);
  }, []);
  const validateStepProfile = useCallback(
    /** Validate step profile, create new incognito/org if necessary */
    async action => {
      const { stepProfile, stepDetails, error } = stateRef.current;
      if (error) {
        setState(prev => ({ ...prev, error: null }));
      }
      if (!checkFormValidity()) {
        return false;
      }
      if (!stepProfile) {
        // Can only ignore validation if going back
        return action === 'prev';
      } else if (stepProfile.isGuest) {
        if (isCaptchaEnabled() && !stepProfile.captcha) {
          setState(prev => ({
            ...prev,
            error: intl.formatMessage({ defaultMessage: 'Captcha is required.', id: 'Rpq6pU' }),
          }));
          window.scrollTo(0, 0);
          return false;
        }
        return validateGuestProfile(stepProfile, stepDetails, tier, collective);
      }
      if ('id' in stepProfile && stepProfile.id === 'incognito') {
        // Check if we're creating a new profile
        setState(prev => ({ ...prev, isSubmitting: true }));
        try {
          const { data: result } = await createIncognitoProfile();
          const createdProfile = result.createIncognitoProfile;
          await refetchLoggedInUser();
          setState(prev => ({ ...prev, stepProfile: createdProfile, isSubmitting: false }));
        } catch (error) {
          setState(prev => ({ ...prev, error: error.message, isSubmitting: false }));
          window.scrollTo(0, 0);
          return false;
        }
      }
      const containsRejectedCategories = getContributorRejectedCategories(stepProfile);
      // Check that the contributor is not blocked from contributing to the collective
      if (!isEmpty(containsRejectedCategories)) {
        setState(prev => ({
          ...prev,
          stepProfile: { ...prev.stepProfile, contributorRejectedCategories: containsRejectedCategories },
        }));
      }
      return true;
    },
    [
      checkFormValidity,
      collective,
      createIncognitoProfile,
      getContributorRejectedCategories,
      intl,
      refetchLoggedInUser,
      tier,
    ],
  );
  const onStepChangeHandler = useCallback(
    /** Steps component callback  */
    async step => {
      setState(prev => ({ ...prev, showSignIn: false }));
      if (!stateRef.current.error) {
        await pushStepRoute(step.name);
        onStepChange?.(step.name);
      }
    },
    [onStepChange, pushStepRoute],
  );
  const getRedirectUrlForSignIn = useCallback(() => {
    if (typeof window === 'undefined') {
      return undefined;
    } else {
      return `${window.location.pathname}${window.location.search || ''}`;
    }
  }, []);
  const validateStepSummary = useCallback(action => {
    if (action === 'prev') {
      return true;
    }

    if (stepSummaryRef.current?.validate) {
      return stepSummaryRef.current.validate();
    }

    return get(stateRef.current.stepSummary, 'isReady', false);
  }, []);
  const getSteps = useCallback(
    /** Returns the steps list */
    () => {
      const { stepDetails, stepProfile, stepPayment, stepSummary, forceSummaryStep } = stateRef.current;
      const isFixed = memoizedIsFixedContribution(tier);
      const currency = tier?.amount.currency || collective.currency;
      const minAmount = memoizedGetTierMinAmount(tier, currency);
      const noPaymentRequired = minAmount === 0 && (isFixed || stepDetails?.amount === 0);
      const isStepProfileCompleted = Boolean(
        (stepProfile && LoggedInUser) ||
        (stepProfile?.isGuest && validateGuestProfile(stepProfile, stepDetails, tier, collective)),
      );
      const steps = [
        {
          name: 'details',
          label: intl.formatMessage(STEP_LABELS.details),
          isCompleted: Boolean(stepDetails),
          validate: () => {
            if (
              !checkFormValidity() ||
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
          validate: validateStepProfile,
        },
      ];
      // Show the summary step only if the order has tax
      if (!noPaymentRequired && (memoizedGetApplicableTaxes(collective, host, tier?.type).length || forceSummaryStep)) {
        steps.push({
          name: 'summary',
          label: intl.formatMessage(STEP_LABELS.summary),
          isCompleted: get(stepSummary, 'isReady', false),
          validate: validateStepSummary,
        });
      }
      // Hide step payment if using a free tier with fixed price
      if (!noPaymentRequired) {
        steps.push({
          name: 'payment',
          label: intl.formatMessage(STEP_LABELS.payment),
          isCompleted:
            !(stepProfile && !stepProfile.isGuest && stepProfile.contributorRejectedCategories) &&
            stepPayment?.isCompleted,
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
                showError(intl.formatMessage({ defaultMessage: 'Captcha is required.', id: 'Rpq6pU' }));
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
    },
    [
      LoggedInUser,
      checkFormValidity,
      collective,
      host,
      intl,
      showError,
      tier,
      validateStepProfile,
      validateStepSummary,
    ],
  );
  const getPaypalButtonProps = useCallback(
    ({ currency }) => {
      const { stepPayment, stepDetails, stepSummary } = stateRef.current;
      if (stepPayment?.paymentMethod?.service === PAYMENT_METHOD_SERVICE.PAYPAL) {
        return {
          host: host,
          collective,
          tier,
          currency: currency,
          style: { size: 'responsive', height: 47 },
          totalAmount: getTotalAmount(stepDetails, stepSummary),
          interval: stepDetails?.interval,
          onClick: () => setState(prev => ({ ...prev, isSubmitting: true })),
          onCancel: () => setState(prev => ({ ...prev, isSubmitting: false })),
          onError: e => setState(prev => ({ ...prev, isSubmitting: false, error: e.message })),
          // New callback, used by `PayWithPaypalButton`
          onSuccess: paypalInfo => {
            setState(prev => {
              const next = {
                ...prev,
                stepPayment: {
                  ...prev.stepPayment,
                  paymentMethod: {
                    service: PAYMENT_METHOD_SERVICE.PAYPAL,
                    type: PAYMENT_METHOD_TYPE.PAYMENT,
                    paypalInfo,
                  },
                },
              };
              Promise.resolve().then(() => submitOrderRef.current?.());
              return next;
            });
          },
        };
      }
    },
    [collective, host, tier],
  );
  const setStateAndUpdateRoute = useCallback(
    data => {
      // Clear error when payment method changes
      if (data.stepPayment && data.stepPayment.key !== stateRef.current.stepPayment?.key) {
        setState(prev => {
          const next = { ...prev, ...data, error: null };
          stateRef.current = next;
          Promise.resolve().then(() => updateRouteFromState(next));
          return next;
        });
      } else {
        setState(prev => {
          const next = { ...prev, ...data };
          stateRef.current = next;
          Promise.resolve().then(() => updateRouteFromState(next));
          return next;
        });
      }
    },
    [updateRouteFromState],
  );
  const prevLoggedInUserRef = useRef(LoggedInUser);
  const prevContributorProfilesRef = useRef(contributorProfiles || []);
  const prevLoadingLoggedInUserRef = useRef(loadingLoggedInUser);
  useEffect(() => {
    const step = getCurrentStepName();
    if (step !== 'success' && step !== 'details') {
      track(AnalyticsEvent.CONTRIBUTION_STARTED, {
        props: {
          [AnalyticsProperty.CONTRIBUTION_STEP]: getCurrentStepName(),
          [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_VARIANT]: stateRef.current.stepDetails.isNewPlatformTip
            ? 'new'
            : 'old',
          [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_ENABLED]: canHavePlatformTips(),
          [AnalyticsProperty.CONTRIBUTION_IS_OSC_TIP_EXPERIMENT]: isOscTipExperimentActive(),
          [AnalyticsProperty.CONTRIBUTION_HOST_SLUG]: collective?.host?.slug,
        },
      });
      if (step !== 'details') {
        // started the contribution flow at advanced step with details picked.
        track(AnalyticsEvent.CONTRIBUTION_DETAILS_STEP_COMPLETED);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- preserve componentDidMount behavior
  }, []);
  useEffect(() => {
    if (!loadingLoggedInUser && stateRef.current.isInitializing) {
      updateRouteFromState().then(() => setState(prev => ({ ...prev, isInitializing: false })));
    }
  }, [loadingLoggedInUser, updateRouteFromState]);
  useEffect(() => {
    const oldLoggedInUser = prevLoggedInUserRef.current;
    const oldContributorProfiles = prevContributorProfilesRef.current;
    const oldLoadingLoggedInUser = prevLoadingLoggedInUserRef.current;
    if (oldLoggedInUser && !LoggedInUser) {
      // User has logged out, reset the state
      setState(prev => ({ ...prev, stepProfile: null, stepSummary: null, stepPayment: null }));
      pushStepRoute(STEPS.PROFILE);
    } else if (
      (!oldLoggedInUser && LoggedInUser) ||
      (oldContributorProfiles.length === 0 && contributorProfiles.length > 0)
    ) {
      // User has logged in, reload the step profile
      setState(prev => ({ ...prev, stepProfile: getDefaultStepProfile() }));
      // reset the state if it was a guest
      if (stateRef.current.stepProfile?.isGuest) {
        const previousEmail = stateRef.current.stepProfile.email;
        const newStepProfile = getDefaultStepProfile();
        const hasChangedEmail = previousEmail && previousEmail !== newStepProfile.email;
        setState(prev => ({ ...prev, stepProfile: newStepProfile, stepSummary: null, stepPayment: null }));
        if (hasChangedEmail && ![STEPS.DETAILS, STEPS.PROFILE].includes(stateRef.current.step)) {
          pushStepRoute(STEPS.PROFILE); // Force user to re-fill profile
        }
      }
    } else if (oldLoadingLoggedInUser && !loadingLoggedInUser) {
      // Login failed, reset the state to make sure we fallback on guest mode
      setState(prev => ({ ...prev, stepProfile: getDefaultStepProfile() }));
    }
    prevLoggedInUserRef.current = LoggedInUser;
    prevContributorProfilesRef.current = contributorProfiles || [];
    prevLoadingLoggedInUserRef.current = loadingLoggedInUser;
  }, [LoggedInUser, contributorProfiles, getDefaultStepProfile, loadingLoggedInUser, pushStepRoute]);
  const { error, isSubmitted, isSubmitting, stepDetails, stepSummary, stepProfile, stepPayment } = state;
  const isLoading = isSubmitted || isSubmitting;
  const pastEvent = collective.type === CollectiveType.EVENT && isPastEvent(collective);
  const queryParams = getQueryParams();
  const currency = tier?.amount.currency || collective.currency;
  const currentStepName = getCurrentStepName();
  if (currentStepName === STEPS.SUCCESS) {
    return <ContributionFlowSuccess collective={collective} />;
  }
  return (
    <Steps
      steps={getSteps()}
      currentStepName={currentStepName}
      onStepChange={onStepChangeHandler}
      onComplete={submitOrder}
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
          ref={mainContainerRef}
        >
          {!getQueryParams().hideHeader && (
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
                isSubmitted={state.isSubmitted}
                loading={isValidating || isLoading}
                currency={currency}
                isFreeTier={memoizedGetTierMinAmount(tier, currency) === 0}
              />
            </StepsProgressBox>
          )}
          {/* main container */}
          {(currentStep.name !== STEPS.DETAILS && loadingLoggedInUser) || !isValidStep ? (
            <Box py={[4, 5]}>
              <Loading />
            </Box>
          ) : currentStep.name === STEPS.PROFILE && !LoggedInUser && state.showSignIn ? (
            <SignInToContributeAsAnOrganization
              defaultEmail={stepProfile?.email}
              redirect={getRedirectUrlForSignIn()}
              onCancel={() => setState(prev => ({ ...prev, showSignIn: false }))}
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
              <Box as="form" ref={formRef} onSubmit={e => e.preventDefault()} maxWidth="100%">
                {(error || backendError) && (
                  <MessageBox type="error" withIcon mb={3} data-cy="contribution-flow-error">
                    {formatErrorMessage(intl, error) || backendError}
                  </MessageBox>
                )}
                {pastEvent && (
                  <MessageBox type="warning" withIcon mb={3} data-cy="contribution-flow-warning">
                    {intl.formatMessage(OTHER_MESSAGES.pastEventWarning)}
                  </MessageBox>
                )}
                <ContributionFlowStepContainer
                  collective={collective}
                  tier={tier}
                  mainState={state}
                  onChange={setStateAndUpdateRoute}
                  step={currentStep}
                  showPlatformTip={canHavePlatformTips()}
                  isOscTipExperiment={isOscTipExperimentActive()}
                  onNewCardFormReady={({ stripe, stripeElements }) =>
                    setState(prev => ({ ...prev, stripe, stripeElements }))
                  }
                  taxes={memoizedGetApplicableTaxes(collective, host, tier?.type)}
                  onSignInClick={() => setState(prev => ({ ...prev, showSignIn: true }))}
                  isEmbed={isEmbed}
                  isSubmitting={isValidating || isLoading}
                  disabledPaymentMethodTypes={queryParams.disabledPaymentMethodTypes}
                  hideCreditCardPostalCode={queryParams.hideCreditCardPostalCode}
                  contributorProfiles={contributorProfiles}
                  stepSummaryRef={stepSummaryRef}
                />
                <Box mt={40}>
                  <ContributionFlowButtons
                    goNext={goNext}
                    goBack={queryParams.hideSteps && currentStep.name === STEPS.PAYMENT ? null : goBack} // We don't want to show the back button when linking directly to the payment step with `hideSteps=true`
                    step={currentStep}
                    prevStep={prevStep}
                    nextStep={nextStep}
                    isValidating={isValidating || isLoading}
                    paypalButtonProps={!nextStep ? getPaypalButtonProps({ currency }) : null}
                    currency={currency}
                    tier={tier}
                    stepDetails={stepDetails}
                    stepSummary={stepSummary}
                    disabled={state.isInitializing || state.isNavigating}
                  />
                </Box>
                {!isEmbed && (
                  <Box textAlign="center" mt={5}>
                    <CollectiveTitleContainer collective={collective} useLink linkColor={undefined}>
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
                          renderTax={undefined}
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
};
export default ContributionFlow;
