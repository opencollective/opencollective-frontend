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
      { label: 'About', href: 'https://docs.opencollective.com/help/about/introduction' },
      { label: 'Help & Support', href: '/help', icon: ProfileMenuIcons.LifeBuoy },
      { label: 'Terms of Service', href: '/tos', icon: ProfileMenuIcons.FileText },
    ],
  },
  {
    slug: 'opensource',
    domain: env === 'development' ? 'http://local.osc:3000' : 'https://oscollective.org',
    name: 'Open Source Collective',
    logo: {
      url: 'https://oscollective.org/wp-content/uploads/2024/02/cropped-OSC-Logo_1_transparency.png',
      width: 200,
    },
    squareLogo: {
      url: 'https://images.opencollective.com/opensource/426badd/logo/256.png',
    },
    border: '1px solid #4b3084ff',
    links: [
      {
        icon: ProfileMenuIcons.Home,
        label: 'Home',
        href: 'https://oscollective.org/',
      },
      {
        label: 'For Projects',
        href: 'https://oscollective.org/projects/',
      },
      {
        label: 'For Donors',
        href: 'https://oscollective.org/donors/',
      },
      {
        label: 'About Us',
        href: 'https://oscollective.org/about/',
      },
      {
        icon: ProfileMenuIcons.BookOpen,
        label: 'Docs',
        href: 'https://docs.oscollective.org/',
      },
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
