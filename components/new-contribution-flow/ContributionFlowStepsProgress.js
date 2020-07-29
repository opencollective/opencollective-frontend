import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../../lib/currency-utils';

import { Flex } from '../Grid';
import StepsProgress from '../StepsProgress';
import { Span } from '../Text';

import { STEPS } from './constants';

// Styles for the steps label rendered in StepsProgress
const StepLabel = styled(Span)`
  text-transform: uppercase;
  text-align: center;
`;

StepLabel.defaultProps = {
  color: 'black.400',
  fontSize: 'Tiny',
  mt: 1,
};

const STEP_LABELS = defineMessages({
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

const ContributionFlowStepsProgress = ({
  stepProfile,
  stepDetails,
  stepPayment,
  submitted,
  loading,
  steps,
  currentStep,
  lastVisitedStep,
  goToStep,
  currency,
  isFreeTier,
  showFeesOnTop,
}) => {
  const { formatMessage } = useIntl();
  return (
    <StepsProgress
      steps={steps}
      focus={currentStep}
      allCompleted={submitted}
      onStepSelect={!loading && !submitted ? goToStep : undefined}
      loadingStep={loading ? currentStep : undefined}
      disabledStepNames={steps.slice(lastVisitedStep.index + 1, steps.length).map(s => s.name)}
    >
      {({ step }) => {
        let details = null;
        if (step.name === STEPS.PROFILE) {
          details = get(stepProfile, 'name') || get(stepProfile, 'email', null);
        } else if (step.name === STEPS.DETAILS) {
          if (stepDetails && stepDetails.amount) {
            const formattedAmount = showFeesOnTop
              ? formatCurrency(stepDetails.amount + stepDetails.platformFee?.value, currency)
              : formatCurrency(stepDetails.amount, currency);

            const formattedTotalAmount =
              stepDetails.quantity > 1 ? `${formattedAmount} x ${stepDetails.quantity}` : formattedAmount;

            details = !stepDetails.interval ? (
              formattedTotalAmount
            ) : (
              <Span>
                {formattedTotalAmount}{' '}
                <FormattedMessage
                  id="tier.interval"
                  defaultMessage="per {interval, select, month {month} year {year} other {}}"
                  values={{ interval: stepDetails.interval }}
                />
              </Span>
            );
          } else if (stepDetails && stepDetails.amount === 0 && isFreeTier) {
            details = <FormattedMessage id="Amount.Free" defaultMessage="Free" />;
          }
        } else if (step.name === STEPS.PAYMENT) {
          if (isFreeTier && get(stepDetails, 'totalAmount') === 0) {
            details = <FormattedMessage id="noPaymentRequired" defaultMessage="No payment required" />;
          } else {
            details = get(stepPayment, 'title', null);
          }
        }

        return (
          <Flex flexDirection="column" alignItems="center">
            <StepLabel>{STEP_LABELS[step.name] ? formatMessage(STEP_LABELS[step.name]) : step.name}</StepLabel>
            <Span fontSize="Caption" textAlign="center">
              {step.isVisited && details}
            </Span>
          </Flex>
        );
      }}
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
  submitted: PropTypes.bool,
  loading: PropTypes.bool,
  lastVisitedStep: PropTypes.object,
  currency: PropTypes.string,
  isFreeTier: PropTypes.bool,
  showFeesOnTop: PropTypes.bool,
};

export default ContributionFlowStepsProgress;
