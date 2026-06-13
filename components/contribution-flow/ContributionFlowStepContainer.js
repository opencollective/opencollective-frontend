import React from 'react';
import { defineMessages, useIntl } from 'react-intl';

import useLoggedInUser from '../../lib/hooks/useLoggedInUser';

import { Box, Flex } from '../Grid';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import { H4 } from '../Text';

import { NewPlatformTipContainer } from './NewPlatformTipContainer';
import { PlatformTipContainer } from './PlatformTipContainer';
import ShareButton from './ShareButton';
import StepDetails from './StepDetails';
import StepPayment from './StepPayment';
import StepProfile from './StepProfile';
import StepSummary from './StepSummary';

const headerMessages = defineMessages({
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

const ContributionFlowStepContainer = ({
  collective,
  contributorProfiles,
  tier,
  onChange,
  showPlatformTip,
  isOscTipExperiment,
  onNewCardFormReady,
  onSignInClick,
  isEmbed,
  disabledPaymentMethodTypes,
  isSubmitting,
  hideCreditCardPostalCode,
  taxes,
  step,
  mainState,
  stepSummaryRef,
}) => {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const { stepProfile, stepDetails, stepSummary, stepPayment } = mainState;

  const renderHeader = stepName => {
    if (stepName === 'profile' && !LoggedInUser) {
      return intl.formatMessage(headerMessages['profile.guest']);
    } else if (stepName === 'payment' && stepProfile.contributorRejectedCategories) {
      return intl.formatMessage(headerMessages.blockedContributor);
    } else if (headerMessages[stepName]) {
      return intl.formatMessage(headerMessages[stepName]);
    } else {
      return stepName;
    }
  };

  const renderStep = stepName => {
    switch (stepName) {
      case 'details':
        return (
          <StepDetails
            collective={collective}
            tier={tier}
            onChange={onChange}
            stepDetails={stepDetails}
            showPlatformTip={showPlatformTip}
            isOscTipExperiment={isOscTipExperiment}
          />
        );
      case 'profile':
        return (
          <StepProfile
            profiles={contributorProfiles}
            collective={collective}
            tier={tier}
            stepDetails={stepDetails}
            onChange={onChange}
            data={stepProfile}
            onSignInClick={onSignInClick}
            isEmbed={isEmbed}
          />
        );
      case 'payment':
        return (
          <StepPayment
            collective={collective}
            stepDetails={stepDetails}
            stepProfile={stepProfile}
            stepSummary={stepSummary}
            onChange={onChange}
            stepPayment={stepPayment}
            onNewCardFormReady={onNewCardFormReady}
            isSubmitting={isSubmitting}
            isEmbed={isEmbed}
            disabledPaymentMethodTypes={disabledPaymentMethodTypes}
            hideCreditCardPostalCode={
              hideCreditCardPostalCode || Boolean(collective.settings?.hideCreditCardPostalCode)
            }
          />
        );
      case 'summary':
        return (
          <StepSummary
            ref={stepSummaryRef}
            collective={collective}
            tier={tier}
            stepProfile={stepProfile}
            stepDetails={stepDetails}
            stepPayment={stepPayment}
            data={stepSummary}
            onChange={onChange}
            taxes={taxes}
            applyTaxes
          />
        );
      default:
        return null;
    }
  };

  const currency = tier?.amount?.currency || collective.currency;
  const platformTipBaseAmount = (stepDetails.amount || 0) * (stepDetails.quantity || 1);

  return (
    <Box>
      <StyledCard p={[16, 32]} mx={[16, 'none']} borderRadius={15}>
        <Flex flexDirection="column" alignItems="center">
          {step.name !== 'checkout' && (
            <Flex width="100%" mb={3} alignItems="center">
              <Flex alignItems="center">
                <H4 fontSize={['20px', '24px']} fontWeight={500} py={2}>
                  {renderHeader(step.name)}
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
          {renderStep(step.name)}
        </Flex>
      </StyledCard>
      {showPlatformTip &&
        (stepDetails.isNewPlatformTip ? (
          <NewPlatformTipContainer
            step={step.name}
            collectiveName={collective.name}
            amount={platformTipBaseAmount}
            currency={currency}
            selectedOption={stepDetails.platformTipOption}
            value={stepDetails.platformTip}
            onChange={(option, value) => {
              onChange({
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
            selectedOption={stepDetails.platformTipOption}
            value={stepDetails.platformTip}
            onChange={(option, value) => {
              onChange({
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
};

export default ContributionFlowStepContainer;
