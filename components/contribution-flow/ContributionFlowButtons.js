import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Currency from '../Currency';
import { Box, Flex } from '../Grid';
import PayWithPaypalButton from '../PayWithPaypalButton';
import StyledButton from '../StyledButton';

import { STEPS } from './constants';

class ContributionFlowButtons extends React.Component {
  static propTypes = {
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    step: PropTypes.shape({ name: PropTypes.string }),
    prevStep: PropTypes.shape({ name: PropTypes.string }),
    nextStep: PropTypes.shape({ name: PropTypes.string }),
    isValidating: PropTypes.bool,
    /** If provided, the PayPal button will be displayed in place of the regular submit */
    paypalButtonProps: PropTypes.object,
    totalAmount: PropTypes.number,
    currency: PropTypes.string,
  };

  state = { isLoadingNext: false };

  goNext = async e => {
    e.preventDefault();
    if (this.props.goNext) {
      this.setState({ isLoadingNext: true }, async () => {
        await this.props.goNext();
        this.setState({ isLoadingNext: false });
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
        return <FormattedMessage id="ContributionFlow.Contribution" defaultMessage="Contribution" />;
    }
  }

  render() {
    const { goBack, isValidating, prevStep, nextStep, paypalButtonProps, totalAmount, currency } = this.props;
    return (
      <Flex flexWrap="wrap" justifyContent="center">
        <Fragment>
          {goBack && (
            <StyledButton
              mx={[1, null, 2]}
              minWidth={!nextStep ? 185 : 145}
              onClick={goBack}
              color="black.600"
              disabled={isValidating}
              data-cy="cf-prev-step"
              type="button"
              mt={2}
            >
              &larr;{' '}
              {this.getStepLabel(prevStep) || <FormattedMessage id="Pagination.Prev" defaultMessage="Previous" />}
            </StyledButton>
          )}
          {!paypalButtonProps || nextStep ? (
            <StyledButton
              mt={2}
              mx={[1, null, 2]}
              minWidth={!nextStep ? 185 : 145}
              buttonStyle="primary"
              onClick={this.goNext}
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
              ) : totalAmount ? (
                <FormattedMessage
                  id="contribute.amount"
                  defaultMessage="Contribute {amount}"
                  values={{
                    amount: <Currency value={totalAmount} currency={currency} precision="auto" />,
                  }}
                />
              ) : (
                <FormattedMessage id="contribute.submit" defaultMessage="Make contribution" />
              )}
            </StyledButton>
          ) : (
            <Box mx={[1, null, 2]} minWidth={200} mt={2}>
              <PayWithPaypalButton {...paypalButtonProps} />
            </Box>
          )}
        </Fragment>
      </Flex>
    );
  }
}

export default ContributionFlowButtons;
