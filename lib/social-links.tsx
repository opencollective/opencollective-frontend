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
  [SocialLinkType.BLUESKY]: (props: { size: number }) => (
    <svg
      width={props.size}
      height={props.size}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 576 512"
      stroke="none"
      fill="currentcolor"
    >
      {/* !Font Awesome Free 6.7.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
      <path d="M123.6 34.5c66.4 50.1 137.9 151.5 164.2 206C314 186 385.5 84.5 452 34.5c48-36.1 125.6-64.1 125.6 24.9c0 17.8-10.1 149.2-16.1 170.5c-20.7 74.2-96.1 93.1-163.1 81.6c117.2 20 147 86.3 82.6 152.6C358.7 590 305.2 432.5 291.5 392.1c-2.5-7.5-3.7-10.9-3.7-7.9c0-3.1-1.2 .4-3.7 7.9C270.4 432.5 216.9 590 94.6 464.1C30.2 397.8 60 331.5 177.2 311.5C110.2 322.9 34.8 304 14.1 229.8C8.1 208.5-2 77.1-2 59.3c0-88.9 77.7-61 125.6-24.9z" />
    </svg>
  ),
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
  [SocialLinkType.THREADS]: (props: { size: number }) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 448 512"
      width={props.size}
      height={props.size}
      stroke="none"
      fill="currentcolor"
    >
      {/* !Font Awesome Free 6.7.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2024 Fonticons, Inc. */}
      <path d="M331.5 235.7c2.2 .9 4.2 1.9 6.3 2.8c29.2 14.1 50.6 35.2 61.8 61.4c15.7 36.5 17.2 95.8-30.3 143.2c-36.2 36.2-80.3 52.5-142.6 53h-.3c-70.2-.5-124.1-24.1-160.4-70.2c-32.3-41-48.9-98.1-49.5-169.6V256v-.2C17 184.3 33.6 127.2 65.9 86.2C102.2 40.1 156.2 16.5 226.4 16h.3c70.3 .5 124.9 24 162.3 69.9c18.4 22.7 32 50 40.6 81.7l-40.4 10.8c-7.1-25.8-17.8-47.8-32.2-65.4c-29.2-35.8-73-54.2-130.5-54.6c-57 .5-100.1 18.8-128.2 54.4C72.1 146.1 58.5 194.3 58 256c.5 61.7 14.1 109.9 40.3 143.3c28 35.6 71.2 53.9 128.2 54.4c51.4-.4 85.4-12.6 113.7-40.9c32.3-32.2 31.7-71.8 21.4-95.9c-6.1-14.2-17.1-26-31.9-34.9c-3.7 26.9-11.8 48.3-24.7 64.8c-17.1 21.8-41.4 33.6-72.7 35.3c-23.6 1.3-46.3-4.4-63.9-16c-20.8-13.8-33-34.8-34.3-59.3c-2.5-48.3 35.7-83 95.2-86.4c21.1-1.2 40.9-.3 59.2 2.8c-2.4-14.8-7.3-26.6-14.6-35.2c-10-11.7-25.6-17.7-46.2-17.8H227c-16.6 0-39 4.6-53.3 26.3l-34.4-23.6c19.2-29.1 50.3-45.1 87.8-45.1h.8c62.6 .4 99.9 39.5 103.7 107.7l-.2 .2zm-156 68.8c1.3 25.1 28.4 36.8 54.6 35.3c25.6-1.4 54.6-11.4 59.5-73.2c-13.2-2.9-27.8-4.4-43.4-4.4c-4.8 0-9.6 .1-14.4 .4c-42.9 2.4-57.2 23.2-56.2 41.8l-.1 .1z" />
    </svg>
  ),
  [SocialLinkType.TIKTOK]: Tiktok,
  [SocialLinkType.TUMBLR]: Tumblr,
  [SocialLinkType.TWITCH]: Twitch,
  [SocialLinkType.TWITTER]: Twitter,
  [SocialLinkType.WEBSITE]: Globe,
  [SocialLinkType.YOUTUBE]: Youtube,
};

export const SocialLinkLabel: Record<SocialLinkType, string> = {
  [SocialLinkType.BLUESKY]: 'BlueSky',
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
  [SocialLinkType.THREADS]: 'Threads',
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
