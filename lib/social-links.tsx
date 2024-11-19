import React from 'react';
import { Discord } from '@styled-icons/fa-brands/Discord';
import { Discourse } from '@styled-icons/fa-brands/Discourse';
import { Mastodon } from '@styled-icons/fa-brands/Mastodon';
import { Meetup } from '@styled-icons/fa-brands/Meetup';
import { Tiktok } from '@styled-icons/fa-brands/Tiktok';
import { Tumblr } from '@styled-icons/fa-brands/Tumblr';
import { Facebook } from '@styled-icons/feather/Facebook';
import { Github } from '@styled-icons/feather/Github';
import { Gitlab } from '@styled-icons/feather/Gitlab';
import { Globe } from '@styled-icons/feather/Globe';
import { Instagram } from '@styled-icons/feather/Instagram';
import { Linkedin } from '@styled-icons/feather/Linkedin';
import { Slack } from '@styled-icons/feather/Slack';
import { Twitch } from '@styled-icons/feather/Twitch';
import { Twitter } from '@styled-icons/feather/Twitter';
import { Youtube } from '@styled-icons/feather/Youtube';
import { Pixelfed } from '@styled-icons/remix-line/Pixelfed';

import { SocialLinkType } from './graphql/types/v2/graphql';

const SocialLinkIcon: Record<SocialLinkType, typeof Discord | React.FunctionComponent<{ size: number }>> = {
  [SocialLinkType.DISCORD]: Discord,
  [SocialLinkType.DISCOURSE]: Discourse,
  [SocialLinkType.FACEBOOK]: Facebook,
  [SocialLinkType.GHOST]: Globe,
  [SocialLinkType.GIT]: Globe,
  [SocialLinkType.GITHUB]: Github,
  [SocialLinkType.GITLAB]: Gitlab,
  [SocialLinkType.INSTAGRAM]: Instagram,
  [SocialLinkType.LINKEDIN]: Linkedin,
  [SocialLinkType.MASTODON]: Mastodon,
  [SocialLinkType.MATTERMOST]: Globe,
  [SocialLinkType.MEETUP]: Meetup,
  [SocialLinkType.PEERTUBE]: Globe,
  [SocialLinkType.PIXELFED]: Pixelfed,
  [SocialLinkType.SLACK]: Slack,
  [SocialLinkType.TIKTOK]: Tiktok,
  [SocialLinkType.TUMBLR]: Tumblr,
  [SocialLinkType.TWITCH]: Twitch,
  [SocialLinkType.TWITTER]: Twitter,
  [SocialLinkType.WEBSITE]: Globe,
  [SocialLinkType.YOUTUBE]: Youtube,
};

export const SocialLinkLabel: Record<SocialLinkType, string> = {
  [SocialLinkType.DISCORD]: 'Discord',
  [SocialLinkType.DISCOURSE]: 'Discourse',
  [SocialLinkType.FACEBOOK]: 'Facebook',
  [SocialLinkType.GHOST]: 'Ghost',
  [SocialLinkType.GIT]: 'Git Repository',
  [SocialLinkType.GITHUB]: 'GitHub',
  [SocialLinkType.GITLAB]: 'GitLab',
  [SocialLinkType.INSTAGRAM]: 'Instagram',
  [SocialLinkType.LINKEDIN]: 'LinkedIn',
  [SocialLinkType.MASTODON]: 'Mastodon',
  [SocialLinkType.MATTERMOST]: 'Mattermost',
  [SocialLinkType.MEETUP]: 'Meetup',
  [SocialLinkType.PEERTUBE]: 'PeerTube',
  [SocialLinkType.PIXELFED]: 'Pixelfed',
  [SocialLinkType.SLACK]: 'Slack',
  [SocialLinkType.TIKTOK]: 'TikTok',
  [SocialLinkType.TUMBLR]: 'Tumblr',
  [SocialLinkType.TWITCH]: 'Twitch',
  [SocialLinkType.TWITTER]: 'Twitter',
  [SocialLinkType.WEBSITE]: 'Website',
  [SocialLinkType.YOUTUBE]: 'YouTube',
};

export function iconForSocialLinkType(type: SocialLinkType) {
  return SocialLinkIcon[type] || Globe;
}
