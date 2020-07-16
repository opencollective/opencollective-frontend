import React from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { withRouter } from 'next/router';
import { defineMessages, injectIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../../components/Container';
import { Flex } from '../../components/Grid';
import StyledHr from '../../components/StyledHr';
import { H4 } from '../../components/Text';
import { withUser } from '../../components/UserProvider';

import StepDetails from './StepDetails';
import StepPayment from './StepPayment';
import StepProfile from './StepProfile';

const MainContributionContainer = styled(Container)`
  border-radius: 15px;
  border: 2px solid ${themeGet('colors.black.300')};
`;

class NewContributionFlowMainContainer extends React.Component {
  static propTypes = {
    collective: PropTypes.object,
    router: PropTypes.object,
    intl: PropTypes.object,
    LoggedInUser: PropTypes.object,
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
    switch (step) {
      case 'payment':
        return this.props.intl.formatMessage(this.headerMessages[step]);
      case 'details':
        return this.props.intl.formatMessage(this.headerMessages[step]);
      case 'profile':
        if (LoggedInUser) {
          return this.props.intl.formatMessage(this.headerMessages[step]);
        } else {
          return this.props.router.query.frequency
            ? this.props.intl.formatMessage(this.headerMessages[`${step}.guest.recurrent`])
            : this.props.intl.formatMessage(this.headerMessages[`${step}.guest`]);
        }
    }
  };

  renderStep = step => {
    switch (step) {
      case 'details':
        return <StepDetails collective={this.props.collective} />;
      case 'profile':
        return <StepProfile collective={this.props.collective} />;
      case 'payment':
        return <StepPayment collective={this.props.collective} />;
    }
  };

  render() {
    const { router, LoggedInUser } = this.props;
    const step = router.query.step;

    return (
      <MainContributionContainer px={3} py={2} minWidth={600}>
        <Flex flexDirection="column" alignItems="center">
          <Flex width="100%">
            <H4 fontWeight={500} py={2}>
              {this.renderHeader(step, LoggedInUser)}
            </H4>
            <Flex flexGrow={1} alignItems="center" justifyContent="center">
              <StyledHr width="100%" ml={3} />
            </Flex>
          </Flex>
          {this.renderStep(step)}
        </Flex>
      </MainContributionContainer>
    );
  }
}

export default injectIntl(withUser(withRouter(NewContributionFlowMainContainer)));
