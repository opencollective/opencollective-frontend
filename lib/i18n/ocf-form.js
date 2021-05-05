import { defineMessages } from 'react-intl';

const i18nLabels = defineMessages({
  location: {
    id: 'OCFHostApplication.location.label',
    defaultMessage: 'Your Location',
  },
  name: {
    id: 'OCFHostApplication.name.label',
    defaultMessage: 'Your Name',
  },
  email: {
    id: 'Form.yourEmail',
    defaultMessage: 'Your email address',
  },
  initiativeName: {
    id: 'OCFHostApplication.initiativeName.label',
    defaultMessage: 'What is the name of your initiative?',
  },
  slug: {
    id: 'createCollective.form.slugLabel',
    defaultMessage: 'Set your URL',
  },
  initiativeDuration: {
    id: 'OCFHostApplication.initiativeDuration.label',
    defaultMessage: 'How long has your initiative been running?',
  },
  totalAmountRaised: {
    id: 'OCFHostApplication.totalAmountRaised.label',
    defaultMessage: 'If you have begun fundraising, how much money have you raised so far?',
  },
  totalAmountToBeRaised: {
    id: 'OCFHostApplication.totalAmountToBeRaised.label',
    defaultMessage: 'How much money do you want to fundraise?',
  },
  expectedFundingPartner: {
    id: 'OCFHostApplication.expectedFundingPartner.label',
    defaultMessage: 'Who do you expect to fund you?',
  },
  initiativeDescription: {
    id: 'OCFHostApplication.initiativeDescription.label',
    defaultMessage: 'What does your initiative do?',
  },
  missionImpactExplanation: {
    id: 'OCFHostApplication.missionImpactExplanation.label',
    defaultMessage: 'Please explain how your initiative furthers one or more of our mission impact areas:',
  },
  websiteAndSocialLinks: {
    id: 'OCFHostApplication.websiteAndSocialLinks.label',
    defaultMessage: 'Website and / or social media links:',
  },
});

export const i18nOCFApplicationFormLabel = (intl, name) => {
  return i18nLabels[name] ? intl.formatMessage(i18nLabels[name]) : name;
};
