import type { MessageDescriptor } from 'react-intl';
import { defineMessage } from 'react-intl';

interface MenuItem {
  label: MessageDescriptor;
}
interface LinkItem extends MenuItem {
  href: string;
  target?: string;
}
interface MenuGroupItem extends MenuItem {
  items: LinkItem[];
}

export const newMarketingTopbarItems: MenuGroupItem[] = [
  {
    label: defineMessage({ defaultMessage: 'Platform', id: 'platform' }),
    items: [
      { label: defineMessage({ id: 'home', defaultMessage: 'Home' }), href: '/home' },
      { label: defineMessage({ defaultMessage: 'Explore', id: 'Explore' }), href: '/search' },
      {
        label: defineMessage({
          defaultMessage: 'About',
          id: 'collective.about.title',
        }),
        href: '/about',
      },
      {
        label: defineMessage({
          defaultMessage: 'Contact',
          id: 'Contact',
        }),
        href: '/contact',
      },
    ],
  },
  {
    label: defineMessage({
      defaultMessage: 'Solutions',
      id: 'asqGnV',
    }),
    items: [
      {
        label: defineMessage({
          defaultMessage: 'For Organizations',
          id: 'X7kjxh',
        }),
        href: '/organizations',
      },
      {
        label: defineMessage({
          defaultMessage: 'For Collectives',
          id: 'pricing.forCollective',
        }),
        href: '/collectives',
      },
    ],
  },

  {
    label: defineMessage({ defaultMessage: 'Resources', id: 'c/KktL' }),
    items: [
      {
        label: defineMessage({ defaultMessage: 'Help & Support', id: 'Uf3+S6' }),
        href: '/help',
      },
      {
        label: defineMessage({ defaultMessage: 'Documentation', id: 'menu.documentation' }),
        href: 'https://documentation.opencollective.com',
      },
    ],
  },
];

export const newFooterItems: MenuGroupItem[] = [
  ...newMarketingTopbarItems,
  {
    label: defineMessage({ defaultMessage: 'Legal', id: '7oFrM6' }),
    items: [
      {
        label: defineMessage({ defaultMessage: 'Privacy policy', id: 'cPwv2c' }),
        href: '/privacypolicy',
      },
      {
        label: defineMessage({ defaultMessage: 'Terms of Service', id: '32rBNK' }),
        href: '/tos',
      },
    ],
  },
];

export const legacyTopBarItems: MenuGroupItem[] = [
  {
    label: defineMessage({ defaultMessage: 'Solutions', id: 'asqGnV' }),
    items: [
      {
        label: defineMessage({ id: 'pricing.forCollective', defaultMessage: 'For Collectives' }),
        href: '/collectives',
      },
      {
        label: defineMessage({ defaultMessage: 'For Sponsors', id: '1rESHf' }),
        href: '/become-a-sponsor',
      },
      {
        label: defineMessage({ id: 'pricing.fiscalHost', defaultMessage: 'For Fiscal Hosts' }),
        href: '/become-a-host',
      },
    ],
  },
  {
    label: defineMessage({ id: 'ContributionType.Product', defaultMessage: 'Product' }),
    items: [
      {
        label: defineMessage({ id: 'menu.pricing', defaultMessage: 'Pricing' }),
        href: '/pricing',
      },
      {
        label: defineMessage({ id: 'menu.howItWorks', defaultMessage: 'How it Works' }),
        href: '/how-it-works',
      },
      {
        label: defineMessage({ id: 'editCollective.fiscalHosting', defaultMessage: 'Fiscal Hosting' }),
        href: '/fiscal-hosting',
      },
    ],
  },
  {
    label: defineMessage({ id: 'Tags.ORGANIZATION', defaultMessage: 'Organization' }),
    items: [
      {
        label: defineMessage({ id: 'company.blog', defaultMessage: 'Blog' }),
        href: 'https://blog.opencollective.com/',
      },
      {
        label: defineMessage({ id: 'collective.about.title', defaultMessage: 'About' }),
        href: '/about',
      },
    ],
  },
];

export const legacyFooterItems: MenuGroupItem[] = [
  {
    label: defineMessage({ id: 'platform', defaultMessage: 'Platform' }),
    items: [
      {
        label: defineMessage({ id: 'platform.explainerVideo', defaultMessage: 'Explainer video' }),
        href: 'https://www.youtube.com/watch?v=IBU5fSILAe8',
      },
      {
        label: defineMessage({ id: 'howItWorks', defaultMessage: 'How it works' }),
        href: '/how-it-works',
      },
      {
        label: defineMessage({ id: 'platform.useCases', defaultMessage: 'Use cases' }),
        href: 'https://blog.opencollective.com/tag/case-studies/',
      },
      {
        label: defineMessage({ id: 'platform.signup', defaultMessage: 'Sign up' }),
        href: '/signup',
      },
      {
        label: defineMessage({ id: 'platform.login', defaultMessage: 'Log in' }),
        href: '/signin',
      },
    ],
  },
  {
    label: defineMessage({ id: 'join', defaultMessage: 'Join' }),
    items: [
      {
        label: defineMessage({ id: 'home.create', defaultMessage: 'Create a Collective' }),
        href: '/signup/collective',
      },
      {
        label: defineMessage({ id: 'join.aboutFiscalHosting', defaultMessage: 'About Fiscal Hosting' }),
        href: '/fiscal-hosting',
      },
      {
        label: defineMessage({ id: 'menu.discover', defaultMessage: 'Discover' }),
        href: '/search',
      },
      {
        label: defineMessage({ id: 'join.findAFiscalHost', defaultMessage: 'Find a Fiscal Host' }),
        href: '/search?isHost=true',
      },
      {
        label: defineMessage({ id: 'join.becomeASponsor', defaultMessage: 'Become a sponsor' }),
        href: '/become-a-sponsor',
      },
      {
        label: defineMessage({ id: 'join.becomeAHost', defaultMessage: 'Become a Host' }),
        href: '/become-a-host',
      },
    ],
  },
  {
    label: defineMessage({ id: 'community', defaultMessage: 'Community' }),
    items: [
      {
        label: defineMessage({ id: 'community.openSource', defaultMessage: 'Open Source' }),
        href: 'https://github.com/opencollective/opencollective/issues',
      },
      {
        label: defineMessage({ id: 'menu.docs', defaultMessage: 'Docs & Help' }),
        href: '/help',
      },
    ],
  },
  {
    label: defineMessage({ id: 'Tags.ORGANIZATION', defaultMessage: 'Organization' }),
    items: [
      {
        label: defineMessage({ id: 'collective.about.title', defaultMessage: 'About' }),
        href: '/about',
      },
      {
        label: defineMessage({ id: 'company.blog', defaultMessage: 'Blog' }),
        href: 'https://blog.opencollective.com/',
      },
      {
        label: defineMessage({ id: 'company.hiring', defaultMessage: 'Hiring' }),
        href: '/hiring',
      },
      {
        label: defineMessage({ id: 'company.termsOfService', defaultMessage: 'Terms of service' }),
        href: '/tos',
      },
      {
        label: defineMessage({ id: 'company.privacyPolicy', defaultMessage: 'Privacy Policy' }),
        href: '/privacypolicy',
      },
      {
        label: defineMessage({ id: 'company.securityPolicy', defaultMessage: 'Security Policy' }),
        href: 'https://documentation.opencollective.com/advanced/security-for-accounts',
      },
      {
        label: defineMessage({ id: 'contactUs', defaultMessage: 'Contact us' }),
        href: '/contact',
      },
    ],
  },
];
