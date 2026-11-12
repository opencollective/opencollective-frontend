import React from 'react';
import type { IntlShape } from 'react-intl';
import { defineMessages } from 'react-intl';

import injectIntl from '@/lib/injectIntl';

import { Box, Flex } from '../Grid';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import { H4 } from '../Text';
import { withUser } from '../UserProvider';

import { NewPlatformTipContainer } from './NewPlatformTipContainer';
import type { PlatformTipOption } from './PlatformTipContainer';
import { PlatformTipContainer } from './PlatformTipContainer';
import ShareButton from './ShareButton';
import StepDetails from './StepDetails';
import StepPayment from './StepPayment';
import StepProfile from './StepProfile';
import StepSummary from './StepSummary';

type StepContainerProps = {
  intl?: IntlShape;
  LoggedInUser?: Record<string, unknown>;
  collective?: { name?: string; currency?: string; settings?: Record<string, unknown>; [key: string]: unknown };
  contributorProfiles?: Array<Record<string, unknown>>;
  tier?: { amount?: { currency?: string }; [key: string]: unknown };
  onChange?: (...args: unknown[]) => unknown;
  showPlatformTip?: boolean;
  onNewCardFormReady?: (args: unknown) => void;
  onSignInClick?: () => void;
  isEmbed?: boolean;
  disabledPaymentMethodTypes?: string[];
  isSubmitting?: boolean;
  hideCreditCardPostalCode?: boolean;
  taxes?: unknown[];
  step?: { name?: string };
  mainState?: {
    stepDetails: {
      amount?: number;
      quantity?: number;
      platformTipOption?: string;
      platformTip?: number;
      isNewPlatformTip?: boolean;
      [key: string]: unknown;
    };
    stepProfile: Record<string, unknown> & { contributorRejectedCategories?: string[] };
    stepSummary: Record<string, unknown>;
    stepPayment: Record<string, unknown>;
  };
};

class ContributionFlowStepContainer extends React.Component<StepContainerProps> {
  constructor(props: StepContainerProps) {
    super(props);
    this.headerMessages = defineMessages({
      details: { id: 'NewContributionFlow.ContributionDetailsTitle', defaultMessage: 'Contribution details' },
      profile: { id: 'contribute.step.contributeAs', defaultMessage: 'Contribute as' },
      'profile.guest': { id: 'NewContributionFlow.step.contributeAsGuest', defaultMessage: 'Contribute as a guest' },
      payment: { id: 'NewContributionFlow.ChoosePaymentMethod', defaultMessage: 'Choose payment method' },
      summary: { id: 'Summary', defaultMessage: 'Summary' },
      blockedContributor: {
        id: 'NewContributionFlow.BlockedContributor.Header',
        defaultMessage: 'Unable to contribute',
      },
    });
  }

  headerMessages: Record<string, { id: string; defaultMessage: string }>;

  renderHeader = (step, LoggedInUser) => {
    const { intl } = this.props;
    if (step === 'profile' && !LoggedInUser) {
      return intl.formatMessage(this.headerMessages[`profile.guest`]);
    } else if (step === 'payment' && this.props.mainState.stepProfile.contributorRejectedCategories) {
      return intl.formatMessage(this.headerMessages.blockedContributor);
    } else if (this.headerMessages[step]) {
      return intl.formatMessage(this.headerMessages[step]);
    } else {
      return step;
    }
  };

  renderStep = step => {
    const { collective, mainState, tier, isEmbed, showPlatformTip } = this.props;
    const { stepProfile, stepDetails, stepSummary, stepPayment } = mainState;
    switch (step) {
      case 'details':
        return (
          <StepDetails
            collective={collective}
            tier={tier}
            onChange={this.props.onChange}
            stepDetails={stepDetails}
            showPlatformTip={showPlatformTip}
          />
        );

      case 'profile': {
        return (
          <StepProfile
            profiles={this.props.contributorProfiles}
            collective={collective}
            tier={tier}
            stepDetails={stepDetails}
            onChange={this.props.onChange}
            data={stepProfile}
            onSignInClick={this.props.onSignInClick}
            isEmbed={isEmbed}
          />
        );
      }
      case 'payment':
        return (
          <StepPayment
            collective={this.props.collective}
            showPlatformTip={this.props.showPlatformTip}
            stepDetails={this.props.mainState.stepDetails}
            stepProfile={this.props.mainState.stepProfile}
            stepSummary={this.props.mainState.stepSummary}
            onChange={this.props.onChange}
            stepPayment={stepPayment}
            onNewCardFormReady={this.props.onNewCardFormReady}
            isSubmitting={this.props.isSubmitting}
            isEmbed={isEmbed}
            disabledPaymentMethodTypes={this.props.disabledPaymentMethodTypes}
            hideCreditCardPostalCode={
              this.props.hideCreditCardPostalCode || Boolean(collective.settings?.hideCreditCardPostalCode)
            }
          />
        );
      case 'summary':
        return (
          <StepSummary
            collective={collective}
            tier={tier}
            stepProfile={stepProfile}
            stepDetails={stepDetails}
            stepPayment={stepPayment}
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
    const { LoggedInUser, step, isEmbed, showPlatformTip } = this.props;

    const { tier, collective, mainState } = this.props;
    const { stepDetails } = mainState;

    const currency = tier?.amount.currency || collective.currency;
    // Review needed: preserve the old platform tip behavior, where percentages were based on amount * quantity.
    const platformTipBaseAmount = (stepDetails.amount || 0) * (stepDetails.quantity || 1);

    return (
      <Box>
        <StyledCard p={[16, 32]} mx={[16, 'none']} borderRadius={15}>
          <Flex flexDirection="column" alignItems="center">
            {step.name !== 'checkout' && (
              <Flex width="100%" mb={3} alignItems="center">
                <Flex alignItems="center">
                  <H4 fontSize={['20px', '24px']} fontWeight={500} py={2}>
                    {this.renderHeader(step.name, LoggedInUser)}
                  </H4>
                </Flex>
                <Flex flexGrow={1} alignItems="center" justifyContent="center">
                  <StyledHr width="100%" ml={3} borderColor="black.300" />
                </Flex>
                {!isEmbed && (
                  <Box ml={2}>
                    <ShareButton />
                  </Box>
                )}
              </Flex>
            )}
            {this.renderStep(step.name)}
          </Flex>
        </StyledCard>
        {showPlatformTip &&
          (stepDetails.isNewPlatformTip ? (
            <NewPlatformTipContainer
              step={step.name}
              collectiveName={collective.name}
              amount={platformTipBaseAmount}
              currency={currency}
              selectedOption={stepDetails.platformTipOption as PlatformTipOption}
              value={stepDetails.platformTip}
              onChange={(option, value) => {
                this.props.onChange({
                  stepDetails: {
                    ...stepDetails,
                    platformTip: value,
                    platformTipOption: option,
                  },
                });
              }}
            />
          ) : (
            <PlatformTipContainer
              step={step.name}
              amount={platformTipBaseAmount}
              currency={currency}
              selectedOption={stepDetails.platformTipOption as PlatformTipOption}
              value={stepDetails.platformTip}
              onChange={(option, value) => {
                this.props.onChange({
                  stepDetails: {
                    ...stepDetails,
                    platformTip: value,
                    platformTipOption: option,
                  },
                });
              }}
            />
          ))}
      </Box>
    );
  }
}

export default injectIntl(withUser(ContributionFlowStepContainer));
