import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { debounce, get, pick, isNil } from 'lodash';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';
import { isURL } from 'validator';
import moment from 'moment';
import uuid from 'uuid/v4';
import * as LibTaxes from '@opencollective/taxes';

import { Router } from '../server/pages';
import { stripeTokenToPaymentMethod } from '../lib/stripe';
import { formatCurrency, getEnvVar, parseToBoolean } from '../lib/utils';
import { getPaypal } from '../lib/paypal';
import { getRecaptcha, getRecaptchaSiteKey, unloadRecaptcha } from '../lib/recaptcha';

import { H2, H5, P, Span } from '../components/Text';
import Logo from '../components/Logo';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Link from '../components/Link';
import ContributeAs from '../components/ContributeAs';
import ContributeAsFAQ from '../components/faqs/ContributeAsFAQ';
import StyledInputField from '../components/StyledInputField';
import { withStripeLoader } from '../components/StripeProvider';
import { withUser } from '../components/UserProvider';
import ContributePayment from '../components/ContributePayment';
import ContributeDetails from '../components/ContributeDetails';
import Loading from '../components/Loading';
import StyledButton from '../components/StyledButton';
import PayWithPaypalButton from '../components/PayWithPaypalButton';
import ContributeDetailsFAQ from '../components/faqs/ContributeDetailsFAQ';
import Container from '../components/Container';
import { fadeIn } from '../components/StyledKeyframes';
import MessageBox from '../components/MessageBox';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import ContributionBreakdown from '../components/ContributionBreakdown';
import Steps from '../components/Steps';
import ContributionFlowStepsProgress from '../components/ContributionFlowStepsProgress';
import EventDetails from '../components/EventDetails';

import { addCreateCollectiveMutation } from '../graphql/mutations';

// Styles for the previous, next and submit buttons
const PrevNextButton = styled(StyledButton)`
  animation: ${fadeIn} 0.3s;
`;

PrevNextButton.defaultProps = {
  buttonSize: 'large',
  fontWeight: 'bold',
  minWidth: '255px',
  m: 2,
};

// Styles for Paypal button
const PaypalButtonContainer = styled(Box)`
  animation: ${fadeIn} 0.3s;
`;
PaypalButtonContainer.defaultProps = {
  width: PrevNextButton.defaultProps.minWidth,
  m: PrevNextButton.defaultProps.m,
};

const recaptchaEnabled = parseToBoolean(getEnvVar('RECAPTCHA_ENABLED'));

/**
 * Main contribution flow entrypoint. Render all the steps from contributeAs
 * to payment.
 */
class CreateOrderPage extends React.Component {
  static getInitialProps({ query }) {
    // Whitelist interval
    if (['monthly', 'yearly'].includes(query.interval)) {
      query.interval = query.interval.replace('ly', '');
    } else if (!['month', 'year'].includes(query.interval)) {
      query.interval = null;
    }

    if (query.data) {
      try {
        query.data = JSON.parse(query.data);
      } catch (err) {
        console.error(err);
      }
    }

    return {
      collectiveSlug: query.collectiveSlug,
      eventSlug: query.eventSlug,
      slug: query.eventSlug || query.collectiveSlug,
      amount: parseInt(query.amount) * 100 || parseInt(query.totalAmount) || null,
      step: query.step || 'contributeAs',
      tierId: parseInt(query.tierId) || null,
      tierSlug: query.tierSlug,
      quantity: parseInt(query.quantity) || 1,
      description: query.description,
      interval: query.interval,
      verb: query.verb,
      redeem: query.redeem,
      redirect: query.redirect,
      referral: query.referral,
      customData: query.data,
    };
  }

  static propTypes = {
    slug: PropTypes.string, // for addData
    collectiveSlug: PropTypes.string, // for addData
    eventSlug: PropTypes.string, // for addData
    tierSlug: PropTypes.string,
    tierId: PropTypes.number,
    quantity: PropTypes.number,
    amount: PropTypes.number,
    interval: PropTypes.string,
    description: PropTypes.string,
    verb: PropTypes.string,
    step: PropTypes.string,
    customData: PropTypes.object,
    redirect: PropTypes.string,
    referral: PropTypes.string,
    redeem: PropTypes.bool,
    createOrder: PropTypes.func.isRequired, // from addCreateOrderMutation
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from injectIntl
    loadStripe: PropTypes.func.isRequired, // from withStripeLoader
    LoggedInUser: PropTypes.object, // from withUser
    loadingLoggedInUser: PropTypes.bool, // from withUser
    createCollective: PropTypes.func,
    refetchLoggedInUser: PropTypes.func,
  };

  static errorRecaptchaConnect = "Can't connect to ReCaptcha. Try to reload the page, or disable your Ad Blocker.";

  constructor(props) {
    super(props);
    this.recaptcha = null;
    this.recaptchaToken = null;
    this.activeFormRef = React.createRef();
    this.state = {
      loading: false,
      submitting: false,
      submitted: false,
      stepProfile: this.getLoggedInUserDefaultContibuteProfile(),
      stepDetails: null,
      stepPayment: null,
      stepSummary: null,
      error: null,
      stripe: null,
      customData: {},
    };
  }

  async componentDidMount() {
    this.loadInitialData();
    // Load payment providers scripts in the background
    this.props.loadStripe();
    if (this.hasPaypal()) {
      getPaypal();
    }

    if (recaptchaEnabled) {
      try {
        this.recaptcha = await getRecaptcha();
      } catch {
        this.setState({ error: CreateOrderPage.errorRecaptchaConnect });
      }
    }
  }

  componentDidUpdate(prevProps) {
    // Set user as default profile when loggin in
    if (!prevProps.LoggedInUser && this.props.LoggedInUser && !this.state.stepProfile) {
      this.setState({ stepProfile: this.getLoggedInUserDefaultContibuteProfile() });
    }

    // Collective was loaded
    if (prevProps.data.Collective !== this.props.data.Collective) {
      this.loadInitialData();
      if (this.hasPaypal()) {
        getPaypal();
      }
    }
  }

  componentWillUnmount() {
    if (recaptchaEnabled) {
      unloadRecaptcha();
    }
  }

  loadInitialData() {
    this.setState(state => ({
      ...state,
      stepProfile: state.stepProfile || this.getLoggedInUserDefaultContibuteProfile(),
      stepDetails: get(state.stepDetails, 'totalAmount')
        ? state.stepDetails
        : this.getDefaultStepDetails(this.props.data.Tier),
      customData: this.props.customData,
    }));
  }

  /** Steps component callback  */
  onStepChange = async step => {
    this.pushStepRoute(step.name);
  };

  /** Navigate to another step, ensuring all route params are preserved */
  pushStepRoute = async (stepName, routeParams = {}) => {
    const {
      collectiveSlug,
      data: { Tier },
    } = this.props;

    let route = 'orderCollectiveNew';
    let verb = this.props.verb || 'donate';
    if (Tier) {
      if (Tier.type === 'TICKET') {
        route = 'orderEventTier';
      } else {
        route = 'orderCollectiveTierNew';
        verb = 'contribute'; // Enforce "contribute" verb for ordering tiers
      }
    }

    const params = {
      collectiveSlug,
      verb,
      step: stepName === 'contributeAs' ? undefined : stepName,
      ...pick(this.props, ['tierId', 'tierSlug', 'amount', 'interval', 'description', 'redirect', 'eventSlug']),
      ...routeParams,
    };

    // Reset errors if any
    if (this.state.error) {
      this.setState({ error: null });
    }

    // Navigate to the new route
    await Router.pushRoute(stepName === 'success' ? `${route}Success` : route, params);
    window.scrollTo(0, 0);
  };

  fetchRecaptchaToken = () => {
    if (this.recaptchaToken) {
      return Promise.resolve(this.recaptchaToken);
    }

    return new Promise(resolve =>
      this.recaptcha.ready(() =>
        this.recaptcha.execute(getRecaptchaSiteKey(), { action: 'OrderForm' }).then(recaptchaToken => {
          this.recaptchaToken = recaptchaToken;
          resolve(recaptchaToken);
        }),
      ),
    );
  };

  /** Validate step payment, loading data from stripe for new credit cards */
  validateStepPayment = async action => {
    const { stepPayment } = this.state;
    const isFixedPriceTier = this.isFixedPriceTier();

    if (action === 'prev') {
      // Don't validate when going back
      return true;
    } else if (this.getOrderMinAmount() === 0 && (isFixedPriceTier || !stepPayment)) {
      // Always ignore payment method for free tiers
      return true;
    } else if (!stepPayment) {
      this.setState({ error: 'Please set a payment method' });
      return false;
    } else if (!stepPayment.isNew) {
      // No need to validate existing payment methods
      return true;
    } else if (!stepPayment.data && get(stepPayment, 'paymentMethod.token')) {
      // New credit card - if no data, stripe token has already been exchanged
      return true;
    } else {
      // New credit card - load info from stripe
      if (!this.state.stripe) {
        this.setState({
          error: 'There was a problem initializing the payment form. Please reload the page and try again',
        });
        return false;
      }
      const { token, error } = await this.state.stripe.createToken();
      if (error) {
        this.setState({ error: error.message });
        return false;
      }
      this.setState(state => ({
        ...state,
        stepPayment: {
          ...state.stepPayment,
          data: null,
          key: `newCreditCard-${uuid()}`,
          paymentMethod: { ...stripeTokenToPaymentMethod(token), save: this.state.stepPayment.save },
        },
      }));
    }

    return true;
  };

  /** Validate step profile, create new org if necessary */
  validateStepProfile = async () => {
    if (!this.state.stepProfile || !this.activeFormRef.current || !this.activeFormRef.current.reportValidity()) {
      return false;
    }

    // Check if we're creating a new organization
    if (!this.state.stepProfile.id) {
      this.setState({ submitting: true });

      try {
        const { data: result } = await this.props.createCollective(this.state.stepProfile);
        const createdOrg = result.createCollective;

        await this.props.refetchLoggedInUser();
        this.setState({ stepProfile: createdOrg, submitting: false });
      } catch (error) {
        this.setState({ error: error.message, submitting: false });
        window.scrollTo(0, 0);
        return false;
      }
    }

    return true;
  };

  submitOrder = async (paymentMethodOverride = null) => {
    this.setState({ submitting: true, error: null });
    const { stepProfile, stepDetails, stepPayment, stepSummary, customData } = this.state;

    // Prepare payment method
    let paymentMethod = paymentMethodOverride;
    if (!paymentMethod && stepPayment) {
      paymentMethod = stepPayment.paymentMethod;
      if (!stepPayment.isNew) {
        paymentMethod = pick(paymentMethod, ['service', 'type', 'uuid']);
      }
    }

    // Load recaptcha token
    let recaptchaToken;
    if (recaptchaEnabled) {
      recaptchaToken = await this.fetchRecaptchaToken();
      if (!recaptchaToken) {
        this.setState({ error: CreateOrderPage.errorRecaptchaConnect });
      }
    }

    const tier = this.props.data.Tier;
    const order = {
      paymentMethod,
      recaptchaToken,
      totalAmount: this.getTotalAmountWithTaxes(),
      taxAmount: get(stepSummary, 'amount', 0),
      countryISO: get(stepSummary, 'countryISO'),
      taxIDNumber: get(stepSummary, 'number'),
      quantity: get(stepDetails, 'quantity', 1),
      currency: this.getCurrency(),
      interval: stepDetails.interval,
      referral: this.props.referral,
      fromCollective: pick(stepProfile, ['id', 'type', 'name']),
      collective: pick(this.props.data.Collective, ['id']),
      tier: tier ? pick(tier, ['id', 'amount']) : undefined,
      description: decodeURIComponent(this.props.description || ''),
      customData,
    };

    try {
      const res = await this.props.createOrder(order);
      const orderCreated = res.data.createOrder;
      this.setState({ submitting: false, submitted: true, error: null });
      this.props.refetchLoggedInUser();
      if (this.props.redirect && isURL(this.props.redirect)) {
        const transactionId = get(orderCreated, 'transactions[0].id', null);
        const status = orderCreated.status;
        const redirectTo = `${this.props.redirect}?transactionid=${transactionId}&status=${status}`;
        window.location.href = redirectTo;
      } else {
        this.pushStepRoute('success', { OrderId: orderCreated.id });
      }
    } catch (e) {
      this.setState({ submitting: false, error: e.message });
    }
  };

  getLoggedInUserDefaultContibuteProfile() {
    if (get(this.state, 'stepProfile')) {
      return this.state.stepProfile;
    }

    const { LoggedInUser } = this.props;
    return !LoggedInUser ? null : { email: LoggedInUser.email, image: LoggedInUser.image, ...LoggedInUser.collective };
  }

  getLoggedInUserDefaultPaymentMethodId() {
    const pm = get(this.props.LoggedInUser, 'collective.paymentMethods', [])[0];
    return pm && pm.id;
  }

  /** Returns an array like [personnalProfile, otherProfiles] */
  getProfiles() {
    const { LoggedInUser, data } = this.props;
    return !LoggedInUser
      ? [{}, {}]
      : [
          { email: LoggedInUser.email, image: LoggedInUser.image, ...LoggedInUser.collective },
          LoggedInUser.memberOf
            .filter(m => m.role === 'ADMIN' && m.collective.id !== data.Collective.id && m.collective.type !== 'EVENT')
            .map(({ collective }) => collective),
        ];
  }

  /** Guess the country, from the more pricise method (settings) to the less */
  getContributingProfileCountry() {
    return (
      get(this.state.stepSummary, 'countryISO') ||
      get(this.state.stepProfile, 'location.country') ||
      get(this.props.LoggedInUser, 'collective.location.country')
    );
  }

  /** Returns tier presets, defaults presets, or null if using a tier with fixed amount */
  getAmountsPresets() {
    const tier = this.props.data.Tier || {};
    return tier.presets || (isNil(tier.amount) ? [500, 1000, 2000, 5000] : null);
  }

  /** Get the min authorized amount for order, in cents */
  getOrderMinAmount() {
    const tier = this.props.data.Tier;

    // When making a donation, min amount is $1
    if (!tier) {
      return 100;
    }

    // If the tier has not amount and no preset, it's a free tier
    if (isNil(tier.amount) && isNil(tier.presets)) {
      return 0;
    }

    return tier.minimumAmount;
  }

  getDefaultAmount() {
    const { Tier } = this.props.data;
    const stateAmount = get(this.state.stepDetails, 'totalAmount');

    if (!isNil(stateAmount)) {
      return stateAmount;
    } else if (Tier && !isNil(Tier.amount)) {
      return Tier.amount;
    } else if (!isNil(this.props.amount)) {
      return this.props.amount;
    } else if (this.getOrderMinAmount() === 0) {
      // Free tiers are free per default, even when user can make a donation
      return 0;
    }

    const presets = this.getAmountsPresets();
    return presets && presets.length > 0 ? presets[Math.floor(presets.length / 2)] : 500;
  }

  /** Get default total amount, or undefined if we don't have any info on this */
  getDefaultStepDetails(tier) {
    const { stepDetails } = this.state;
    const amount = this.getDefaultAmount();
    const quantity = get(stepDetails, 'quantity') || this.props.quantity || 1;
    const interval = get(stepDetails, 'interval') || get(tier, 'interval') || this.props.interval;

    return {
      amount,
      quantity,
      interval,
      totalAmount: amount * quantity,
    };
  }

  /** Get total amount based on stepDetails with taxes from step summary applied */
  getTotalAmountWithTaxes() {
    const quantity = get(this.state, 'stepDetails.quantity', 1);
    const amount = get(this.state, 'stepDetails.amount', 0);
    const taxAmount = get(this.state, 'stepSummary.amount', 0);
    return quantity * amount + taxAmount;
  }

  /** Returns true if the price and interval of the current tier cannot be changed */
  isFixedPriceTier() {
    const tier = this.props.data.Tier;
    const forceInterval = Boolean(tier) || Boolean(this.props.interval);
    const forceAmount = !get(tier, 'presets') && !isNil(get(tier, 'amount') || this.props.amount);
    return forceInterval && forceAmount;
  }

  /** Return the tax applicable to the order or null */
  getTax() {
    const tier = this.props.data.Tier;
    return tier && get(this.props.data.Collective, `host.taxes.${tier.type}`);
  }

  /** Returns true if taxes may apply with this tier/host */
  taxesMayApply() {
    const { Tier, Collective } = this.props.data;

    if (!Tier) {
      return false;
    }

    const hostCountry = get(Collective, 'host.location.country');
    const country = LibTaxes.getVatOriginCountry(Tier.type, hostCountry, Collective.location.country);
    return LibTaxes.vatMayApply(Tier.type, country);
  }

  /** Returns the steps list */
  getSteps() {
    const { stepDetails, stepPayment, stepSummary } = this.state;
    const tier = this.props.data.Tier;
    const isFixedPriceTier = this.isFixedPriceTier();
    const minAmount = this.getOrderMinAmount();
    const noPaymentRequired = minAmount === 0 && get(stepDetails, 'amount') === 0;

    const steps = [
      {
        name: 'contributeAs',
        isCompleted: Boolean(this.state.stepProfile),
        validate: this.validateStepProfile,
      },
    ];

    // If amount and interval are forced by a tier or by params, skip StepDetails (except for events)
    if (!isFixedPriceTier || (tier && tier.type === 'TICKET')) {
      steps.push({
        name: 'details',
        isCompleted: Boolean(stepDetails && stepDetails.totalAmount >= minAmount),
        validate: () => {
          return stepDetails && this.activeFormRef.current && this.activeFormRef.current.reportValidity();
        },
      });
    }

    // Hide step payment if using a free tier with fixed price
    if (!(minAmount === 0 && isFixedPriceTier)) {
      steps.push({
        name: 'payment',
        isCompleted: Boolean(noPaymentRequired || stepPayment),
        validate: this.validateStepPayment,
      });
    }

    // Show the summary step only if the order has tax
    if (this.taxesMayApply()) {
      steps.push({
        name: 'summary',
        isCompleted: noPaymentRequired || get(stepSummary, 'isReady', false),
      });
    }

    return steps;
  }

  /** Get currency from the current tier, or fallback on collective currency */
  getCurrency() {
    return get(this.props.data.Tier, 'currency', this.props.data.Collective.currency);
  }

  /** Returns manual payment method if supported by the host, null otherwise */
  getManualPaymentMethod() {
    const pm = get(this.props.data, 'Collective.host.settings.paymentMethods.manual');
    if (!pm || get(this.state, 'stepDetails.interval')) {
      return null;
    }

    return {
      ...pm,
      instructions: this.props.intl.formatMessage(
        {
          id: 'host.paymentMethod.manual.instructions',
          defaultMessage:
            'Instructions to make the payment of {amount} will be sent to your email address {email}. Your order will be pending until the funds have been received by the host ({host}).',
        },
        {
          amount: formatCurrency(get(this.state, 'stepDetails.totalAmount'), this.getCurrency()),
          email: get(this.props, 'LoggedInUser.email', ''),
          collective: get(this.props, 'loggedInUser.collective.slug', ''),
          host: get(this.props.data, 'Collective.host.name'),
          TierId: get(this.props.data.Tier, 'id'),
        },
      ),
    };
  }

  // Debounce state update functions that may be called successively
  updateProfile = debounce(stepProfile => this.setState({ stepProfile, stepPayment: null }), 300);
  updateDetails = stepDetails => this.setState({ stepDetails });

  handleCustomFieldsChange = (name, value) => {
    const { customData } = this.state;

    this.setState({
      customData: {
        ...customData,
        [name]: value,
      },
    });
  };

  /* We only support paypal for one time donations to the open source collective for now. */
  hasPaypal() {
    return get(this.props.data, 'Collective.host.id') === 11004 && !get(this.state, 'stepDetails.interval');
  }

  /* We might have problems with postal code and this should be disablable */
  shouldHideCreditCardPostalCode() {
    return get(this.state, 'stepProfile.settings.hideCreditCardPostalCode', false);
  }

  getCollectiveLinkParams(collectiveSlug, eventSlug) {
    return eventSlug
      ? { route: 'event', params: { parentCollectiveSlug: collectiveSlug, eventSlug } }
      : { route: 'collective', params: { slug: collectiveSlug } };
  }

  /**
   * When using an order with fixed amount, this function returns the details to
   * show the user order amount as step details is skipped.
   */
  renderTierDetails(tier) {
    const amount = get(this.state.stepDetails, 'totalAmount');
    const interval = get(this.state.stepDetails, 'interval');
    const tax = this.state.stepSummary;

    return (
      <Container mt={4} mx={2} width={1 / 5} minWidth="300px" maxWidth="370px">
        <Container fontSize="Paragraph" mb={3}>
          <P fontSize="LeadParagraph" fontWeight="bold" mb={2}>
            <FormattedMessage id="contribute.tierDetailsTitle" defaultMessage="Tier details:" />
          </P>
          <FormattedMessage
            id="contribute.tierDetails"
            defaultMessage="You’ll contribute with the amount of {amount}{interval, select, month {monthly.} year {yearly.} other {.}}"
            values={{
              amount: (
                <strong>
                  {formatCurrency(amount, get(tier, 'currency', this.props.data.Collective.currency))}
                  {tax && tax.amount > 0 && (
                    /** Use non-breaking spaces to ensure amount and tax stay on the same line */
                    <span>&nbsp;+&nbsp;VAT&nbsp;({tax.percentage}%)</span>
                  )}
                  {interval ? ' ' : ''}
                </strong>
              ),
              interval: get(tier, 'interval') || this.props.interval,
            }}
          />
          {interval && (
            <React.Fragment>
              <br />
              <br />
              <strong>
                <FormattedMessage id="contribution.subscription.first.label" defaultMessage="First charge:" />
              </strong>{' '}
              <Span color="primary.500">
                <FormattedMessage id="contribution.subscription.today" defaultMessage="Today" />
              </Span>
              <br />
              <strong>
                <FormattedMessage id="contribution.subscription.next.label" defaultMessage="Next charge:" />
              </strong>{' '}
              <Span color="primary.500">
                {moment()
                  .add(1, interval)
                  .date(1)
                  .format('MMM D, YYYY')}
              </Span>
            </React.Fragment>
          )}
        </Container>
      </Container>
    );
  }

  renderStep(step) {
    const { data } = this.props;
    const { stepDetails, stepPayment, customData } = this.state;
    const [personal, profiles] = this.getProfiles();
    const tier = this.props.data.Tier;
    const customFields = tier && tier.customFields ? tier.customFields : [];
    const defaultStepDetails = this.getDefaultStepDetails(tier);
    const interval = get(stepDetails, 'interval') || defaultStepDetails.interval;

    if (step.name === 'contributeAs') {
      return (
        <Flex justifyContent="center" width={1}>
          <Box width={[0, null, null, '24em']} />
          <Container>
            <StyledInputField
              htmlFor="contributeAs"
              label={
                <H5 textAlign="left" mb={3}>
                  <FormattedMessage id="contribute.profile.label" defaultMessage="Contribute As:" />
                </H5>
              }
            >
              {fieldProps => (
                <Container as="form" onSubmit={e => e.preventDefault()} ref={this.activeFormRef}>
                  <ContributeAs
                    {...fieldProps}
                    onProfileChange={this.updateProfile}
                    profiles={profiles}
                    personal={personal}
                    defaultSelectedProfile={this.getLoggedInUserDefaultContibuteProfile()}
                  />
                </Container>
              )}
            </StyledInputField>
          </Container>
          <ContributeAsFAQ mt={4} ml={4} display={['none', null, 'block']} width={1 / 5} minWidth="335px" />
        </Flex>
      );
    } else if (step.name === 'details') {
      return (
        <Flex justifyContent="center" width={1}>
          <Box width={[0, null, null, 1 / 5]} />
          <Container
            as="form"
            onSubmit={e => e.preventDefault()}
            ref={this.activeFormRef}
            mx={5}
            width={[0.95, null, 3 / 5]}
            maxWidth="465px"
          >
            <H5 textAlign="left" mb={3}>
              <FormattedMessage id="contribute.details.label" defaultMessage="Contribution Details:" />
            </H5>
            <ContributeDetails
              amountOptions={this.props.amount ? null : this.getAmountsPresets()}
              currency={this.getCurrency()}
              onChange={this.updateDetails}
              interval={interval}
              amount={get(stepDetails, 'amount') || defaultStepDetails.amount}
              quantity={get(stepDetails, 'quantity') || defaultStepDetails.quantity}
              disabledInterval={Boolean(tier) || Boolean(this.props.interval)}
              disabledAmount={!get(tier, 'presets') && !isNil(get(tier, 'amount') || this.props.amount)}
              minAmount={this.getOrderMinAmount()}
              maxQuantity={get(tier, 'stats.availableQuantity') || get(tier, 'maxQuantity')}
              showQuantity={tier && tier.type === 'TICKET'}
              showInterval={tier && tier.type !== 'TICKET'}
              customFields={customFields}
              customData={customData}
              onCustomFieldsChange={this.handleCustomFieldsChange}
            />
            {tier && tier.type === 'TICKET' && <EventDetails event={data.Collective} tier={tier} />}
          </Container>
          {interval ? (
            <ContributeDetailsFAQ hasInterval mt={4} display={['none', null, 'block']} width={1 / 5} minWidth="335px" />
          ) : (
            <Box width={[0, null, null, 1 / 5]} />
          )}
        </Flex>
      );
    } else if (step.name === 'payment') {
      return get(stepDetails, 'totalAmount') === 0 ? (
        <MessageBox type="success" withIcon>
          {tier.type === 'TICKET' ? (
            <FormattedMessage
              id="contribute.freeTicket"
              defaultMessage="This is a free ticket, you can submit your order directly."
            />
          ) : (
            <FormattedMessage
              id="contribute.freeTier"
              defaultMessage="This is a free tier, you can submit your order directly."
            />
          )}
        </MessageBox>
      ) : (
        <Flex
          flexDirection={['column', null, 'row']}
          alignItems={['center', null, 'flex-start']}
          justifyContent="center"
          width={1}
        >
          <Box width={[0, null, null, 1 / 5]} />
          <Flex flexDirection="column" width={[1, null, 3 / 5]} mx={[1, 3, 5]} css={{ maxWidth: 480 }}>
            <H5 textAlign="left" mb={3}>
              <FormattedMessage id="contribute.payment.label" defaultMessage="Choose a payment method:" />
            </H5>
            <ContributePayment
              onChange={stepPayment => this.setState({ stepPayment })}
              collective={this.state.stepProfile}
              defaultValue={stepPayment}
              onNewCardFormReady={({ stripe }) => this.setState({ stripe })}
              withPaypal={this.hasPaypal()}
              manual={this.getManualPaymentMethod()}
              hideCreditCardPostalCode={this.shouldHideCreditCardPostalCode()}
              margins="0 auto"
              disabled={this.state.submitting || this.state.submitted}
            />
          </Flex>
          {this.isFixedPriceTier() ? this.renderTierDetails(tier) : <Box width={[0, null, null, 1 / 5]} />}
        </Flex>
      );
    } else if (step.name === 'summary') {
      return (
        <Flex
          flexDirection={['column', null, 'row']}
          alignItems={['center', null, 'flex-start']}
          justifyContent="center"
          width={1}
        >
          <Container width={[0, null, null, 1 / 5]} />
          <Container width={[1, null, 3 / 5]} mx={[1, 3, 5]} maxWidth={480}>
            <H5 textAlign="left" mb={3}>
              <FormattedMessage id="contribute.summary.breakdown" defaultMessage="Contribution breakdown:" />
            </H5>
            <ContributionBreakdown
              amount={get(stepDetails, 'totalAmount')}
              quantity={get(stepDetails, 'quantity')}
              currency={this.getCurrency()}
              hostFeePercent={get(data, 'Collective.hostFeePercent')}
              paymentMethod={get(stepPayment, 'paymentMethod')}
              userTaxInfo={this.state.stepSummary || { countryISO: this.getContributingProfileCountry() }}
              onChange={stepSummary => this.setState({ stepSummary })}
              showFees={false}
              tierType={get(tier, 'type')}
              hostCountry={get(data.Collective, 'host.location.country')}
              collectiveCountry={get(data.Collective, 'location.country')}
              applyTaxes
            />
          </Container>
          {this.renderTierDetails(tier)}
        </Flex>
      );
    }

    return null;
  }

  renderContent(step, goNext, goBack, isValidating) {
    const { LoggedInUser } = this.props;

    if (!LoggedInUser) {
      return <SignInOrJoinFree />;
    }

    const isPaypal = get(this.state, 'stepPayment.paymentMethod.service') === 'paypal';
    const canGoPrev = !this.state.submitting && !this.state.submitted && !isValidating;
    return (
      <Flex flexDirection="column" alignItems="center" mx={3} width={0.95}>
        {this.renderStep(step)}
        <Flex mt={[4, null, 5]} justifyContent="center" flexWrap="wrap">
          {goBack && (
            <PrevNextButton buttonStyle="standard" disabled={!canGoPrev} onClick={goBack}>
              &larr; <FormattedMessage id="contribute.prevStep" defaultMessage="Previous step" />
            </PrevNextButton>
          )}
          {isPaypal && step.isLastStep ? (
            <PaypalButtonContainer>
              <PayWithPaypalButton
                totalAmount={this.getTotalAmountWithTaxes()}
                currency={this.getCurrency()}
                style={{ size: 'responsive', height: 55 }}
                onClick={() => this.setState({ submitting: true })}
                onAuthorize={pm => this.submitOrder(pm)}
                onCancel={() => this.setState({ submitting: false })}
                onError={e => this.setState({ submitting: false, error: `PayPal error: ${e.message}` })}
              />
            </PaypalButtonContainer>
          ) : (
            <PrevNextButton
              buttonStyle="primary"
              onClick={goNext}
              disabled={!goNext}
              loading={this.state.submitting || this.state.submitted || isValidating}
            >
              {step.isLastStep ? (
                <FormattedMessage id="contribute.submit" defaultMessage="Make contribution" />
              ) : (
                <FormattedMessage id="contribute.nextStep" defaultMessage="Next step" />
              )}{' '}
              &rarr;
            </PrevNextButton>
          )}
        </Flex>
      </Flex>
    );
  }

  renderTierTitle(tier) {
    return tier.type === 'TICKET' ? (
      <FormattedMessage
        id="contribute.ticketType"
        defaultMessage="Order a '{name}' ticket"
        values={{ name: tier.name }}
      />
    ) : (
      <FormattedMessage
        id="contribute.contributorType"
        defaultMessage="Contribute to '{name}' tier"
        values={{ name: tier.name }}
      />
    );
  }

  render() {
    const { data, loadingLoggedInUser, LoggedInUser, collectiveSlug, eventSlug } = this.props;

    if (!data || !data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;
    const isLoadingContent = loadingLoggedInUser || data.loading;

    return (
      <Page
        description={collective.description}
        twitterHandle={collective.twitterHandle}
        image={collective.image || collective.backgroundImage}
        title={eventSlug ? `Order tickets - ${collective.name}` : `Contribute - ${collective.name}`}
      >
        <Flex alignItems="center" flexDirection="column" mx="auto" width={300} pt={4} mb={4}>
          <Link className="goBack" {...this.getCollectiveLinkParams(collectiveSlug, eventSlug)}>
            <Logo collective={collective} className="logo" height="10rem" style={{ margin: '0 auto' }} />
            <H2 as="h1" color="black.900" textAlign="center">
              {collective.name}
            </H2>
          </Link>

          {data.Tier && (
            <P fontSize="LeadParagraph" fontWeight="LeadParagraph" color="black.600" mt={3} textAlign="center">
              {this.renderTierTitle(data.Tier)}
            </P>
          )}
        </Flex>
        <Steps
          steps={this.getSteps()}
          currentStepName={this.props.step}
          onStepChange={this.onStepChange}
          onInvalidStep={this.onInvalidStep}
          onComplete={this.submitOrder}
        >
          {({ steps, currentStep, lastVisitedStep, goNext, goBack, goToStep, isValidating, isValidStep }) => (
            <Flex id="content" flexDirection="column" alignItems="center" mb={6} p={2}>
              {loadingLoggedInUser ||
                (LoggedInUser && (
                  <Box mb={[3, null, 4]} width={0.8} css={{ maxWidth: 365, minHeight: 95 }}>
                    <ContributionFlowStepsProgress
                      steps={steps}
                      currentStep={currentStep}
                      lastVisitedStep={lastVisitedStep}
                      goToStep={goToStep}
                      stepProfile={this.state.stepProfile}
                      stepDetails={this.state.stepDetails}
                      stepPayment={this.state.stepPayment}
                      submitted={this.state.submitted}
                      loading={this.props.loadingLoggedInUser || this.state.loading || this.state.submitting}
                      currency={this.getCurrency()}
                      isFreeTier={this.getOrderMinAmount() === 0}
                    />
                  </Box>
                ))}
              {this.state.error && (
                <MessageBox type="error" mb={3} mx={2} withIcon>
                  {this.state.error.replace('GraphQL error: ', '')}
                </MessageBox>
              )}
              {isLoadingContent || !isValidStep ? (
                <Loading />
              ) : (
                this.renderContent(currentStep, goNext, goBack, isValidating)
              )}
            </Flex>
          )}
        </Steps>
      </Page>
    );
  }
}

const collectiveFields = `
  id
  slug
  name
  description
  longDescription
  twitterHandle
  type
  website
  image
  backgroundImage
  currency
  hostFeePercent
  tags
  location {
    country
  }
  host {
    id
    name
    settings
    location {
      country
    }
  }
  parentCollective {
    image
  }
`;

/* eslint-disable graphql/template-strings, graphql/no-deprecated-fields, graphql/capitalized-type-name, graphql/named-operations */
const CollectiveDataQuery = gql`
  query Collective($slug: String!) {
    Collective(slug: $slug) {
      ${collectiveFields}
    }
  }
`;

const CollectiveWithTierDataQuery = gql`
  query CollectiveWithTier($slug: String!, $tierId: Int!) {
    Collective(slug: $slug) {
      ${collectiveFields}
    }
    Tier(id: $tierId) {
      id
      type
      name
      slug
      description
      amount
      minimumAmount
      currency
      interval
      presets
      customFields
      maxQuantity
      stats {
        availableQuantity
      }
    }
  }
`;

export const addCreateOrderMutation = graphql(
  gql`
    mutation createOrder($order: OrderInputType!) {
      createOrder(order: $order) {
        id
        status
        transactions {
          id
        }
      }
    }
  `,
  {
    props: ({ mutate }) => ({
      createOrder: order => mutate({ variables: { order } }),
    }),
  },
);

const addGraphQL = compose(
  graphql(CollectiveDataQuery, { skip: props => props.tierId }),
  graphql(CollectiveWithTierDataQuery, { skip: props => !props.tierId }),
  addCreateCollectiveMutation,
  addCreateOrderMutation,
);

export default injectIntl(addGraphQL(withUser(withStripeLoader(CreateOrderPage))));
