import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { debounce, get, pick, isNil, min } from 'lodash';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';
import { isURL } from 'validator';

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
import StepsProgress from '../components/StepsProgress';
import PayWithPaypalButton from '../components/PayWithPaypalButton';
import ContributeDetailsFAQ from '../components/faqs/ContributeDetailsFAQ';
import Container from '../components/Container';
import { fadeIn } from '../components/StyledKeyframes';
import MessageBox from '../components/MessageBox';
import SignInOrJoinFree from '../components/SignInOrJoinFree';
import ContributionBreakdown from '../components/ContributionBreakdown';

// Styles for the steps label rendered in StepsProgress
const StepLabel = styled(Span)`
  text-transform: uppercase;
`;
StepLabel.defaultProps = { color: 'black.400', fontSize: 'Tiny', mt: 1 };

// Styles for the previous, next and submit buttons
const PrevNextButton = styled(StyledButton)`
  animation: ${fadeIn} 0.3s;
`;
PrevNextButton.defaultProps = { buttonSize: 'large', fontWeight: 'bold', m: 2, minWidth: '255px' };

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
      tierId,
      tierSlug,
      quantity,
      description,
      interval,
      verb,
      step,
      redeem,
      redirect,
      referral,
    };
  }

  static propTypes = {
    slug: PropTypes.string, // for addData
    tierSlug: PropTypes.string,
    quantity: PropTypes.number,
    totalAmount: PropTypes.number,
    description: PropTypes.string,
    verb: PropTypes.string,
    step: PropTypes.string,
    redirect: PropTypes.string,
    redeem: PropTypes.bool,
    createOrder: PropTypes.func.isRequired, // from addCreateOrderMutation
    data: PropTypes.object.isRequired, // from withData
    intl: PropTypes.object.isRequired, // from withIntl
    loadStripe: PropTypes.func.isRequired, // from withStripeLoader
  };

  static errorRecaptchaConnect = "Can't connect to ReCaptcha. Try to reload the page, or disable your Ad Blocker.";
  static stepsWithTax = ['contributeAs', 'details', 'payment', 'summary'];
  static stepsWithoutTaxes = ['contributeAs', 'details', 'payment'];

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
    // Redirect to previous step if data is missing
    if (!this.isCurrentStepValid()) {
      const steps = this.getSteps();
      const maxStepIdx = this.getMaxStepIdx(steps);
      this.changeStep(maxStepIdx === 0 ? 'contributeAs' : steps[maxStepIdx - 1]);
    }

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

    // Redirect to previous step if data is missing
    if (!this.isCurrentStepValid()) {
      const steps = this.getSteps();
      const maxStepIdx = this.getMaxStepIdx(steps);
      this.changeStep(maxStepIdx === 0 ? 'contributeAs' : steps[maxStepIdx - 1]);
    }

    // Collective was loaded
    if (!prevProps.data.Collective && this.props.data.Collective && this.hasPaypal()) {
      getPaypal();
    }
  }

  componentWillUnmount() {
    unloadRecaptcha();
  }

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

  async submitOrder(paymentMethodOverride = null) {
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
        this.changeStep('success', { OrderId: orderCreated.id });
      }
    } catch (e) {
      this.setState({ submitting: false, error: e.message });
    }
  }

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

  /** Returns the tax linked to the current tier, or null if none */
  getTax() {
    const tier = this.getTier();
    return tier ? get(this.props.data.Collective, `host.settings.tiersTaxes.${tier.type}`) : null;
  }

  /** Returs the steps list */
  getSteps() {
    return this.getTax() ? CreateOrderPage.stepsWithTax : CreateOrderPage.stepsWithoutTaxes;
  }

  /** Return the index of the last step user can switch to */
  getMaxStepIdx(steps) {
    // Validate step profile
    if (!this.state.stepProfile) return 0;

    // Validate step details
    if (!this.state.stepDetails || isNil(this.state.stepDetails.totalAmount)) return 1;
    if (this.state.stepDetails.totalAmount === 0 && !this.isFreeTier()) return 1;

    // Validate step payment
    if (this.state.stepDetails.totalAmount === 0 && this.isFreeTier()) return 3;
    if (!this.state.stepPayment || this.state.stepPayment.error) return 2;
    return steps.length;
  }

  /** Return true if we're not missing data from previous steps */
  isCurrentStepValid() {
    const steps = this.getSteps();
    const stepIdx = steps.indexOf(this.props.step);
    const maxStepIdx = this.getMaxStepIdx(steps);
    return stepIdx === -1 || stepIdx <= maxStepIdx || maxStepIdx >= steps.length;
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

  getContributorTypeName() {
    const tier = this.getTier();
    if (tier) {
      return tier.name;
    } else if (this.props.verb === 'pay') {
      return <FormattedMessage id="member.title" defaultMessage="member" />;
    } else {
      return <FormattedMessage id="backer.title" defaultMessage="backer" />;
    }
  }

  renderPrevStepButton(steps, step) {
    const prevStepIdx = steps.indexOf(step) - 1;
    if (prevStepIdx < 0) {
      return null;
    }

    return (
      <PrevNextButton
        onClick={() => this.changeStep(steps[prevStepIdx])}
        buttonStyle="standard"
        disabled={this.state.submitting || this.state.submitted}
      >
        &larr; <FormattedMessage id="contribute.prevStep" defaultMessage="Previous step" />
      </PrevNextButton>
    );
  }

  renderNextStepButton(steps, step) {
    const stepIdx = steps.indexOf(step);
    if (stepIdx === -1) {
      return null;
    }

    const isLast = stepIdx + 1 >= steps.length;
    const canGoNext = stepIdx + 1 <= this.getMaxStepIdx(steps);
    const isPaypal = canGoNext && isLast && get(this.state, 'stepPayment.paymentMethod.service') === 'paypal';

    return isPaypal ? (
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
        onClick={() => (isLast ? this.submitOrder() : this.changeStep(steps[stepIdx + 1]))}
        disabled={this.state.submitting || !canGoNext || this.state.submitted}
        loading={this.state.submitting}
      >
        {isLast ? (
          <FormattedMessage id="contribute.submit" defaultMessage="Make contribution" />
        ) : (
          <FormattedMessage id="contribute.nextStep" defaultMessage="Next step" />
        )}{' '}
        &rarr;
      </PrevNextButton>
    );
  }

  // Debounce state update functions that may be called successively
  updateProfile = debounce(stepProfile => this.setState({ stepProfile, stepPayment: null }), 300);
  updateDetails = debounce(stepDetails => this.setState({ stepDetails }), 100, { leading: true, maxWait: 500 });

  /* We only support paypal for one time donations to the open source collective for now. */
  hasPaypal() {
    return get(this.props.data, 'Collective.host.id') === 11004 && !get(this.state, 'stepDetails.interval');
  }

  renderStep(step) {
    const { LoggedInUser, data } = this.props;
    const { stepDetails, stepPayment } = this.state;
    const [personal, profiles] = this.getProfiles();
    const tier = this.getTier();

    if (step === 'contributeAs') {
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
    } else if (step === 'details') {
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
              defaultInterval={get(stepDetails, 'interval') || get(tier, 'interval') || this.props.interval}
              defaultAmount={this.getDefaultTotalAmount()}
              disabledInterval={Boolean(tier) || Boolean(this.props.interval)}
              disabledAmount={!get(tier, 'presets') && !isNil(get(tier, 'amount') || this.props.amount)}
              minAmount={this.getOrderMinAmount()}
            />
          </Container>
          <ContributeDetailsFAQ mt={4} display={['none', null, 'block']} width={1 / 5} minWidth="335px" />
        </Flex>
      );
    } else if (step === 'payment') {
      return get(stepDetails, 'totalAmount') === 0 ? (
        <MessageBox type="success" withIcon>
          <FormattedMessage
            id="contribute.freeTier"
            defaultMessage="This is a free tier, you can submit your order directly."
          />
        </MessageBox>
      ) : (
        <Flex flexDirection="column" width={1} css={{ maxWidth: 480 }}>
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
      );
    } else if (step === 'summary') {
      return (
        <Flex flexDirection="column" width={1} css={{ maxWidth: 480 }}>
          <H5 textAlign="left" mb={3}>
            <FormattedMessage id="contribute.summary.breakdown" defaultMessage="Contribution breakdown:" />
          </H5>
          <ContributionBreakdown
            amount={get(stepDetails, 'totalAmount')}
            currency={this.getCurrency()}
            hostFeePercent={get(data, 'Collective.hostFeePercent')}
            paymentMethod={get(stepPayment, 'paymentMethod')}
            tax={this.getTax()}
          />
        </Flex>
      );
    }

    return null;
  }

  changeStep = async (step, options) => {
    const { createCollective, slug, refetchLoggedInUser, step: currentStep } = this.props;
    const { stepProfile } = this.state;
    const routeSuffix = step === 'success' ? 'Success' : '';

    const params = {
      ...options,
      collectiveSlug: slug,
      step: ['contributeAs', 'success'].includes(step) ? undefined : step,
    };

    if (this.state.error) {
      this.setState({ error: null });
    }

    // Validate step if it has a form
    if (!currentStep || currentStep === 'details' || currentStep === 'contributeAs') {
      if (!this.activeFormRef.current || !this.activeFormRef.current.reportValidity()) {
        return false;
      }
    }

    // Check if we're creating a new organization
    if (!currentStep && stepProfile && stepProfile.name && !stepProfile.id) {
      this.setState({ submitting: true });

      try {
        const { data: result } = await createCollective(stepProfile);
        const createdOrg = result.createCollective;

        await refetchLoggedInUser();
        this.setState({ stepProfile: createdOrg, submitting: false });
      } catch (error) {
        this.setState({ error: error.message, submitting: false });
        window.scrollTo(0, 0);
        return false;
      }
    } else if (currentStep === 'payment' && step === 'summary') {
      // Load credit card info from stripe before going to summary
      try {
        this.setState({ submitting: true });
        const paymentMethod = await this.getPaymentMethodToSubmit();
        this.setState(state => ({
          ...state,
          stepPayment: { ...state.stepPayment, paymentMethod, data: null },
          submitting: false,
        }));
      } catch (e) {
        this.setState({ error: e.message, submitting: false });
        return false;
      }
    }

    let route;
    if (this.props.tierId) {
      route = `orderCollectiveTierNew${routeSuffix}`;
    } else {
      route = `orderCollectiveNew${routeSuffix}`;
    }

    await Router.pushRoute(route, {
      ...params,
      ...pick(this.props, ['verb', 'tierId', 'tierSlug', 'amount', 'interval', 'description', 'redirect']),
    });
    window.scrollTo(0, 0);
  };

  renderContributeDetailsSummary(amount, currency, interval) {
    const formattedAmount = formatCurrency(amount, currency);
    return !interval ? (
      formattedAmount
    ) : (
      <Span>
        {formattedAmount}{' '}
        <FormattedMessage
          id="tier.interval"
          defaultMessage="per {interval, select, month {month} year {year} other {}}"
          values={{ interval: interval }}
        />
      </Span>
    );
  }

  renderStepsProgress(allSteps, currentStep) {
    const { stepProfile, stepDetails, stepPayment, submitted } = this.state;
    const loading = this.props.loadingLoggedInUser || this.state.loading || this.state.submitting;
    const steps = allSteps.filter(s => s !== 'summary'); // Hide summary step in progress

    return (
      <StepsProgress
        steps={steps}
        focus={currentStep}
        allCompleted={submitted || currentStep === 'summary'}
        onStepSelect={!loading && !submitted ? this.changeStep : undefined}
        loadingStep={loading ? currentStep : undefined}
        disabledSteps={steps.slice(this.getMaxStepIdx(steps), steps.length)}
      >
        {({ step }) => {
          let label = null;
          let details = null;
          if (step === 'contributeAs') {
            label = <FormattedMessage id="contribute.step.contributeAs" defaultMessage="Contribute as" />;
            details = get(stepProfile, 'name', null);
          } else if (step === 'details') {
            label = <FormattedMessage id="contribute.step.details" defaultMessage="Details" />;
            if (stepDetails && stepDetails.totalAmount) {
              const currency = this.getCurrency();
              details = this.renderContributeDetailsSummary(stepDetails.totalAmount, currency, stepDetails.interval);
            } else if (stepDetails && stepDetails.totalAmount === 0 && this.isFreeTier()) {
              details = 'Free';
            }
          } else if (step === 'payment') {
            label = <FormattedMessage id="contribute.step.payment" defaultMessage="Payment" />;
            if (this.isFreeTier() && get(stepDetails, 'totalAmount') === 0) {
              details = 'No payment required';
            } else {
              details = get(stepPayment, 'title', null);
            }
          }

          return (
            <Flex flexDirection="column" alignItems="center">
              <StepLabel>{label}</StepLabel>
              <Span fontSize="Caption" textAlign="center">
                {details}
              </Span>
            </Flex>
          );
        }}
      </StepsProgress>
    );
  }

  renderContent(steps) {
    const { LoggedInUser } = this.props;

    if (!LoggedInUser) {
      return <SignInOrJoinFree redirect={Router.asPath} />;
    }

    const step = this.props.step || 'contributeAs';
    return (
      <Flex flexDirection="column" alignItems="center" mx={3} width={0.95}>
        {this.renderStep(step)}
        <Flex mt={[4, null, 5]} justifyContent="center" flexWrap="wrap">
          {this.renderPrevStepButton(steps, step)}
          {this.renderNextStepButton(steps, step)}
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
    const isLoadingContent = loadingLoggedInUser || data.loading || !this.isCurrentStepValid();
    const steps = this.getSteps();
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
        <Flex id="content" flexDirection="column" alignItems="center" mb={6} p={2}>
          {loadingLoggedInUser ||
            (LoggedInUser && (
              <Box mb={[3, null, 4]} width={0.8} css={{ maxWidth: 365, minHeight: 95 }}>
                {this.renderStepsProgress(steps, this.props.step || 'contributeAs')}
              </Box>
            ))}
          {this.state.error && (
            <MessageBox type="error" mb={3} mx={2} withIcon>
              {this.state.error.replace('GraphQL error: ', '')}
            </MessageBox>
          )}
          {isLoadingContent ? <Loading /> : this.renderContent(steps)}
        </Flex>
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
