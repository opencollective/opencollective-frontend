import React from 'react';
import { FormattedMessage } from 'react-intl';

type Item = {
  label: React.ReactNode;
  href?: string;
  items?: Item[];
};

export const landingPageItems: Item[] = [
  {
    label: <FormattedMessage defaultMessage="Solutions" id="asqGnV" />,
    items: [
      {
        label: <FormattedMessage id="pricing.forCollective" defaultMessage="For Collectives" />,
        href: '/collectives',
      },
      { label: <FormattedMessage defaultMessage="For Sponsors" id="1rESHf" />, href: '/become-a-sponsor' },
      {
        label: <FormattedMessage id="pricing.fiscalHost" defaultMessage="For Fiscal Hosts" />,
        href: '/become-a-host',
      },
    ],
  },
  {
    label: <FormattedMessage id="ContributionType.Product" defaultMessage="Product" />,
    items: [
      { label: <FormattedMessage id="menu.pricing" defaultMessage="Pricing" />, href: '/pricing' },
      { label: <FormattedMessage id="menu.howItWorks" defaultMessage="How it Works" />, href: '/how-it-works' },
      {
        label: <FormattedMessage id="editCollective.fiscalHosting" defaultMessage="Fiscal Hosting" />,
        href: '/fiscal-hosting',
      },
    ],
  },
  {
    label: <FormattedMessage id="company" defaultMessage="Company" />,
    items: [
      {
        label: <FormattedMessage id="company.blog" defaultMessage="Blog" />,
        href: 'https://blog.opencollective.com/',
      },
      {
        label: <FormattedMessage id="OC.e2c" defaultMessage="Exit to Community" />,
        href: '/e2c',
      },
      {
        label: <FormattedMessage id="collective.about.title" defaultMessage="About" />,
        href: 'https://docs.opencollective.com/help/about/introduction',
      },
    ],
  },
];

export const dashboardFooterItems: Item[] = [
  {
    label: <FormattedMessage id="home" defaultMessage="Home" />,
    href: '/home',
  },
  ...landingPageItems,
  {
    label: <FormattedMessage defaultMessage="Help & Support" id="Uf3+S6" />,
    href: '/help',
  },
  {
    label: <FormattedMessage id="menu.privacyPolicy" defaultMessage="Privacy" />,
    href: '/privacypolicy',
  },
  {
    label: <FormattedMessage id="menu.termsOfAgreement" defaultMessage="Terms" />,
    href: '/tos',
  },
];

export const regularFooterItems: Item[] = [
  {
    label: <FormattedMessage id="platform" defaultMessage="Platform" />,
    items: [
      {
        label: <FormattedMessage id="platform.explainerVideo" defaultMessage="Explainer video" />,
        href: 'https://www.youtube.com/watch?v=IBU5fSILAe8',
      },
      {
        label: <FormattedMessage id="howItWorks" defaultMessage="How it works" />,
        href: '/how-it-works',
      },
      {
        label: <FormattedMessage id="platform.useCases" defaultMessage="Use cases" />,
        href: 'https://blog.opencollective.com/tag/case-studies/',
      },
      {
        label: <FormattedMessage id="platform.signup" defaultMessage="Sign up" />,
        href: '/create-account',
      },
      {
        label: <FormattedMessage id="platform.login" defaultMessage="Log in" />,
        href: '/signin',
      },
    ],
  },
  {
    label: <FormattedMessage id="join" defaultMessage="Join" />,
    items: [
      {
        label: <FormattedMessage id="home.create" defaultMessage="Create a Collective" />,
        href: '/create',
      },
      {
        label: <FormattedMessage id="join.aboutFiscalHosting" defaultMessage="About Fiscal Hosting" />,
        href: '/fiscal-hosting',
      },
      {
        label: <FormattedMessage id="menu.discover" defaultMessage="Discover" />,
        href: '/search',
      },
      {
        label: <FormattedMessage id="join.findAFiscalHost" defaultMessage="Find a Fiscal Host" />,
        href: '/search?isHost=true',
      },
      {
        label: <FormattedMessage id="join.becomeASponsor" defaultMessage="Become a sponsor" />,
        href: '/become-a-sponsor',
      },
      {
        label: <FormattedMessage id="join.becomeAHost" defaultMessage="Become a Host" />,
        href: '/become-a-host',
      },
    ],
  },
  {
    label: <FormattedMessage id="community" defaultMessage="Community" />,
    items: [
      {
        label: <FormattedMessage id="community.openSource" defaultMessage="Open Source" />,
        href: 'https://github.com/opencollective/opencollective/issues',
      },
      {
        label: <FormattedMessage id="menu.docs" defaultMessage="Docs & Help" />,
        href: '/help',
      },
    ],
  },
  {
    label: <FormattedMessage id="company" defaultMessage="Company" />,
    items: [
      {
        label: <FormattedMessage id="collective.about.title" defaultMessage="About" />,
        href: 'https://docs.opencollective.com/help/about/introduction',
      },
      {
        label: <FormattedMessage id="company.blog" defaultMessage="Blog" />,
        href: 'https://blog.opencollective.com/',
      },
      {
        label: <FormattedMessage id="company.hiring" defaultMessage="Hiring" />,
        href: '/hiring',
      },
      {
        label: <FormattedMessage id="e2c.title" defaultMessage="Exit to Community #E2C" />,
        href: '/e2c',
      },
      {
        label: <FormattedMessage id="company.termsOfService" defaultMessage="Terms of service" />,
        href: '/tos',
      },
      {
        label: <FormattedMessage id="company.privacyPolicy" defaultMessage="Privacy Policy" />,
        href: '/privacypolicy',
      },
      {
        label: <FormattedMessage id="company.securityPolicy" defaultMessage="Security Policy" />,
        href: 'https://docs.opencollective.com/help/product/security',
      },
      {
        label: <FormattedMessage id="contactUs" defaultMessage="Contact us" />,
        href: '/contact',
      },
    ],
  },
];
