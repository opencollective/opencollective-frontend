import React from 'react';
import PropTypes from 'prop-types';
import { get, uniqBy } from 'lodash';
import { defineMessages, injectIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

import { Flex } from '../Grid';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import { H4 } from '../Text';
import { withUser } from '../UserProvider';

import StepDetails from './StepDetails';
import StepPayment from './StepPayment';
import StepProfile from './StepProfile';
import StepSummary from './StepSummary';

class ContributionFlowStepContainer extends React.Component {
  static propTypes = {
    intl: PropTypes.object,
    LoggedInUser: PropTypes.object,
    collective: PropTypes.object,
    tier: PropTypes.object,
    onChange: PropTypes.func,
    showFeesOnTop: PropTypes.bool,
    onNewCardFormReady: PropTypes.func,
    defaultProfileSlug: PropTypes.string,
    taxes: PropTypes.array,
    step: PropTypes.shape({
      name: PropTypes.string,
    }),
    mainState: PropTypes.shape({
      stepDetails: PropTypes.object,
      stepProfile: PropTypes.object,
      stepSummary: PropTypes.object,
      stepPayment: PropTypes.object,
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
      summary: { id: 'Summary', defaultMessage: 'Summary' },
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
    if (this.props.defaultProfileSlug) {
      const otherProfiles = this.getOtherProfiles();
      const contributorProfile = otherProfiles.find(profile => profile.slug === this.props.defaultProfileSlug);
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
    const { collective, mainState, tier } = this.props;
    const { stepProfile, stepDetails, stepSummary, stepPayment } = mainState;
    switch (step) {
      case 'details':
        return (
          <StepDetails
            collective={collective}
            tier={tier}
            onChange={this.props.onChange}
            data={stepDetails}
            showFeesOnTop={this.props.showFeesOnTop}
          />
        );
      case 'profile': {
        const personalProfile = this.getPersonalProfile();
        const otherProfiles = this.getOtherProfiles();
        const defaultSelectedProfile = this.getLoggedInUserDefaultContributeProfile();
        const options = uniqBy([personalProfile, ...otherProfiles], 'id');
        return (
          <StepProfile
            collective={collective}
            stepDetails={stepDetails}
            profiles={options}
            defaultSelectedProfile={defaultSelectedProfile}
            onChange={this.props.onChange}
            data={stepProfile}
            canUseIncognito={collective.type !== CollectiveType.EVENT && (!tier || tier.type !== 'TICKET')}
            defaultProfileSlug={this.props.defaultProfileSlug}
          />
        );
      }
      case 'payment':
        return (
          <StepPayment
            collective={this.props.collective}
            stepDetails={this.props.mainState.stepDetails}
            stepProfile={this.props.mainState.stepProfile}
            stepSummary={this.props.mainState.stepSummary}
            onChange={this.props.onChange}
            stepPayment={stepPayment}
            onNewCardFormReady={this.props.onNewCardFormReady}
          />
        );
      case 'summary':
        return (
          <StepSummary
            collective={collective}
            tier={tier}
            stepProfile={stepProfile}
            stepDetails={stepDetails}
            data={stepSummary}
            onChange={this.props.onChange}
            taxes={this.props.taxes}
            applyTaxes
          />
        );
      default:
        return null;
    }
  };

  render() {
    const { LoggedInUser, step } = this.props;

    return (
      <StyledCard p={[16, 32]} mx={[16, 'none']} borderRadius={15}>
        <Flex flexDirection="column" alignItems="center">
          <Flex width="100%" mb={3}>
            <Flex alignItems="center">
              <H4 fontSize={['20px', '24px']} fontWeight={500} py={2}>
                {this.renderHeader(step.name, LoggedInUser)}
              </H4>
            </Flex>
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

export default injectIntl(withUser(ContributionFlowStepContainer));
