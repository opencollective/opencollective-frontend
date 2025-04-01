import { ProfileMenuIcons } from '@/components/navigation/Icons';

const env = process.env.OC_ENV || process.env.NODE_ENV || 'development';

type WhitelabelProvider = {
  slug: string;
  domain: string;
  logo: string;
  name: string;
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
    logo: '/static/images/logotype-ofi-collective.svg',
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
    logo: 'https://oscollective.org/wp-content/uploads/2024/02/cropped-OSC-Logo_1_transparency.png',
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
    logo: '/static/images/opencollectivelogo-footer-n.svg',
  });
}

const WHITELABEL_DOMAINS = WHITELABEL_PROVIDERS.map(provider => provider.domain);

export { WHITELABEL_PROVIDERS, WHITELABEL_DOMAINS };
