import { ProfileMenuIcons } from '@/components/navigation/Icons';

const env = process.env.OC_ENV || process.env.NODE_ENV || 'development';

export type WhitelabelProvider = {
  slug: string;
  domain: string;
  name: string;
  border?: string;
  logo: {
    url: string;
    width?: number;
  };
  squareLogo?: {
    url: string;
  };
  /** List of links to display in our Menus. If the link contains an Icon, we'll also render it in the ProfileMenu */
  links?: {
    label: string;
    href: string;
    /** If provided, link is also rendered in ProfileMenu */
    icon?: string;
  }[];
};

const WHITELABEL_PROVIDERS: WhitelabelProvider[] = [
  {
    slug: 'ofico',
    domain: env === 'development' ? 'http://local.ofi:3000' : 'https://oficollective.com',
    name: 'OFiCo',
    logo: { url: '/static/images/logotype-ofi-collective.svg', width: 125 },
    links: [
      {
        label: 'Home',
        href: '/home',
        icon: ProfileMenuIcons.Home,
      },
      { label: 'About', href: 'https://documentation.opencollective.com/our-organization' },
      { label: 'Help & Support', href: '/help', icon: ProfileMenuIcons.LifeBuoy },
      { label: 'Terms of Service', href: '/tos', icon: ProfileMenuIcons.FileText },
    ],
  },
];

// Inject WHITELABEL_DOMAIN for testing purposes
if (['development', 'e2e', 'ci'].includes(env)) {
  WHITELABEL_PROVIDERS.push({
    slug: 'opencollective',
    domain: 'http://local.opencollective:3000',
    name: 'Open Collective',
    logo: { url: '/static/images/opencollectivelogo-footer-n.svg' },
  });
}

const WHITELABEL_DOMAINS = WHITELABEL_PROVIDERS.map(provider => provider.domain);

export { WHITELABEL_PROVIDERS, WHITELABEL_DOMAINS };
