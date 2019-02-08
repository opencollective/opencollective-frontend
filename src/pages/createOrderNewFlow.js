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
  static getInitialProps({
    query: {
      collectiveSlug,
      eventSlug,
      tierId,
      tierSlug,
      amount,
      quantity,
      interval,
      description,
      verb,
      step,
      redeem,
      redirect,
      referral,
    },
  }) {
    // Whitelist interval
    if (['monthly', 'yearly'].includes(interval)) {
      interval = interval.replace('ly', '');
    } else if (!['month', 'year'].includes(interval)) {
      interval = null;
    }

    return {
      slug: eventSlug || collectiveSlug,
      amount: parseInt(amount) || null,
      step: step || 'contributeAs',
      tierId,
      tierSlug,
      quantity,
      description,
      interval,
      verb,
      redeem,
      redirect,
      referral,
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

  async getPaymentMethodToSubmit() {
    const { stepDetails, stepPayment } = this.state;

    // Always ignore payment method for free tiers
    if (this.isFreeTier() && stepDetails.totalAmount === 0) {
      return null;
    }

    // For existing payment methods, just pick the service, type and uuid
    if (!stepPayment.isNew) {
      return pick(stepPayment.paymentMethod, ['service', 'type', 'uuid']);
    }

    // New credit card - if no data, stripe token has already been exchanged
    if (!stepPayment.data && stepPayment.paymentMethod) {
      return stepPayment.paymentMethod;
    }

    // New credit card - load info from stripe
    if (!this.state.stripe) {
      throw new Error('There was a problem initializing the payment form. Please reload the page and try again');
    }
    const { token, error } = await this.state.stripe.createToken();
    if (error) {
      throw new Error(error.message);
    }
    return { ...stripeTokenToPaymentMethod(token), save: this.state.stepPayment.save };
  }

  submitOrder = async (paymentMethodOverride = null) => {
    this.setState({ submitting: true, error: null });
    const { stepDetails } = this.state;

    // Load payment method info
    let paymentMethod = null;
    try {
      paymentMethod = paymentMethodOverride || (await this.getPaymentMethodToSubmit());
    } catch (e) {
      this.setState({ submitting: false, error: e.message });
      return false;
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
    const { amount, presets } = this.getTier() || {};
    if (isNil(amount) && isNil(presets)) return 0;
    return min(isNil(amount) ? presets : [...(presets || []), amount]);
  }

  /** Get default total amount, or undefined if we don't have any info on this */
  getDefaultTotalAmount() {
    const tier = this.getTier();
    const amountFromUrl = this.props.amount ? this.props.amount * 100 : undefined;
    return get(this.state.stepDetails, 'totalAmount') || get(tier, 'amount') || amountFromUrl;
  }

  /** Get total amount based on stepDetails with taxes applied */
  getTotalAmount() {
    const totalAmount = get(this.state, 'stepDetails.totalAmount', 0);
    const tax = this.getTax();
    return tax ? Math.trunc(totalAmount * (1 + tax.percentage / 100)) : totalAmount;
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

  /** Returns the tax linked to the current tier, or null if none */
  getTax() {
    const tier = this.getTier();
    return tier ? get(this.props.data.Collective, `host.settings.tiersTaxes.${tier.type}`) : null;
  }

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

  /** Returs the steps list */
  getSteps() {
    const isFixedPriceTier = this.isFixedPriceTier();

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
        isCompleted: Boolean(this.state.stepDetails),
        validate: () => {
          return this.state.stepDetails && this.activeFormRef.current && this.activeFormRef.current.reportValidity();
        },
      });
    }

    // Hide step payment if using a free tier with fixed price
    if (!this.isFreeTier() || !isFixedPriceTier) {
      steps.push({
        name: 'payment',
        isCompleted: Boolean(this.state.stepPayment),
        validate: () => this.state.stepPayment,
      });
    }

    // Show the summary step only if the order has tax
    if (this.getTax()) {
      steps.push({
        name: 'summary',
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
  updateDetails = debounce(stepDetails => this.setState({ stepDetails }), 100, { leading: true, maxWait: 500 });

  /* We only support paypal for one time donations to the open source collective for now. */
  hasPaypal() {
    return get(this.props.data, 'Collective.host.id') === 11004 && !get(this.state, 'stepDetails.interval');
  }

  /**
   * When using an order with fixed amount, this function returns the details to
   * show the user order amount as step details is skipped.
   */
  renderTierDetails(tier, tax) {
    const amount = get(this.state.stepDetails, 'totalAmount');
    const interval = get(this.state.stepDetails, 'interval');

    return (
      <Container mt={4} mx={2} width={1 / 5} minWidth="300px" maxWidth="370px">
        <Container fontSize="Paragraph" mb={3}>
          <P fontSize="LeadParagraph" fontWeight="bold" mb={2}>
            <FormattedMessage id="contribute.tierDetailsTitle" defaultMessage="Tier details:" />
          </P>
          <FormattedMessage
            id="contribute.tierDetails"
            defaultMessage="You’ll contribute with the amount of {amount} {interval, select, month {monthly} year {yearly} other {}}."
            values={{
              amount: (
                <strong>{formatCurrency(amount, get(tier, 'currency', this.props.data.Collective.currency))}</strong>
              ),
              interval: get(tier, 'interval') || this.props.interval,
            }}
          />
          {interval && (
            <React.Fragment>
              {' '}
              <FormattedMessage
                id="contribute.tierDetailsFrequency"
                defaultMessage="Your next charge will be on:"
              />{' '}
              <Span color="primary.500">
                {moment()
                  .add(1, interval)
                  .date(1)
                  .format('MMM D, YYYY')}
              </Span>
            </React.Fragment>
          )}
        </Container>
        <ContributeDetailsFAQ hasInterval={Boolean(interval)} tax={tax} />
      </Container>
    );
  }

  renderStep(step) {
    const { LoggedInUser, data } = this.props;
    const { stepDetails, stepPayment } = this.state;
    const [personal, profiles] = this.getProfiles();
    const tier = this.getTier();
    const tax = this.getTax();
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
                onChange={this.updateProfile}
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
          <ContributeDetailsFAQ
            hasInterval={Boolean(interval)}
            hasVat={tax}
            mt={4}
            display={['none', null, 'block']}
            width={1 / 5}
            minWidth="335px"
          />
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
          {this.isFixedPriceTier() ? this.renderTierDetails(tier, tax) : <Box width={[0, null, null, 1 / 5]} />}
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
              tax={tax}
            />
          </Container>
          {this.renderTierDetails(tier, tax)}
        </Flex>
      );
    }

    return null;
  }

  renderContent(step, goNext, goBack) {
    const { LoggedInUser } = this.props;

    if (!LoggedInUser) {
      return <SignInOrJoinFree redirect={Router.asPath} />;
    }

    const isPaypal = get(this.state, 'stepPayment.paymentMethod.service') === 'paypal';
    const canNavigate = !this.state.submitting && !this.state.submitted;
    return (
      <Flex flexDirection="column" alignItems="center" mx={3} width={0.95}>
        {this.renderStep(step)}
        <Flex mt={[4, null, 5]} justifyContent="center" flexWrap="wrap">
          {goBack && (
            <PrevNextButton buttonStyle="standard" disabled={!canNavigate} onClick={goBack}>
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
              disabled={!goNext || !canNavigate}
              loading={this.state.submitting}
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
          {({ steps, currentStep, lastValidStep, lastVisitedStep, goNext, goBack, goToStep }) => (
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
              {isLoadingContent || currentStep.index > lastValidStep.index + 1 ? (
                <Loading />
              ) : (
                this.renderContent(currentStep, goNext, goBack)
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
      host {
        id
        name
        settings
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
