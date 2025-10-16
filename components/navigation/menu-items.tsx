import type { MessageDescriptor } from 'react-intl';
import { defineMessage } from 'react-intl';

type Item = {
  label: MessageDescriptor;
  href?: string;
  target?: string;
  items?: Item[];
};

export const marketingTopbarItems: Item[] = [
  {
    label: defineMessage({
      defaultMessage: 'Product',
      id: 'ContributionType.Product',
    }),
    items: [
      {
        label: defineMessage({
          defaultMessage: 'For Organizations',
          id: 'ipKxcj',
        }),
        href: '/solutions',
      },
      {
        label: defineMessage({
          defaultMessage: 'For Fiscal Hosts',
          id: 'pricing.fiscalHost',
        }),
        href: '/solutions',
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
    label: defineMessage({
      defaultMessage: 'About',
      id: 'collective.about.title',
    }),
    items: [
      {
        label: defineMessage({
          defaultMessage: 'About Us',
          id: 'ZjDH42',
        }),
        href: 'https://documentation.opencollective.com/our-organization/about',
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
    label: defineMessage({ defaultMessage: 'Help & Support', id: 'Uf3+S6' }),
    href: '/help',
  },
];

export const footerItems: Item[] = [
  {
    label: defineMessage({ id: 'home', defaultMessage: 'Home' }),
    href: '/home',
  },
  ...marketingTopbarItems,
  {
    label: defineMessage({ defaultMessage: 'Privacy policy', id: 'cPwv2c' }),
    href: '/privacypolicy',
  },
  {
    label: defineMessage({ defaultMessage: 'Terms of Service', id: '32rBNK' }),
    href: '/tos',
  },
];
