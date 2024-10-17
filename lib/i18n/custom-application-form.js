import { defineMessages } from 'react-intl';

export const i18nLabels = defineMessages({
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
    defaultMessage: 'Set your profile URL',
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
    defaultMessage: 'What does your initiative do? (Please describe how you plan to use raised funds)',
  },
  missionImpactExplanation: {
    id: 'OCFHostApplication.missionImpactExplanation.label',
    defaultMessage: 'Please explain how your initiative furthers one or more of our mission impact areas:',
  },
  websiteAndSocialLinks: {
    id: 'OCFHostApplication.websiteAndSocialLinks.label',
    defaultMessage: 'Website and / or social media links:',
  },
  repositoryUrl: {
    id: 'HostApplication.repositoryUrl.label',
    defaultMessage: 'Repository URL',
  },
  nameLabel: { id: 'createCollective.form.nameLabel', defaultMessage: 'Collective name' },
  suggestedLabel: { id: 'createCollective.form.suggestedLabel', defaultMessage: 'Suggested' },
  descriptionLabel: {
    id: 'createCollective.form.descriptionLabel',
    defaultMessage: 'What does your Collective do?',
  },
  tagsLabel: { id: 'Tags', defaultMessage: 'Tags' },
  descriptionHint: {
    id: 'createCollective.form.descriptionHint',
    defaultMessage: 'Write a short description (150 characters max)',
  },
  descriptionPlaceholder: {
    id: 'create.collective.placeholder',
    defaultMessage: 'Making the world a better place',
  },
  errorSlugHyphen: {
    id: 'createCollective.form.error.slug.hyphen',
    defaultMessage: 'Collective handle cannot start or end with a hyphen',
  },
  repositoryLicense: {
    id: 'HostApplication.form.license',
    defaultMessage: 'License',
  },
  tellUsMoreLabel: {
    id: 'HostApplication.form.tellUsMoreLabel',
    defaultMessage: "Tell us a little about your project, what you're working on and what you need from us.",
  },
  tellUsMorePlaceholder: {
    id: 'HostApplication.form.tellUsMorePlaceHolder',
    defaultMessage: 'Please include all the info you think is valuable of your Collective',
  },
  tellUsMoreHelpText: {
    id: 'HostApplication.form.tellUsMoreHelpText',
    defaultMessage: 'We want to know more about you and how we can help you.',
  },
  linksToPreviousEvents: {
    id: 'HostApplication.form.linksToPreviousEvents',
    defaultMessage: 'Links to previous events (if any)',
  },
  linksToPreviousEventsPlaceholder: {
    id: 'HostApplication.form.linksToPreviousEventsPlaceholder',
    defaultMessage: 'Enter URL of previous events.',
  },
  linksToPreviousEventsHelpText: {
    id: 'HostApplication.form.linksToPreviousEventsHelpText',
    defaultMessage:
      'YouTube, Discord, Disqus, Meetup, Eventbrite events etc are all welcome. We just want to understand your community presence.',
  },
  amountOfMembers: {
    id: 'HostApplication.form.amountOfMembers',
    defaultMessage: 'How many members do you have?',
  },
  extraLicenseInfo: {
    id: 'HostApplication.form.extraLicenseInfo',
    defaultMessage: 'Extra information about your license(s)',
  },
  extraLicenseInfoHelpText: {
    id: 'HostApplication.form.extraLicenseInfoHelpText',
    defaultMessage: 'If your license is unrecognized or have more than one license, add information here',
  },
  publicInformation: {
    id: 'HostApplication.form.publicInformation',
    defaultMessage:
      'This information is public. Please do not add any personal information such as names or addresses in this field.',
  },
  aboutYourCommunityTitle: {
    id: 'HostApplication.form.aboutYourCommunity',
    defaultMessage: 'About your Community {optional}',
  },
  aboutYourCommunitySubtitle: {
    id: 'HostApplication.form.aboutYourCommunity.subtitle',
    defaultMessage:
      'If applicable, please share information about your community and your events so we can properly consider your application.',
  },
  aboutYourCodeTitle: {
    id: 'HostApplication.form.code',
    defaultMessage: 'About your Code {optional}',
  },
  aboutYourCodeSubtitle: {
    id: 'HostApplication.form.code.subtitle',
    defaultMessage:
      "If a codebase is central to your community's work please share information about your code and license so we can properly consider your application.",
  },
});

export const i18nCustomApplicationFormLabel = (intl, name) => {
  return i18nLabels[name] ? intl.formatMessage(i18nLabels[name]) : name;
};
