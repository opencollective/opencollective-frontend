import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from '@apollo/client/react/hoc';
import { getApplicableTaxes } from '@opencollective/taxes';
import { find, get, intersection, isEmpty, isNil, omitBy, pick } from 'lodash';
import memoizeOne from 'memoize-one';
import { withRouter } from 'next/router';
import { defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { getGQLV2FrequencyFromInterval } from '../../lib/constants/intervals';
import { MODERATION_CATEGORIES_ALIASES } from '../../lib/constants/moderation-categories';
import { GQLV2_PAYMENT_METHOD_TYPES } from '../../lib/constants/payment-methods';
import { TierTypes } from '../../lib/constants/tiers-types';
import { TransactionTypes } from '../../lib/constants/transactions';
import { formatErrorMessage, getErrorFromGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import { addCreateCollectiveMutation } from '../../lib/graphql/mutations';
import { setGuestToken } from '../../lib/guest-accounts';
import { getStripe, stripeTokenToPaymentMethod } from '../../lib/stripe';
import { getDefaultTierAmount, getTierMinAmount, isFixedContribution } from '../../lib/tier-utils';
import { objectToQueryString } from '../../lib/url_helpers';
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
import { STEPS } from './constants';
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
import { getGQLV2AmountInput, getTotalAmount, isAllowedRedirect, NEW_CREDIT_CARD_KEY } from './utils';

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

class ContributionFlow extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      currency: PropTypes.string.isRequired,
      platformContributionAvailable: PropTypes.bool,
      parent: PropTypes.shape({
        slug: PropTypes.string,
      }),
    }).isRequired,
    host: PropTypes.shape({
      plan: PropTypes.shape({
        platformTips: PropTypes.bool,
      }),
    }).isRequired,
    tier: PropTypes.object,
    intl: PropTypes.object,
    createOrder: PropTypes.func.isRequired,
    confirmOrder: PropTypes.func.isRequired,
    fixedInterval: PropTypes.string,
    fixedAmount: PropTypes.number,
    platformContribution: PropTypes.number,
    skipStepDetails: PropTypes.bool,
    loadingLoggedInUser: PropTypes.bool,
    isEmbed: PropTypes.bool,
    step: PropTypes.string,
    redirect: PropTypes.string,
    verb: PropTypes.string,
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
      isSubmitted: false,
      isSubmitting: false,
      stepProfile: null,
      stepPayment: null,
      stepSummary: null,
      showSignIn: false,
      stepDetails: {
        quantity: 1,
        interval: props.fixedInterval || props.tier?.interval,
        amount: props.fixedAmount || getDefaultTierAmount(props.tier),
        platformContribution: props.platformContribution,
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
    this.setState({ error: null });

    let fromAccount, guestInfo;
    if (stepProfile.isGuest) {
      guestInfo = pick(stepProfile, ['email', 'name', 'location']);
    } else {
      fromAccount = typeof stepProfile.id === 'string' ? { id: stepProfile.id } : { legacyId: stepProfile.id };
    }

    try {
      const response = await this.props.createOrder({
        variables: {
          order: {
            quantity: stepDetails.quantity,
            amount: { valueInCents: stepDetails.amount },
            frequency: getGQLV2FrequencyFromInterval(stepDetails.interval),
            guestInfo,
            fromAccount,
            toAccount: pick(this.props.collective, ['id']),
            customData: stepDetails.customData,
            paymentMethod: await this.getPaymentMethod(),
            platformContributionAmount: getGQLV2AmountInput(stepDetails.platformContribution, undefined),
            tier: this.props.tier && { legacyId: this.props.tier.legacyId },
            context: { isEmbed: this.props.isEmbed || false },
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
      this.showError(getErrorFromGraphqlException(e));
    }
  };

  handleOrderResponse = async ({ order, stripeError, guestToken }, email) => {
    if (guestToken && order) {
      setGuestToken(email, order.id, guestToken);
    }

    if (stripeError) {
      return this.handleStripeError(order, stripeError, email, guestToken);
    } else {
      return this.handleSuccess(order);
    }
  };

  handleStripeError = async (order, stripeError, email, guestToken) => {
    const { message, account, response } = stripeError;
    if (!response) {
      this.setState({ isSubmitting: false, error: message });
    } else if (response.paymentIntent) {
      const stripe = await getStripe(null, account);
      const result = await stripe.handleCardAction(response.paymentIntent.client_secret);
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
    this.setState({ isSubmitted: true });
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
      if (isAllowedRedirect(url.host)) {
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
    const { stepPayment, stripe } = this.state;
    if (!stepPayment?.paymentMethod) {
      return null;
    } else if (stepPayment.paymentMethod.id) {
      return pick(stepPayment.paymentMethod, ['id']);
    } else if (stepPayment.key === NEW_CREDIT_CARD_KEY) {
      const { token } = await stripe.createToken();
      const pm = stripeTokenToPaymentMethod(token);
      return {
        name: pm.name,
        isSavedForLater: stepPayment.paymentMethod.isSavedForLater,
        creditCardInfo: { token: pm.token, ...pm.data },
      };
    } else if (stepPayment.paymentMethod.type === GQLV2_PAYMENT_METHOD_TYPES.PAYPAL) {
      return pick(stepPayment.paymentMethod, ['type', 'paypalInfo.token', 'paypalInfo.data']);
    } else if (stepPayment.paymentMethod.type === GQLV2_PAYMENT_METHOD_TYPES.BANK_TRANSFER) {
      return pick(stepPayment.paymentMethod, ['type']);
    }
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
    const { stepProfile, stepDetails } = this.state;

    if (!this.checkFormValidity()) {
      return false;
    }

    // Can only ignore validation if going back
    if (!stepProfile) {
      return action === 'prev';
    } else if (stepProfile.isGuest) {
      return validateGuestProfile(stepProfile, stepDetails);
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
    this.pushStepRoute(step.name);
  };

  /** Navigate to another step, ensuring all route params are preserved */
  pushStepRoute = async (stepName, queryParams = {}) => {
    const { collective, tier, isEmbed } = this.props;
    const verb = this.props.verb || 'donate';
    const step = stepName === 'details' ? '' : stepName;
    const allQueryParams = {
      interval: this.props.fixedInterval,
      ...pick(this.props, [
        'interval',
        'description',
        'redirect',
        'contributeAs',
        'defaultEmail',
        'defaultName',
        'useTheme',
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
    if (!this.props.collective.platformContributionAvailable || !this.props.host.plan.platformTips) {
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
    const { intl, fixedInterval, fixedAmount, collective, host, tier, LoggedInUser } = this.props;
    const { stepDetails, stepProfile, stepPayment, stepSummary } = this.state;
    const isFixedContribution = this.isFixedContribution(tier, fixedAmount, fixedInterval);
    const minAmount = this.getTierMinAmount(tier);
    const noPaymentRequired = minAmount === 0 && (isFixedContribution || stepDetails?.amount === 0);
    const isStepProfileCompleted = Boolean((stepProfile && LoggedInUser) || stepProfile?.isGuest);

    const steps = [
      {
        name: 'details',
        label: intl.formatMessage(STEP_LABELS.details),
        isCompleted: Boolean(stepDetails),
        validate: () => {
          if (!this.checkFormValidity() || !stepDetails || stepDetails.amount < minAmount || !stepDetails.quantity) {
            return false;
          } else {
            return isNil(tier?.availableQuantity) || stepDetails.quantity <= tier.availableQuantity;
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
    if (!noPaymentRequired) {
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

    return steps;
  }

  getPaypalButtonProps({ currency }) {
    const { stepPayment, stepDetails, stepSummary } = this.state;
    if (stepPayment?.paymentMethod?.type === GQLV2_PAYMENT_METHOD_TYPES.PAYPAL) {
      const { host } = this.props;
      return {
        host: host,
        currency: currency,
        style: { size: 'responsive', height: 47 },
        totalAmount: getTotalAmount(stepDetails, stepSummary),
        onClick: () => this.setState({ isSubmitting: true }),
        onCancel: () => this.setState({ isSubmitting: false }),
        onError: e => this.setState({ isSubmitting: false, error: `PayPal error: ${e.message}` }),
        onAuthorize: pm => {
          this.setState(
            state => ({
              stepPayment: {
                ...state.stepPayment,
                paymentMethod: {
                  type: GQLV2_PAYMENT_METHOD_TYPES.PAYPAL,
                  paypalInfo: pm,
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

  render() {
    const { collective, host, tier, LoggedInUser, loadingLoggedInUser, skipStepDetails, isEmbed } = this.props;
    const { error, isSubmitted, isSubmitting, stepDetails, stepSummary, stepProfile, stepPayment } = this.state;

    const currency = tier?.amount.currency || collective.currency;

    return (
      <Steps
        steps={this.getSteps()}
        currentStepName={this.props.step}
        onStepChange={this.onStepChange}
        onComplete={this.submitOrder}
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
            <Box px={[2, 3]} mb={4}>
              <ContributionFlowHeader collective={collective} />
            </Box>
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
                loading={isValidating || isSubmitted || isSubmitting}
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
                  {error && (
                    <MessageBox type="error" withIcon mb={3}>
                      {formatErrorMessage(this.props.intl, error)}
                    </MessageBox>
                  )}

                  <ContributionFlowStepContainer
                    collective={collective}
                    tier={tier}
                    mainState={this.state}
                    onChange={data => this.setState(data)}
                    step={currentStep}
                    showFeesOnTop={this.canHaveFeesOnTop()}
                    onNewCardFormReady={({ stripe }) => this.setState({ stripe })}
                    defaultProfileSlug={this.props.contributeAs}
                    defaultEmail={this.props.defaultEmail}
                    defaultName={this.props.defaultName}
                    taxes={this.getApplicableTaxes(collective, host, tier?.type)}
                    onSignInClick={() => this.setState({ showSignIn: true })}
                    isEmbed={isEmbed}
                  />

                  <Box mt={40}>
                    <ContributionFlowButtons
                      goNext={goNext}
                      goBack={goBack}
                      step={currentStep}
                      prevStep={prevStep}
                      nextStep={nextStep}
                      isValidating={isValidating || isSubmitted || isSubmitting}
                      paypalButtonProps={this.getPaypalButtonProps({ currency })}
                      totalAmount={getTotalAmount(stepDetails, stepSummary)}
                      currency={currency}
                    />
                  </Box>
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
                      />
                    </Box>
                    <ContributeFAQ collective={collective} mt={4} titleProps={{ mb: 2 }} />
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
