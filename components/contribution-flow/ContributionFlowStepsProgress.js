import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { getPaymentMethodName } from '../../lib/payment_method_label';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Flex } from '../Grid';
import StepsProgress from '../StepsProgress';
import { P, Span } from '../Text';

import { STEPS } from './constants';
import { getTotalAmount } from './utils';

// Styles for the steps label rendered in StepsProgress
const StepLabel = styled(Span)`
  text-transform: uppercase;
  text-align: center;
`;

StepLabel.defaultProps = {
  color: 'black.400',
  fontSize: '10px',
  mt: 1,
};

const PrettyAmountFromStepDetails = ({ stepDetails, currency, isFreeTier }) => {
  if (stepDetails.amount) {
    const totalAmount = stepDetails.amount + (stepDetails.platformContribution || 0);
    return <FormattedMoneyAmount interval={stepDetails.interval} currency={currency} amount={totalAmount} />;
  } else if (stepDetails.amount === 0 && isFreeTier) {
    return (
      <strong>
        <FormattedMessage id="Amount.Free" defaultMessage="Free" />
      </strong>
    );
  } else {
    return null;
  }
};

const StepInfo = ({ step, stepProfile, stepDetails, stepPayment, stepSummary, isFreeTier, currency }) => {
  if (step.name === STEPS.PROFILE) {
    if (stepProfile) {
      const mainInfo = stepProfile.email ?? stepProfile.name;
      const fullDescription = [stepProfile.name, stepProfile.email].filter(Boolean).join(' · ');
      return (
        <P title={fullDescription} fontSize="12px" lineHeight="16px" truncateOverflow css={{ maxWidth: 150 }}>
          {mainInfo}
        </P>
      );
    }
  } else if (step.name === STEPS.DETAILS) {
    if (stepDetails) {
      return (
        <React.Fragment>
          <PrettyAmountFromStepDetails stepDetails={stepDetails} currency={currency} isFreeTier={isFreeTier} />
          {!isNaN(stepDetails.quantity) && stepDetails.quantity > 1 && ` x ${stepDetails.quantity}`}
        </React.Fragment>
      );
    }
  } else if (step.name === STEPS.PAYMENT) {
    if (isFreeTier && getTotalAmount(stepDetails, stepSummary) === 0) {
      return <FormattedMessage id="noPaymentRequired" defaultMessage="No payment required" />;
    } else {
      return (stepPayment?.paymentMethod && getPaymentMethodName(stepPayment.paymentMethod)) || null;
    }
  } else if (step.name === STEPS.SUMMARY) {
    return stepSummary?.countryISO || null;
  }

  return null;
};

StepInfo.propTypes = {
  step: PropTypes.object,
  stepProfile: PropTypes.object,
  stepDetails: PropTypes.object,
  stepPayment: PropTypes.object,
  stepSummary: PropTypes.object,
  isFreeTier: PropTypes.bool,
  currency: PropTypes.string,
};

const ContributionFlowStepsProgress = ({
  stepProfile,
  stepDetails,
  stepPayment,
  stepSummary,
  isSubmitted,
  loading,
  steps,
  currentStep,
  lastVisitedStep,
  goToStep,
  currency,
  isFreeTier,
}) => {
  return (
    <StepsProgress
      steps={steps}
      focus={currentStep}
      allCompleted={isSubmitted}
      onStepSelect={!loading && !isSubmitted ? goToStep : undefined}
      loadingStep={loading ? currentStep : undefined}
      disabledStepNames={steps.slice(lastVisitedStep.index + 1, steps.length).map(s => s.name)}
    >
      {({ step }) => (
        <Flex flexDirection="column" alignItems="center">
          <StepLabel>{step.label || step.name}</StepLabel>
          <Container fontSize="12px" textAlign="center" wordBreak="break-word">
            {step.isVisited && (
              <StepInfo
                step={step}
                stepProfile={stepProfile}
                stepDetails={stepDetails}
                stepPayment={stepPayment}
                stepSummary={stepSummary}
                isFreeTier={isFreeTier}
                currency={currency}
              />
            )}
          </Container>
        </Flex>
      )}
    </StepsProgress>
  );
};

ContributionFlowStepsProgress.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.object).isRequired,
  currentStep: PropTypes.object.isRequired,
  goToStep: PropTypes.func.isRequired,
  stepProfile: PropTypes.object,
  stepDetails: PropTypes.object,
  stepPayment: PropTypes.object,
  stepSummary: PropTypes.object,
  isSubmitted: PropTypes.bool,
  loading: PropTypes.bool,
  lastVisitedStep: PropTypes.object,
  currency: PropTypes.string,
  isFreeTier: PropTypes.bool,
};

export default ContributionFlowStepsProgress;
