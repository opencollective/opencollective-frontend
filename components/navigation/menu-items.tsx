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

export const marketingTopbarItems: MenuGroupItem[] = [
  {
    label: defineMessage({ defaultMessage: 'Platform', id: 'Mmuj1R' }),
    items: [
      { label: defineMessage({ id: 'home', defaultMessage: 'Home' }), href: '/home' },
      { label: defineMessage({ defaultMessage: 'Explore', id: 'Explore' }), href: '/search' },
      {
        label: defineMessage({
          defaultMessage: 'About',
          id: 'collective.about.title',
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

export const footerItems: MenuGroupItem[] = [
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
