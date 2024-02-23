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

import type { SocialLink } from '../../../lib/graphql/types/v2/graphql';
import { SocialLinkType } from '../../../lib/graphql/types/v2/graphql';

import StyledLink from '../../StyledLink';
import StyledRoundButton from '../../StyledRoundButton';

const SocialLinkIcon = {
  [SocialLinkType.DISCORD]: Discord,
  [SocialLinkType.FACEBOOK]: Facebook,
  [SocialLinkType.GITHUB]: Github,
  [SocialLinkType.GITLAB]: Gitlab,
  [SocialLinkType.INSTAGRAM]: Instagram,
  [SocialLinkType.MASTODON]: Mastodon,
  [SocialLinkType.MATTERMOST]: Globe,
  [SocialLinkType.TWITTER]: Twitter,
  [SocialLinkType.YOUTUBE]: Youtube,
  [SocialLinkType.TUMBLR]: Tumblr,
  [SocialLinkType.MEETUP]: Meetup,
  [SocialLinkType.SLACK]: Slack,
  [SocialLinkType.LINKEDIN]: Linkedin,
  [SocialLinkType.GIT]: Globe,
  [SocialLinkType.WEBSITE]: Globe,
  [SocialLinkType.DISCOURSE]: Discourse,
  [SocialLinkType.PIXELFED]: Pixelfed,
  [SocialLinkType.GHOST]: Globe,
  [SocialLinkType.PEERTUBE]: Globe,
  [SocialLinkType.TIKTOK]: Tiktok,
  [SocialLinkType.TWITCH]: Twitch,
};

function iconForSocialLinkType(type: SocialLinkType) {
  return SocialLinkIcon[type] || Globe;
}

export type HeroSocialLinksProps = {
  socialLinks: SocialLink[];
  relMe?: boolean;
};

export default function HeroSocialLinks({ socialLinks, relMe }: HeroSocialLinksProps) {
  return socialLinks.map((socialLink, index) => {
    const Icon = iconForSocialLinkType(socialLink.type);
    return (
      <StyledLink
        key={socialLink.type + socialLink.url}
        data-cy={`social-link-${index}`}
        href={socialLink.url}
        openInNewTabNoFollow={!relMe}
        openInNewTabNoFollowRelMe={!!relMe}
      >
        <StyledRoundButton size={32}>
          <Icon size={12} />
        </StyledRoundButton>
      </StyledLink>
    );
  });
}
