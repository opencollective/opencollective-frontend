import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { debounce, get, pick, isNil, min } from 'lodash';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';
import { isURL } from 'validator';
import moment from 'moment';
import uuid from 'uuid/v4';

import { Router } from '../server/pages';

import { H2, H5, P, Span } from '../components/Text';
import Logo from '../components/Logo';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Link from '../components/Link';
import ContributeAs from '../components/ContributeAs';
import StyledInputField from '../components/StyledInputField';

import { addCreateCollectiveMutation } from '../graphql/mutations';

import { stripeTokenToPaymentMethod } from '../lib/stripe';
import { formatCurrency } from '../lib/utils';
import { getPaypal } from '../lib/paypal';
import withIntl from '../lib/withIntl';
import { getRecaptcha, getRecaptchaSiteKey, unloadRecaptcha } from '../lib/recaptcha';
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

    return {
      slug: query.eventSlug || query.collectiveSlug,
      amount: parseInt(query.amount) || null,
      step: query.step || 'contributeAs',
      tierId: query.tierId,
      tierSlug: query.tierSlug,
      quantity: query.quantity,
      description: query.description,
      interval: query.interval,
      verb: query.verb,
      redeem: query.redeem,
      redirect: query.redirect,
      referral: query.referral,
    };
  }

  static propTypes = {
    slug: PropTypes.string, // for addData
    tierSlug: PropTypes.string,
    quantity: PropTypes.number,
    amount: PropTypes.number,
    interval: PropTypes.string,
    description: PropTypes.string,
    verb: PropTypes.string,
    step: PropTypes.string,
    redirect: PropTypes.string,
    referral: PropTypes.string,
    redeem: PropTypes.bool,
    createOrder: PropTypes.func.isRequired, // from addCreateOrderMutation
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from withIntl
    loadStripe: PropTypes.func.isRequired, // from withStripeLoader
    LoggedInUser: PropTypes.object, // from withUser
    loadingLoggedInUser: PropTypes.bool, // from withUser
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
    };
  }

  async componentDidMount() {
    this.loadInitialData();

    // Load payment providers scripts in the background
    this.props.loadStripe();
    if (this.hasPaypal()) {
      getPaypal();
    }

    try {
      this.recaptcha = await getRecaptcha();
    } catch {
      this.setState({ error: CreateOrderPage.errorRecaptchaConnect });
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
    unloadRecaptcha();
  }

  loadInitialData() {
    const tier = this.getTier();
    this.setState(state => ({
      ...state,
      stepProfile: state.stepProfile || this.getLoggedInUserDefaultContibuteProfile(),
      stepDetails: get(state.stepDetails, 'totalAmount')
        ? state.stepDetails
        : {
            totalAmount: this.getDefaultTotalAmount(),
            interval: get(state.stepDetails, 'interval') || get(tier, 'interval') || this.props.interval,
          },
    }));
  }

  /** Steps component callback  */
  onStepChange = async step => {
    this.pushStepRoute(step.name);
  };

  /** Navigate to another step, ensuring all route params are preserved */
  pushStepRoute = async (stepName, routeParams = {}) => {
    const { tierId, slug } = this.props;
    const route = tierId ? 'orderCollectiveTierNew' : 'orderCollectiveNew';
    const params = {
      collectiveSlug: slug,
      step: stepName === 'contributeAs' ? undefined : stepName,
      ...pick(this.props, ['verb', 'tierId', 'tierSlug', 'amount', 'interval', 'description', 'redirect']),
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
  validateStepPayment = async () => {
    const { stepPayment } = this.state;
    const isFixedPriceTier = this.isFixedPriceTier();
    const isFreeTier = this.isFreeTier();

    if (isFreeTier && isFixedPriceTier) {
      // Always ignore payment method for free tiers
      return true;
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
    const { stepDetails, stepPayment } = this.state;

    // Prepare payment method
    let paymentMethod = paymentMethodOverride;
    if (!paymentMethod && stepPayment) {
      paymentMethod = stepPayment.paymentMethod;
      if (!stepPayment.isNew) {
        paymentMethod = pick(paymentMethod, ['service', 'type', 'uuid']);
      }
    }

    // Load recaptcha token
    const recaptchaToken = await this.fetchRecaptchaToken();
    if (!recaptchaToken) {
      this.setState({ error: CreateOrderPage.errorRecaptchaConnect });
    }

    const tier = this.getTier();
    const order = {
      paymentMethod,
      recaptchaToken,
      totalAmount: this.getTotalAmount(),
      taxAmount: get(this.state, 'stepSummary.amount', 0),
      countryISO: get(this.state, 'stepSummary.countryISO'),
      taxIDNumber: get(this.state, 'stepSummary.number'),
      quantity: this.props.quantity || 1,
      currency: this.getCurrency(),
      interval: stepDetails.interval,
      referral: this.props.referral,
      fromCollective: pick(this.state.stepProfile, ['id', 'type', 'name']),
      collective: pick(this.props.data.Collective, ['id']),
      tier: tier ? pick(tier, ['id', 'amount']) : undefined,
      description: decodeURIComponent(this.props.description || ''),
    };

    try {
      const res = await this.props.createOrder(order);
      const orderCreated = res.data.createOrder;
      this.setState({ submitting: false, submitted: true, error: null });
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
      get(this.state.stepProfile, 'countryISO') ||
      get(this.props.LoggedInUser, 'collective.countryISO')
    );
  }

  /** Return the currently selected tier, or a falsy value if none selected */
  getTier() {
    const { data, tierId } = this.props;
    if (tierId) {
      return get(data, 'Collective.tiers', []).find(t => t.id == tierId);
    }
  }

  /** Returns tier presets, defaults presets, or null if using a tier with fixed amount */
  getAmountsPresets() {
    const tier = this.getTier() || {};
    return tier.presets || (isNil(tier.amount) ? [500, 1000, 2000, 5000] : null);
  }

  /** Get the min authorized amount for order, in cents */
  getOrderMinAmount() {
    const tier = this.getTier();

    // When making a donation, min amount is $1
    if (!tier) {
      return 100;
    }

    // If the tier has not amount and no preset, it's a free tier
    if (isNil(tier.amount) && isNil(tier.presets)) {
      return 0;
    }

    // Return the minimum amongs presets and amount
    return min(isNil(tier.amount) ? tier.presets : [...(tier.presets || []), tier.amount]);
  }

  /** Get default total amount, or undefined if we don't have any info on this */
  getDefaultTotalAmount() {
    const tier = this.getTier();
    const amountFromUrl = this.props.amount ? this.props.amount * 100 : undefined;
    return get(this.state.stepDetails, 'totalAmount') || get(tier, 'amount') || amountFromUrl;
  }

  /** Get total amount based on stepDetails with taxes from step summary applied */
  getTotalAmount() {
    const totalAmount = get(this.state, 'stepDetails.totalAmount', 0);
    const taxAmount = get(this.state, 'stepSummary.amount', 0);
    return totalAmount + taxAmount;
  }

  /** Teturn true if current order doesn't need any payment */
  isFreeTier() {
    return this.getOrderMinAmount() === 0;
  }

  /** Returns true if the price and interval of the current tier cannot be changed */
  isFixedPriceTier() {
    const tier = this.getTier();
    const forceInterval = Boolean(tier) || Boolean(this.props.interval);
    const forceAmount = !get(tier, 'presets') && !isNil(get(tier, 'amount') || this.props.amount);
    return forceInterval && forceAmount;
  }

  /** Returs the steps list */
  getSteps() {
    const tier = this.getTier();
    const isFixedPriceTier = this.isFixedPriceTier();
    const isFreeTier = this.isFreeTier();
    const tax = tier && get(this.props.data.Collective, `host.taxes.${tier.type}`);

    const steps = [
      {
        name: 'contributeAs',
        isCompleted: Boolean(this.state.stepProfile),
        validate: this.validateStepProfile,
      },
    ];

    // If amount and interval are forced by a tier or by params, skip StepDetails
    if (!isFixedPriceTier) {
      steps.push({
        name: 'details',
        isCompleted: Boolean(this.state.stepDetails && this.state.stepDetails.totalAmount > 0),
        validate: () => {
          return this.state.stepDetails && this.activeFormRef.current && this.activeFormRef.current.reportValidity();
        },
      });
    }

    // Hide step payment if using a free tier with fixed price
    if (!(isFreeTier && isFixedPriceTier)) {
      steps.push({
        name: 'payment',
        isCompleted: Boolean(isFreeTier || this.state.stepPayment),
        validate: this.validateStepPayment,
      });
    }

    // Show the summary step only if the order has tax
    if (tax) {
      steps.push({
        name: 'summary',
        isCompleted: this.state.stepSummary && this.state.stepSummary.isReady,
      });
    }

    return steps;
  }

  /** Get currency from the current tier, or fallback on collective currency */
  getCurrency() {
    const tier = this.getTier();
    return get(tier, 'currency', this.props.data.Collective.currency);
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
          TierId: get(this.getTier(), 'id'),
        },
      ),
    };
  }

  // Debounce state update functions that may be called successively
  updateProfile = debounce(stepProfile => this.setState({ stepProfile, stepPayment: null }), 300);
  updateDetailgqls = debounce(stepDetails => this.setState({ stepDetails }), 100, { leading: true, maxWait: 500 });

  /* We only support paypal for one time donations to the open source collective for now. */
  hasPaypal() {
    return get(this.props.data, 'Collective.host.id') === 11004 && !get(this.state, 'stepDetails.interval');
  }

  /**
   * When using an order with fixed amount, this function returns the details to
   * show the user order amount as step details is skipped.
   */
  renderTierDetails(tier) {
    const amount = get(this.state.stepDetails, 'totalAmount');
    const interval = get(this.state.stepDetails, 'interval');
    const taxAmount = get(this.state.stepSummary, 'amount', 0);
    const tax = tier && get(this.props.data.Collective, `host.taxes.${tier.type}`);

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
                  {taxAmount > 0 && (
                    /** Use non-breaking spaces to ensure amount and tax stay on the same line */
                    <span>
                      &nbsp;+&nbsp;{tax.name}&nbsp;({tax.percentage}%)
                    </span>
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
    const { LoggedInUser, data } = this.props;
    const { stepDetails, stepPayment } = this.state;
    const [personal, profiles] = this.getProfiles();
    const tier = this.getTier();
    const interval = get(stepDetails, 'interval') || get(tier, 'interval') || this.props.interval;

    if (step.name === 'contributeAs') {
      return (
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
              defaultInterval={interval}
              defaultAmount={this.getDefaultTotalAmount()}
              disabledInterval={Boolean(tier) || Boolean(this.props.interval)}
              disabledAmount={!get(tier, 'presets') && !isNil(get(tier, 'amount') || this.props.amount)}
              minAmount={this.getOrderMinAmount()}
            />
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
          <FormattedMessage
            id="contribute.freeTier"
            defaultMessage="This is a free tier, you can submit your order directly."
          />
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
              paymentMethods={get(LoggedInUser, 'collective.paymentMethods', [])}
              collective={this.state.stepProfile}
              defaultValue={stepPayment}
              onNewCardFormReady={({ stripe }) => this.setState({ stripe })}
              withPaypal={this.hasPaypal()}
              manual={this.getManualPaymentMethod()}
              margins="0 auto"
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
              currency={this.getCurrency()}
              hostFeePercent={get(data, 'Collective.hostFeePercent')}
              paymentMethod={get(stepPayment, 'paymentMethod')}
              collectiveTaxInfo={this.state.stepSummary || { countryISO: this.getContributingProfileCountry() }}
              onChange={stepSummary => this.setState({ stepSummary })}
              showFees={false}
              tax={tier ? get(this.props.data.Collective, `host.taxes.${tier.type}`) : null}
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
      return <SignInOrJoinFree redirect={Router.asPath} />;
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
                totalAmount={this.getTotalAmount()}
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

  render() {
    const { data, loadingLoggedInUser, LoggedInUser } = this.props;

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;
    const logo = collective.image || get(collective.parentCollective, 'image');
    const isLoadingContent = loadingLoggedInUser || data.loading;
    const tier = this.getTier();

    return (
      <Page
        title={`Contribute - ${collective.name}`}
        description={collective.description}
        twitterHandle={collective.twitterHandle}
        image={collective.image || collective.backgroundImage}
      >
        <Flex alignItems="center" flexDirection="column" mx="auto" width={300} pt={4} mb={4}>
          <Link route="collective" params={{ slug: collective.slug }} className="goBack">
            <Logo
              src={logo}
              className="logo"
              type={collective.type}
              website={collective.website}
              height="10rem"
              key={logo}
            />
          </Link>

          <Link route="collective" params={{ slug: collective.slug }} className="goBack">
            <H2 as="h1" color="black.900">
              {collective.name}
            </H2>
          </Link>

          {tier && (
            <P fontSize="LeadParagraph" fontWeight="LeadParagraph" color="black.600" mt={3} textAlign="center">
              {tier.button ? (
                tier.button
              ) : (
                <FormattedMessage
                  id="contribute.contributorType"
                  defaultMessage="Contribute to '{name}' tier"
                  values={{ name: tier.name }}
                />
              )}
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
                      isFreeTier={this.isFreeTier()}
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

const addData = graphql(gql`
  query Collective($slug: String) {
    Collective(slug: $slug) {
      id
      slug
      name
      description
      twitterHandle
      type
      website
      image
      backgroundImage
      currency
      hostFeePercent
      tags
      countryISO
      host {
        id
        name
        settings
        taxes
        countryISO
      }
      parentCollective {
        image
      }
      tiers {
        id
        type
        name
        slug
        description
        amount
        currency
        interval
        presets
        button
      }
    }
  }
`);

const createOrderQuery = gql`
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id
      status
      transactions {
        id
      }
    }
  }
`;

export const addCreateOrderMutation = graphql(createOrderQuery, {
  props: ({ mutate }) => ({
    createOrder: order => mutate({ variables: { order } }),
  }),
});

const addGraphQL = compose(
  addData,
  addCreateCollectiveMutation,
  addCreateOrderMutation,
);

export default withIntl(addGraphQL(withUser(withStripeLoader(CreateOrderPage))));
