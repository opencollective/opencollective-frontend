import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { Flex } from '../../components/Grid';
import StyledButton from '../../components/StyledButton';

class NewContributionFlowButtons extends React.Component {
  static propTypes = {
    goNext: PropTypes.func,
    goBack: PropTypes.func,
    step: PropTypes.shape({ name: PropTypes.string }),
    prevStep: PropTypes.shape({ name: PropTypes.string }),
    nextStep: PropTypes.shape({ name: PropTypes.string }),
    isRecurringContributionLoggedOut: PropTypes.bool,
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
    const { goBack, goNext } = this.props;

    return (
      <Flex justifyContent={'center'} mt={3}>
        <Fragment>
          {goBack && (
            <StyledButton onClick={goBack} color="black.600">
              &larr; <FormattedMessage id="Pagination.Prev" defaultMessage="Previous" />
            </StyledButton>
          )}
          <StyledButton ml={17} buttonStyle="primary" onClick={goNext} disabled={!goNext}>
            {this.getNextButtonLabel()} &rarr;
          </StyledButton>
        </Fragment>
      </Flex>
    );
  }
}

export default NewContributionFlowButtons;
