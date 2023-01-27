import React from 'react';
import { Discord, Discourse, Mastodon, Meetup, Tiktok, Tumblr } from '@styled-icons/fa-brands';
import { Facebook, Github, Gitlab, Globe, Instagram, Linkedin, Slack, Twitter, Youtube } from '@styled-icons/feather';
import { Pixelfed } from '@styled-icons/remix-line';
import { Ghost, Peertube } from '@styled-icons/simple-icons';

import { SocialLink, SocialLinkType } from '../../../lib/graphql/types/v2/graphql';

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
  [SocialLinkType.GHOST]: Ghost,
  [SocialLinkType.PEERTUBE]: Peertube,
  [SocialLinkType.TIKTOK]: Tiktok,
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
        <StyledRoundButton size={32} mr={3}>
          <Icon size={12} />
        </StyledRoundButton>
      </StyledLink>
    );
  });
}
