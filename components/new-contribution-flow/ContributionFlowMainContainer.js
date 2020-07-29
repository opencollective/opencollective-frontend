import React from 'react';
import PropTypes from 'prop-types';
import { get, uniqBy } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

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
      stepProfile: PropTypes.object,
    }),
    contributeAs: PropTypes.object,
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
      return this.props.mainState.stepDetails?.interval
        ? this.props.intl.formatMessage(this.headerMessages[`profile.guest.recurrent`])
        : this.props.intl.formatMessage(this.headerMessages[`profile.guest`]);
    } else if (this.headerMessages[step]) {
      return this.props.intl.formatMessage(this.headerMessages[step]);
    } else {
      return step;
    }
  };

  getLoggedInUserDefaultContributeProfile() {
    if (this.props.contributeAs) {
      const otherProfiles = this.getOtherProfiles();
      const contributorProfile = otherProfiles.find(profile => profile.slug === this.props.contributeAs);
      if (contributorProfile) {
        return contributorProfile;
      }
    }
    if (get(this.props.mainState, 'stepProfile')) {
      return this.props.mainState.stepProfile;
    }
    if (this.props.LoggedInUser) {
      return this.getPersonalProfile();
    }
  }

  /** Returns logged-in user profile */
  getPersonalProfile() {
    const { LoggedInUser } = this.props;
    if (!LoggedInUser) {
      return {};
    }

    return { email: LoggedInUser.email, image: LoggedInUser.image, ...LoggedInUser.collective };
  }

  /** Return an array of any other associated profile the user might control */
  getOtherProfiles() {
    const { LoggedInUser, collective } = this.props;
    if (!LoggedInUser) {
      return [];
    }

    return LoggedInUser.memberOf
      .filter(
        m =>
          m.role === 'ADMIN' &&
          m.collective.id !== collective.id &&
          m.collective.type !== 'EVENT' &&
          m.collective.type !== 'PROJECT',
      )
      .map(({ collective }) => {
        return collective;
      });
  }

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
      case 'profile': {
        const personalProfile = this.getPersonalProfile();
        const otherProfiles = this.getOtherProfiles();
        const defaultSelectedProfile = this.getLoggedInUserDefaultContributeProfile();
        const options = uniqBy([personalProfile, ...otherProfiles], 'id');
        return (
          <StepProfile
            collective={this.props.collective}
            stepDetails={this.props.mainState.stepDetails}
            profiles={options}
            defaultSelectedProfile={defaultSelectedProfile}
            onChange={this.props.onChange}
            data={this.props.mainState.stepProfile}
            canUseIncognito={
              this.props.collective.type !== CollectiveType.EVENT &&
              (!this.props.tier || this.props.tier.type !== 'TICKET')
            }
          />
        );
      }
      case 'payment':
        return <StepPayment collective={this.props.collective} />;
    }
  };

  render() {
    const { LoggedInUser, step } = this.props;

    return (
      <StyledCard p={32} borderRadius={15}>
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
