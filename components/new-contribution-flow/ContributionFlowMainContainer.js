import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, injectIntl } from 'react-intl';

import { Flex } from '../../components/Grid';
import StyledHr from '../../components/StyledHr';
import { H4 } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

import StyledCard from '../StyledCard';

import StepDetails from './StepDetails';
import StepPayment from './StepPayment';
import StepProfile from './StepProfile';

class NewContributionFlowMainContainer extends React.Component {
  static propTypes = {
    intl: PropTypes.object,
    LoggedInUser: PropTypes.object,
    collective: PropTypes.object,
    tier: PropTypes.object,
    onChange: PropTypes.func,
    step: PropTypes.shape({
      name: PropTypes.string,
    }),
    mainState: PropTypes.shape({
      stepDetails: PropTypes.object,
    }),
  };

  constructor(props) {
    super(props);
    this.headerMessages = defineMessages({
      details: { id: 'NewContributionFlow.ContributionDetailsTitle', defaultMessage: 'Contribution details' },
      profile: { id: 'contribute.step.contributeAs', defaultMessage: 'Contribute as' },
      'profile.guest': { id: 'NewContributionFlow.step.contributeAsGuest', defaultMessage: 'Contribute as guest' },
      'profile.guest.recurrent': {
        id: 'NewContributionFlow.step.SignUpToContribute',
        defaultMessage: 'Sign up to contribute recurrently',
      },
      payment: { id: 'NewContributionFlow.ChoosePaymentMethod', defaultMessage: 'Choose your payment method' },
    });
  }

  renderHeader = (step, LoggedInUser) => {
    if (step === 'profile' && !LoggedInUser) {
      return this.props.mainState.stepDetails?.frequency
        ? this.props.intl.formatMessage(this.headerMessages[`profile.guest.recurrent`])
        : this.props.intl.formatMessage(this.headerMessages[`profile.guest`]);
    } else if (this.headerMessages[step]) {
      return this.props.intl.formatMessage(this.headerMessages[step]);
    } else {
      return step;
    }
  };

  renderStep = step => {
    switch (step) {
      case 'details':
        return (
          <StepDetails
            collective={this.props.collective}
            tier={this.props.tier}
            onChange={this.props.onChange}
            data={this.props.mainState.stepDetails}
          />
        );
      case 'profile':
        return <StepProfile collective={this.props.collective} stepDetails={this.props.mainState.stepDetails} />;
      case 'payment':
        return <StepPayment collective={this.props.collective} />;
    }
  };

  render() {
    const { LoggedInUser, step } = this.props;

    return (
      <StyledCard p={32}>
        <Flex flexDirection="column" alignItems="center">
          <Flex width="100%" mb={3}>
            <H4 fontWeight={500} py={2}>
              {this.renderHeader(step.name, LoggedInUser)}
            </H4>
            <Flex flexGrow={1} alignItems="center" justifyContent="center">
              <StyledHr width="100%" ml={3} borderColor="black.300" />
            </Flex>
          </Flex>
          {this.renderStep(step.name)}
        </Flex>
      </StyledCard>
    );
  }
}

export default injectIntl(withUser(NewContributionFlowMainContainer));
