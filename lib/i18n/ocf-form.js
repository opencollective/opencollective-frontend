import { defineMessages } from 'react-intl';

const i18nLabels = defineMessages({
  location: {
    id: 'OCFHostApplication.location.',
    defaultMessage: 'Your Location',
  },
  name: {
    id: 'OCFHostApplication.name.',
    defaultMessage: 'Your Name',
  },
  email: {
    id: 'OCFHostApplication.email.',
    defaultMessage: 'Your email address',
  },
  initiativeName: {
    id: 'OCFHostApplication.initiativeName.',
    defaultMessage: 'What is the name of your initiative?',
  },
  slug: {
    id: 'OCFHostApplication.slug.',
    defaultMessage: 'What URL would you like?',
  },
  initiativeDuration: {
    id: 'OCFHostApplication.initiativeDuration.',
    defaultMessage: 'How long has your initiative been running?',
  },
  totalAmountRaised: {
    id: 'OCFHostApplication.totalAmountRaised.',
    defaultMessage: 'If you have begun fundraising, how much money have you raised so far?',
  },
  totalAmountToBeRaised: {
    id: 'OCFHostApplication.totalAmountToBeRaised.',
    defaultMessage: 'How much money do you want to fundraise?',
  },
  expectedFundingPartner: {
    id: 'OCFHostApplication.expectedFundingPartner.',
    defaultMessage: 'Who do you expect to fund you?',
  },
  initiativeDescription: {
    id: 'OCFHostApplication.initiativeDescription.',
    defaultMessage: 'What does your initiative do?',
  },
  missionImpactExplanation: {
    id: 'OCFHostApplication.missionImpactExplanation.',
    defaultMessage: 'Please explain how your initiative furthers one or more of our mission impact areas:',
  },
  websiteAndSocialLinks: {
    id: 'OCFHostApplication.websiteAndSocialLinks.',
    defaultMessage: 'Website and / or social media links:',
  },
});

export const i18nOCFApplicationFormLabel = (intl, name) => {
  return i18nLabels[name] ? intl.formatMessage(i18nLabels[name]) : name;
};
