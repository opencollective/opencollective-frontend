import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Box, Flex } from '../Grid';
import PayWithPaypalButton from '../PayWithPaypalButton';
import StyledButton from '../StyledButton';

class NewContributionFlowButtons extends React.Component {
  static propTypes = {
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    step: PropTypes.shape({ name: PropTypes.string }),
    prevStep: PropTypes.shape({ name: PropTypes.string }),
    nextStep: PropTypes.shape({ name: PropTypes.string }),
    isRecurringContributionLoggedOut: PropTypes.bool,
    isValidating: PropTypes.bool,
    /** If provided, the PayPal button will be displayed in place of the regular submit */
    paypalButtonProps: PropTypes.object,
  };

  state = { isLoadingNext: false };

  goNext = async () => {
    if (this.props.goNext) {
      this.setState({ isLoadingNext: true });
      await this.props.goNext();
      this.setState({ isLoadingNext: false });
    }
  };

  getNextButtonLabel() {
    const { step, nextStep, isRecurringContributionLoggedOut } = this.props;
    if (!nextStep) {
      return <FormattedMessage id="contribute.submit" defaultMessage="Make contribution" />;
    } else if (step.name === 'profile' && isRecurringContributionLoggedOut) {
      return <FormattedMessage id="NewContributionFlow.JoinAndGoNext" defaultMessage="Join and go next" />;
    } else {
      return <FormattedMessage id="contribute.nextStep" defaultMessage="Next step" />;
    }
  }

  render() {
    const { goBack, goNext, isValidating, nextStep, paypalButtonProps } = this.props;
    return (
      <Flex justifyContent={'center'} mt={3}>
        <Fragment>
          {goBack && (
            <StyledButton
              minWidth={125}
              onClick={goBack}
              color="black.600"
              disabled={isValidating}
              data-cy="cf-prev-step"
            >
              &larr; <FormattedMessage id="Pagination.Prev" defaultMessage="Previous" />
            </StyledButton>
          )}
          {!paypalButtonProps ? (
            <StyledButton
              ml={17}
              minWidth={!nextStep ? 185 : 125}
              buttonStyle="primary"
              onClick={this.goNext}
              disabled={!goNext}
              loading={isValidating || this.state.isLoadingNext}
              data-cy="cf-next-step"
            >
              {this.getNextButtonLabel()} &rarr;
            </StyledButton>
          ) : (
            <Box ml={17} minWidth={200}>
              <PayWithPaypalButton {...paypalButtonProps} />
            </Box>
          )}
        </Fragment>
      </Flex>
    );
  }
}

export default NewContributionFlowButtons;
