/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import React from 'react';
import PropTypes from 'prop-types';
import { get, pick } from 'lodash';
import memoizeOne from 'memoize-one';
import { defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';

import { getWebsiteUrl } from '../../lib/utils';
import { Router } from '../../server/pages';

import Container from '../../components/Container';
import NewContributeFAQ from '../../components/faqs/NewContributeFAQ';
import { Box, Flex } from '../../components/Grid';
import { addSignupMutation } from '../../components/SignInOrJoinFree';

import Steps from '../Steps';
import { withUser } from '../UserProvider';

import NewContributionFlowButtons from './ContributionFlowButtons';
import ContributionFlowHeader from './ContributionFlowHeader';
import ContributionFlowMainContainer from './ContributionFlowMainContainer';
import ContributionFlowStepsProgress from './ContributionFlowStepsProgress';
import SafeTransactionMessage from './SafeTransactionMessage';
import { getTierMinAmount, isFixedContribution, taxesMayApply } from './utils';

const StepsProgressBox = styled(Box)`
  min-height: 100px;
  max-width: 450px;

  @media screen and (max-width: 640px) {
    width: 100%;
    max-width: 100%;
  }
`;

const stepsLabels = defineMessages({
  contributeAs: {
    id: 'contribute.step.contributeAs',
    defaultMessage: 'Contribute as',
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
    id: 'contribute.step.summary',
    defaultMessage: 'Summary',
  },
});

class ContributionFlow extends React.Component {
  static propTypes = {
    collective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
      currency: PropTypes.string.isRequired,
    }).isRequired,
    host: PropTypes.object.isRequired,
    tier: PropTypes.object,
    intl: PropTypes.object,
    createUser: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this.mainContainerRef = React.createRef();
    this.state = {
      stepDetails: null,
      stepProfile: null,
      stepPayment: null,
      stepSummary: null,
    };
  }

  getEmailRedirectURL() {
    let currentPath = window.location.pathname;
    if (window.location.search) {
      currentPath = currentPath + window.location.search;
    } else {
      currentPath = `${currentPath}?`;
    }
    // add 'emailRedirect' to the query so we can load the Payment step when
    // the user comes back from signing up to make a recurring contribution
    currentPath = `${currentPath.replace('profile', 'payment')}&emailRedirect=true`;
    return encodeURIComponent(currentPath);
  }

  createProfileForRecurringContributions = async data => {
    if (this.state.submitting) {
      return false;
    }

    const user = pick(data, ['email', 'name']);

    this.setState({ submitting: true });

    try {
      await this.props.createUser({
        variables: {
          user,
          redirect: this.getEmailRedirectURL(),
          websiteUrl: getWebsiteUrl(),
        },
      });
      await Router.pushRoute('signinLinkSent', { email: user.email });
      window.scrollTo(0, 0);
    } catch (error) {
      console.log(error);
      this.setState({ error: error.message, submitting: false });
      window.scrollTo(0, 0);
    }
  };

  /** Steps component callback  */
  onStepChange = async step => this.pushStepRoute(step.name);

  /** Navigate to another step, ensuring all route params are preserved */
  pushStepRoute = async (stepName, routeParams = {}) => {
    const { collective, tier, LoggedInUser } = this.props;
    const { stepDetails, stepProfile } = this.state;

    const params = {
      verb: this.props.verb || 'new-donate',
      collectiveSlug: collective.slug,
      step: stepName === 'details' ? undefined : stepName,
      totalAmount: this.props.fixedAmount ? this.props.fixedAmount.toString() : undefined,
      interval: this.props.fixedInterval || undefined,
      ...pick(this.props, ['interval', 'description', 'redirect']),
      ...routeParams,
    };

    let route = 'new-donate';
    if (tier) {
      params.tierId = tier.id;
      params.tierSlug = tier.slug;
      if (tier.type === 'TICKET' && collective.parentCollective) {
        route = 'orderEventTier';
        params.collectiveSlug = collective.parentCollective.slug;
        params.eventSlug = collective.slug;
        params.verb = 'events';
      } else {
        route = 'new-contribute';
        params.verb = 'new-contribute'; // Enforce "contribute" verb for ordering tiers
      }
    } else if (params.verb === 'contribute') {
      // Never use `contribute` as verb if not using a tier (would introduce a route conflict)
      params.verb = 'new-donate';
    }

    // Reset errors if any
    if (this.state.error) {
      this.setState({ error: null });
    }

    // Navigate to the new route
    if (stepName === 'success') {
      await Router.pushRoute(`${route}/success`);
    } else if (stepName === 'payment' && !LoggedInUser && stepDetails?.interval) {
      await this.createProfileForRecurringContributions(stepProfile);
    } else {
      await Router.pushRoute(route, params);
    }

    if (this.mainContainerRef.current) {
      this.mainContainerRef.current.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo(0, 0);
    }
  };

  // Memoized helpers
  isFixedContribution = memoizeOne(isFixedContribution);
  getTierMinAmount = memoizeOne(getTierMinAmount);
  taxesMayApply = memoizeOne(taxesMayApply);

  /** Returns the steps list */
  getSteps() {
    const { skipStepDetails, fixedInterval, fixedAmount, intl, collective, host, tier } = this.props;
    const { stepDetails, stepPayment, stepSummary } = this.state;
    const isFixedContribution = this.isFixedContribution(tier, fixedAmount, fixedInterval);
    const minAmount = this.getTierMinAmount(tier);
    const noPaymentRequired = minAmount === 0 && get(stepDetails, 'amount') === 0;
    const steps = [];

    // If amount and interval are forced by a tier or by params, skip StepDetails (except for events)
    if (!skipStepDetails && (!isFixedContribution || tier?.type === 'TICKET' || this.canHaveFeesOnTop())) {
      steps.push({
        name: 'details',
        label: intl.formatMessage(stepsLabels.details),
        isCompleted: Boolean(stepDetails && stepDetails.amount >= minAmount),
      });
    }

    steps.push({
      name: 'profile',
      label: intl.formatMessage(stepsLabels.contributeAs),
      isCompleted: Boolean(this.state.stepProfile),
    });

    // Hide step payment if using a free tier with fixed price
    if (!(minAmount === 0 && isFixedContribution)) {
      steps.push({
        name: 'payment',
        label: intl.formatMessage(stepsLabels.payment),
        isCompleted: Boolean(noPaymentRequired || stepPayment),
      });
    }

    // Show the summary step only if the order has tax
    if (this.taxesMayApply(collective, host, tier)) {
      steps.push({
        name: 'summary',
        label: intl.formatMessage(stepsLabels.summary),
        isCompleted: noPaymentRequired || get(stepSummary, 'isReady', false),
      });
    }

    return steps;
  }

  render() {
    const { collective, tier, showFeesOnTop, LoggedInUser } = this.props;

    return (
      <Steps
        steps={this.getSteps()}
        currentStepName={this.props.step}
        onStepChange={this.onStepChange}
        onInvalidStep={this.onInvalidStep}
        onComplete={this.submitOrder}
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
            ref={this.mainContainerRef}
          >
            <Box px={[2, 3]} mb={4}>
              <ContributionFlowHeader collective={collective} />
            </Box>
            <StepsProgressBox mb={[3, null, 4]} width={[1.0, 0.8]}>
              <ContributionFlowStepsProgress
                steps={steps}
                currentStep={currentStep}
                lastVisitedStep={lastVisitedStep}
                goToStep={goToStep}
                stepProfile={this.state.stepProfile}
                stepDetails={this.state.stepDetails}
                stepPayment={this.state.stepPayment}
                submitted={this.state.submitted}
                loading={this.state.loading || this.state.submitting}
                currency={collective.currency}
                isFreeTier={this.getTierMinAmount(tier) === 0}
                showFeesOnTop={showFeesOnTop}
              />
            </StepsProgressBox>
            {/* main container */}
            <Flex justifyContent="center" width={1} maxWidth={1340} flexWrap={['wrap', 'nowrap']} px={[2, 3]}>
              <Box display={['none', null, null, 'block']} width={[0.5, null, null, null, 1 / 3]} />
              <Box as="form" flex="1 1 50%" onSubmit={e => e.preventDefault()}>
                <ContributionFlowMainContainer
                  collective={collective}
                  tier={tier}
                  mainState={this.state}
                  onChange={data => this.setState(data)}
                  step={currentStep}
                />
                <Box mt={[4, 5]}>
                  <NewContributionFlowButtons
                    goNext={goNext}
                    goBack={goBack}
                    step={currentStep}
                    prevStep={prevStep}
                    nextStep={nextStep}
                    isRecurringContributionLoggedOut={!LoggedInUser && this.state.stepDetails?.interval}
                  />
                </Box>
              </Box>
              <Box minWidth="300px" width={1 / 3} ml={[0, 4]} mt={[4, 0]}>
                <Box maxWidth={['100%', 300]}>
                  <SafeTransactionMessage />
                  <NewContributeFAQ mt={4} titleProps={{ mb: 2 }} />
                </Box>
              </Box>
            </Flex>
          </Container>
        )}
      </Steps>
    );
  }
}

export default injectIntl(withUser(addSignupMutation(ContributionFlow)));
