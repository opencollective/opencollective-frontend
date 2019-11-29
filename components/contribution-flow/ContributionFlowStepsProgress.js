import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import styled from 'styled-components';

import StepsProgress from '../StepsProgress';
import { FormattedMessage } from 'react-intl';
import { Flex } from '@rebass/grid';
import { Span } from '../Text';
import { formatCurrency } from '../../lib/utils';

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
}) => {
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
        let label = null;
        let details = null;
        if (step.name === 'contributeAs') {
          label = <FormattedMessage id="contribute.step.contributeAs" defaultMessage="Contribute as" />;
          details = get(stepProfile, 'name', null);
        } else if (step.name === 'details') {
          label = <FormattedMessage id="contribute.step.details" defaultMessage="Details" />;
          if (stepDetails && stepDetails.totalAmount) {
            const formattedAmount = formatCurrency(stepDetails.amount, currency);
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
          } else if (stepDetails && stepDetails.totalAmount === 0 && isFreeTier) {
            details = 'Free';
          }
        } else if (step.name === 'payment') {
          label = <FormattedMessage id="contribute.step.payment" defaultMessage="Payment info" />;
          if (isFreeTier && get(stepDetails, 'totalAmount') === 0) {
            details = 'No payment required';
          } else {
            details = get(stepPayment, 'title', null);
          }
        } else if (step.name === 'summary') {
          label = <FormattedMessage id="contribute.step.summary" defaultMessage="Summary" />;
        }

        return (
          <Flex flexDirection="column" alignItems="center">
            <StepLabel>{label}</StepLabel>
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
};

export default ContributionFlowStepsProgress;
