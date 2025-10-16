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
    label: defineMessage({ defaultMessage: 'Platform', id: 'Mmuj1R' }),
    items: [
      { label: defineMessage({ id: 'home', defaultMessage: 'Home' }), href: '/home' },
      { label: defineMessage({ defaultMessage: 'Explore', id: '7JlauX' }), href: '/search' },
      {
        label: defineMessage({
          defaultMessage: 'About',
          id: 'g5pX+a',
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
        href: '/solutions',
      },
      {
        label: defineMessage({
          defaultMessage: 'For Collectives',
          id: 'pricing.forCollective',
        }),
        href: '/collectives',
      },
      {
        label: defineMessage({
          defaultMessage: 'Pricing',
          id: '5Wwopw',
        }),
        href: '/pricing',
      },
    ],
  },

  {
    label: defineMessage({ defaultMessage: 'Resources', id: '7oFrM6' }),
    items: [
      {
        label: defineMessage({ defaultMessage: 'Help & Support', id: 'Uf3+S6' }),
        href: '/help',
      },
      {
        label: defineMessage({ defaultMessage: 'Documentation', id: 'isGKnz' }),
        href: 'https://documentation.opencollective.com',
      },
      {
        label: defineMessage({
          defaultMessage: 'Discord community',
          id: 'x8s10c',
        }),
        href: 'https://discord.opencollective.com/',
      },
    ],
  },
];

export const footerItems: Item[] = [
  ...marketingTopbarItems,
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
