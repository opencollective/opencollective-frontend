import React, { Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import { styled } from 'styled-components';

import { AnalyticsEvent } from '../../lib/analytics/events';
import { track } from '../../lib/analytics/plausible';
import { AnalyticsProperty } from '../../lib/analytics/properties';

import Currency from '../Currency';
import { Box, Flex } from '../Grid';
import PayWithPaypalButton from '../PayWithPaypalButton';
import StyledButton from '../StyledButton';

import { STEPS } from './constants';
import { getTotalAmount } from './utils';

const ButtonWithTextCentered = styled(StyledButton)`
  span {
    vertical-align: baseline;
  }
`;

type ContributionFlowButtonsProps = {
  goNext?: () => Promise<unknown>;
  goBack?: () => unknown;
  step?: { name: string };
  prevStep?: { name: string };
  nextStep?: { name: string };
  isValidating?: boolean;
  paypalButtonProps?: Record<string, unknown>;
  currency?: string;
  disabled?: boolean;
  tier?: Record<string, unknown>;
  stepDetails?: Record<string, unknown>;
  stepSummary?: Record<string, unknown>;
  showPlatformTip?: boolean;
  hostSlug?: string;
};

class ContributionFlowButtons extends React.Component<ContributionFlowButtonsProps> {
  state = { isLoadingNext: false };

  goNext = async e => {
    e.preventDefault();
    if (this.props.goNext) {
      this.setState({ isLoadingNext: true }, async () => {
        await this.props.goNext();
        this.setState({ isLoadingNext: false });
      });
    }

    if (this.props.step.name === 'details') {
      track(AnalyticsEvent.CONTRIBUTION_DETAILS_STEP_COMPLETED, {
        props: {
          [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_VARIANT]: this.props.stepDetails?.isNewPlatformTip
            ? 'new'
            : 'old',
          [AnalyticsProperty.CONTRIBUTION_PLATFORM_TIP_ENABLED]: Boolean(this.props.showPlatformTip),
          [AnalyticsProperty.CONTRIBUTION_HOST_SLUG]: this.props.hostSlug,
        },
      });
    }
  };

  getStepLabel(step) {
    switch (step.name) {
      case STEPS.PROFILE:
        return <FormattedMessage id="ContributionFlow.YourInfo" defaultMessage="Your info" />;
      case STEPS.PAYMENT:
        return <FormattedMessage id="ContributionFlow.Payment" defaultMessage="Payment" />;
      case STEPS.DETAILS:
        return <FormattedMessage defaultMessage="Contribution" id="0LK5eg" />;
    }
  }

  render() {
    const { goBack, isValidating, nextStep, paypalButtonProps, currency, tier, stepDetails, disabled } = this.props;
    const totalAmount = getTotalAmount(stepDetails, this.props.stepSummary);
    return (
      <Flex flexWrap="wrap" justifyContent="center">
        <Fragment>
          {goBack && (
            <StyledButton
              mx={[1, null, 2]}
              minWidth={!nextStep ? 185 : 145}
              onClick={goBack}
              color="black.600"
              disabled={disabled || isValidating}
              data-cy="cf-prev-step"
              type="button"
              mt={2}
            >
              &larr;{' '}
              {this.getStepLabel(this.props.prevStep) || (
                <FormattedMessage id="Pagination.Prev" defaultMessage="Previous" />
              )}
            </StyledButton>
          )}
          {!paypalButtonProps || nextStep ? (
            <ButtonWithTextCentered
              mt={2}
              mx={[1, null, 2]}
              minWidth={!nextStep ? 185 : 145}
              buttonStyle="primary"
              onClick={this.goNext}
              disabled={disabled}
              loading={isValidating || this.state.isLoadingNext}
              data-cy="cf-next-step"
              type="submit"
            >
              {nextStep ? (
                <React.Fragment>
                  {this.getStepLabel(nextStep) || (
                    <FormattedMessage id="contribute.nextStep" defaultMessage="Next step" />
                  )}{' '}
                  &rarr;
                </React.Fragment>
              ) : tier?.type === 'TICKET' ? (
                <FormattedMessage
                  id="contribute.ticket"
                  defaultMessage="Get {quantity, select, 1 {ticket} other {tickets}}"
                  values={{ quantity: (stepDetails.quantity as number) || 1 }}
                />
              ) : totalAmount ? (
                <FormattedMessage
                  id="contribute.amount"
                  defaultMessage="Contribute {amount}"
                  values={{
                    amount: (
                      <Currency
                        value={totalAmount}
                        currency={currency as Parameters<typeof Currency>[0]['currency']}
                        precision="auto"
                      />
                    ),
                  }}
                />
              ) : (
                <FormattedMessage id="contribute.submit" defaultMessage="Make contribution" />
              )}
            </ButtonWithTextCentered>
          ) : (
            <Box mx={[1, null, 2]} minWidth={200} mt={2}>
              <PayWithPaypalButton {...paypalButtonProps} isSubmitting={isValidating || this.state.isLoadingNext} />
            </Box>
          )}
        </Fragment>
      </Flex>
    );
  }
}

export default ContributionFlowButtons;
