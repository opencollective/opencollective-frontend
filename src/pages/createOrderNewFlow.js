import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import { graphql, compose } from 'react-apollo';
import gql from 'graphql-tag';
import { get, omit, pick } from 'lodash';
import { Box, Flex } from '@rebass/grid';
import styled from 'styled-components';

import { ErrorCircle } from 'styled-icons/boxicons-regular/ErrorCircle.cjs';

import { Router } from '../server/pages';

import { H2, H5, P, Span } from '../components/Text';
import Logo from '../components/Logo';
import ErrorPage from '../components/ErrorPage';
import Page from '../components/Page';
import Link from '../components/Link';
import SignIn from '../components/SignIn';
import CreateProfile from '../components/CreateProfile';
import ContributeAs from '../components/ContributeAs';
import StyledInputField from '../components/StyledInputField';

import { addCreateCollectiveMutation, createUserQuery } from '../graphql/mutations';

import * as api from '../lib/api';
import { stripeTokenToPaymentMethod } from '../lib/stripe';
import { formatCurrency } from '../lib/utils';
import withIntl from '../lib/withIntl';
import { getRecaptcha, getRecaptchaSiteKey, unloadRecaptcha } from '../lib/recaptcha';
import { withStripeLoader } from '../components/StripeProvider';
import { withUser } from '../components/UserProvider';
import ContributePayment from '../components/ContributePayment';
import ContributeDetails from '../components/ContributeDetails';
import Loading from '../components/Loading';
import StyledButton from '../components/StyledButton';
import StepsProgress from '../components/StepsProgress';
import StyledCard from '../components/StyledCard';

const STEPS = ['contributeAs', 'details', 'payment'];

const StepLabel = styled(Span)`
  text-transform: uppercase;
`;
StepLabel.defaultProps = { color: 'black.400', fontSize: 'Tiny', mt: 1 };

const PrevNextButton = styled(StyledButton)``;
PrevNextButton.defaultProps = { buttonSize: 'large', fontWeight: 'bold', mx: 2 };

class CreateOrderPage extends React.Component {
  static getInitialProps({
    query: {
      collectiveSlug,
      eventSlug,
      TierId,
      amount,
      quantity,
      totalAmount,
      interval,
      description,
      verb,
      step,
      redeem,
      redirect,
      referral,
    },
  }) {
    return {
      slug: eventSlug || collectiveSlug,
      TierId,
      quantity,
      totalAmount: totalAmount || amount * 100,
      interval,
      description,
      verb,
      step,
      redeem,
      redirect,
      referral,
    };
  }

  static propTypes = {
    slug: PropTypes.string, // for addData
    TierId: PropTypes.string,
    quantity: PropTypes.number,
    totalAmount: PropTypes.number,
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
  };

  static errorRecaptchaConnect = "Can't connect to ReCaptcha. Try to reload the page, or disable your Ad Blocker.";

  constructor(props) {
    super(props);
    this.recaptcha = null;
    this.recaptchaToken = null;

    const interval = (props.interval || '').toLowerCase().replace(/ly$/, '');
    const initialDetails = {
      quantity: parseInt(props.quantity, 10) || 1,
      interval: ['month', 'year'].includes(interval) ? interval : null,
      totalAmount: parseInt(props.totalAmount, 10) || null,
    };

    this.state = {
      loading: false,
      submitting: false,
      submitted: false,
      unknownEmail: false,
      signIn: true,
      stepProfile: this.getLoggedInUserDefaultContibuteProfile(),
      stepDetails: initialDetails,
      stepPayment: null,
      error: null,
      stripe: null,
    };
  }

  async componentDidMount() {
    this.props.loadStripe();

    try {
      this.recaptcha = await getRecaptcha();
    } catch {
      this.setState({ error: CreateOrderPage.errorRecaptchaConnect });
    }
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.LoggedInUser && this.props.LoggedInUser && !this.state.stepProfile) {
      this.setState({ stepProfile: this.getLoggedInUserDefaultContibuteProfile() });
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
    const { stepPayment } = this.state;
    if (!stepPayment.isNew) {
      return pick(stepPayment.paymentMethod, ['uuid']);
    } else if (!this.state.stripe) {
      this.setState({
        submitting: false,
        error: 'There was a problem initializing the payment form. Please reload the page and try again',
      });
      return null;
    }
    const { token, error } = await this.state.stripe.createToken();
    if (error) {
      this.setState({ submitting: false, error: error.message });
      return null;
    }
    return { ...stripeTokenToPaymentMethod(token), save: this.state.stepPayment.save };
  }

  async submitOrder() {
    this.setState({ submitting: true, error: null });
    const { stepDetails } = this.state;
    const paymentMethod = await this.getPaymentMethodToSubmit();
    if (!paymentMethod) {
      return false;
    }
    const recaptchaToken = await this.fetchRecaptchaToken();
    if (!recaptchaToken) {
      this.setState({ error: CreateOrderPage.errorRecaptchaConnect });
    }

    const tier = this.getTier();
    const order = {
      quantity: this.props.quantity || 1,
      totalAmount: stepDetails.totalAmount,
      currency: get(tier, 'currency') || get(this.props, 'data.Collective.currency'),
      interval: stepDetails.interval,
      paymentMethod,
      referral: this.props.referral,
      fromCollective: pick(this.state.stepProfile, ['id', 'type', 'name']),
      collective: pick(this.props.data.Collective, ['id']),
      tier: tier ? pick(this.getTier(), ['id', 'amount']) : undefined,
      recaptchaToken,
    };

    try {
      const res = await this.props.createOrder(order);
      const orderCreated = res.data.createOrder;
      this.setState({ submitting: false, submitted: true, error: null });
      this.changeStep('success', { OrderId: orderCreated.id });
    } catch (e) {
      this.setState({ submitting: false, error: e.message });
    }
  }

  signIn = email => {
    if (this.state.submitting) {
      return false;
    }

    this.setState({ submitting: true });
    return api
      .checkUserExistence(email)
      .then(exists => {
        if (exists) {
          return api.signin({ email }, Router.asPath).then(() => {
            Router.pushRoute('signinLinkSent', { email });
          });
        } else {
          this.setState({ unknownEmail: true, submitting: false });
        }
      })
      .catch(e => {
        this.setState({ error: e.message, submitting: false });
      });
  };

  createProfile = data => {
    if (this.state.submitting) {
      return false;
    }

    const redirect = window.location.pathname;
    const user = pick(data, ['email', 'firstName', 'lastName']);
    const organizationData = pick(data, ['orgName', 'githubHandle', 'twitterHandle', 'website']);
    const organization = Object.keys(organizationData).length > 0 ? organizationData : null;
    if (organization) {
      organization.name = organization.orgName;
      delete organization.orgName;
    }

    this.setState({ submitting: true });
    this.props
      .createUser({ user, organization, redirect })
      .then(() => {
        Router.pushRoute('signinLinkSent', { email: user.email });
      })
      .catch(error => {
        this.setState({ error: error.message, submitting: false });
      });
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
    const { LoggedInUser } = this.props;
    return !LoggedInUser
      ? [{}, {}]
      : [
          { email: LoggedInUser.email, image: LoggedInUser.image, ...LoggedInUser.collective },
          LoggedInUser.memberOf
            .filter(m => m.role === 'ADMIN' && m.collective.id !== this.props.data.Collective.id)
            .map(({ collective }) => collective),
        ];
  }

  /** Return the currently selected tier, or a falsy value if none selected */
  getTier() {
    const { data, TierId } = this.props;
    return TierId && get(data, 'Collective.tiers', []).find(t => t.id == TierId);
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

  renderPrevStepButton(step) {
    const prevStepIdx = STEPS.indexOf(step) - 1;
    if (prevStepIdx < 0) {
      return null;
    }

    return (
      <PrevNextButton
        onClick={() => this.changeStep(STEPS[prevStepIdx])}
        buttonStyle="standard"
        disabled={this.state.submitting || this.state.submitted}
      >
        &larr; <FormattedMessage id="contribute.prevStep" defaultMessage="Previous step" />
      </PrevNextButton>
    );
  }

  /** Return the index of the last step user can switch to */
  getMaxStepIdx() {
    if (!this.state.stepProfile) return 0;
    if (!this.state.stepDetails || !this.state.stepDetails.totalAmount) return 1;
    if (!this.state.stepPayment || this.state.stepPayment.error) return 2;
    return STEPS.length;
  }

  renderNextStepButton(step) {
    const stepIdx = STEPS.indexOf(step);
    if (stepIdx === -1) {
      return null;
    }

    const isLast = stepIdx + 1 >= STEPS.length;
    return (
      <PrevNextButton
        buttonStyle="primary"
        onClick={() => (isLast ? this.submitOrder() : this.changeStep(STEPS[stepIdx + 1]))}
        disabled={this.state.submitting || stepIdx + 1 > this.getMaxStepIdx() || this.state.submitted}
      >
        {isLast ? (
          <FormattedMessage id="contribute.submit" defaultMessage="Submit" />
        ) : (
          <FormattedMessage id="contribute.nextStep" defaultMessage="Next step" />
        )}{' '}
        &rarr;
      </PrevNextButton>
    );
  }

  renderStep(step) {
    const { data, LoggedInUser, TierId } = this.props;
    const [personal, profiles] = this.getProfiles();
    const tier = this.getTier();
    const amountOptions = (tier && tier.presets) || [500, 1000, 2000, 5000];

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
            <ContributeAs
              {...fieldProps}
              onChange={profile => this.setState({ stepProfile: profile, stepPayment: null })}
              profiles={profiles}
              personal={personal}
              defaultSelectedProfile={this.getLoggedInUserDefaultContibuteProfile()}
            />
          )}
        </StyledInputField>
      );
    } else if (step === 'details') {
      return (
        <Fragment>
          <H5 textAlign="left" mb={3}>
            <FormattedMessage id="contribute.details.label" defaultMessage="Contribution Details:" />
          </H5>
          <ContributeDetails
            amountOptions={amountOptions}
            currency={(tier && tier.currency) || data.Collective.currency}
            onChange={data => this.setState({ stepDetails: data })}
            showFrequency={Boolean(TierId) || undefined}
            interval={get(this.state, 'stepDetails.interval')}
            totalAmount={get(this.state, 'stepDetails.totalAmount')}
          />
        </Fragment>
      );
    } else if (step === 'payment') {
      return (
        <Fragment>
          <H5 textAlign="left" mb={3}>
            <FormattedMessage id="contribute.payment.label" defaultMessage="Choose a payment method:" />
          </H5>
        <ContributePayment
          onChange={stepPayment => this.setState({ stepPayment })}
          paymentMethods={get(LoggedInUser, 'collective.paymentMethods', [])}
          collective={this.state.stepProfile}
          defaultValue={this.state.stepPayment}
          onNewCardFormReady={({ stripe }) => this.setState({ stripe })}
        />
        </Fragment>
      );
    }

    return null;
  }

  changeStep = async (step, options) => {
    const { createCollective, verb, data, refetchLoggedInUser, TierId } = this.props;
    const { stepProfile, step: currentStep } = this.state;
    const routeSuffix = step === 'success' ? 'Success' : '';
    const params = {
      ...options,
      collectiveSlug: data.Collective.slug,
      step: ['contributeAs', 'success'].includes(step) ? undefined : step,
    };

    // check if we're creating a new organization
    if (!currentStep && stepProfile.orgName) {
      const { data: result } = await createCollective({
        name: stepProfile.orgName,
        ...omit(stepProfile, ['orgName']),
      });
      if (result && result.createCollective) {
        await refetchLoggedInUser();
        this.setState({ stepProfile: result.createCollective });
      }
    }

    if (verb) {
      Router.pushRoute(`donate${routeSuffix}`, { ...params, verb });
    } else {
      Router.pushRoute(`orderCollectiveTier${routeSuffix}`, { ...params, TierId });
    }
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

  renderStepsProgress(currentStep) {
    const { stepProfile, stepDetails, stepPayment, submitted } = this.state;
    const loading = this.props.loadingLoggedInUser || this.state.loading || this.state.submitting;
    return (
      <StepsProgress
        steps={STEPS}
        focus={currentStep}
        allCompleted={submitted}
        onStepSelect={!loading && !submitted ? this.changeStep : undefined}
        loadingStep={loading ? currentStep : undefined}
        disabledSteps={STEPS.slice(this.getMaxStepIdx() + 1, STEPS.length)}
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
              const currency = get(this.getTier(), 'currency') || this.props.data.Collective.currency;
              details = this.renderContributeDetailsSummary(stepDetails.totalAmount, currency, stepDetails.interval);
            }
          } else if (step === 'payment') {
            label = <FormattedMessage id="contribute.step.payment" defaultMessage="Payment" />;
            details = get(stepPayment, 'title', null);
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

  renderContent() {
    const { LoggedInUser } = this.props;
    const { loading, submitting, unknownEmail } = this.state;

    if (!LoggedInUser) {
      return this.state.signIn ? (
        <Flex justifyContent="center">
          <SignIn
            onSubmit={this.signIn}
            onSecondaryAction={() => this.setState({ signIn: false })}
            loading={loading || submitting}
            unknownEmail={unknownEmail}
          />
        </Flex>
      ) : (
        <Flex justifyContent="center">
          <CreateProfile
            onPersonalSubmit={this.createProfile}
            onOrgSubmit={this.createProfile}
            onSecondaryAction={() => this.setState({ signIn: true })}
            submitting={submitting}
          />
        </Flex>
      );
    }

    const step = this.props.step || 'contributeAs';
    return (
      <Flex flexDirection="column" alignItems="center" mx={3}>
        <Box width={1}>{this.renderStep(step)}</Box>
        <Flex mt={5}>
          {this.renderPrevStepButton(step)}
          {this.renderNextStepButton(step)}
        </Flex>
      </Flex>
    );
  }

  render() {
    const { data, loadingLoggedInUser } = this.props;

    if (!data.Collective) {
      return <ErrorPage data={data} />;
    }

    const collective = data.Collective;
    const logo = collective.image || get(collective.parentCollective, 'image');
    const tierName = this.getContributorTypeName();

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

          <P fontSize="LeadParagraph" fontWeight="LeadParagraph" color="black.600" mt={3}>
            <FormattedMessage
              id="contribute.contributorType"
              defaultMessage="Become a {name}"
              values={{ name: tierName }}
            />
          </P>
        </Flex>
        <Flex id="content" flexDirection="column" alignItems="center" mb={6}>
          <Box mb={3} width={0.8} css={{ maxWidth: 365, minHeight: 95 }}>
            {this.renderStepsProgress(this.props.step || 'contributeAs')}
          </Box>
          {this.state.error && (
            <StyledCard borders={1} borderColor="red.500" bg="red.100" color="red.700" p={3} mb={3} mx={2}>
              <ErrorCircle size="1.2em" />
              &nbsp;
              {this.state.error.replace('GraphQL error: ', '')}
            </StyledCard>
          )}
          {loadingLoggedInUser || data.loading ? <Loading /> : this.renderContent()}
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
      tags
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
      }
    }
  }
`);

const addCreateUserMutation = graphql(createUserQuery, {
  props: ({ mutate }) => ({
    createUser: variables => mutate({ variables }),
  }),
});

const createOrderQuery = gql`
  mutation createOrder($order: OrderInputType!) {
    createOrder(order: $order) {
      id
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
  addCreateUserMutation,
);

export default withIntl(addGraphQL(withUser(withStripeLoader(CreateOrderPage))));
