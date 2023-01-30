import React from 'react';
import { Discord, Mastodon, Meetup, Tumblr } from '@styled-icons/fa-brands';
import { Facebook, Github, Gitlab, Globe, Instagram, Linkedin, Slack, Twitter, Youtube } from '@styled-icons/feather';

import { SocialLink, SocialLinkType } from '../../../lib/graphql/types/v2/graphql';

import StyledLink from '../../StyledLink';
import StyledRoundButton from '../../StyledRoundButton';

function iconForSocialLinkType(type: SocialLinkType) {
  switch (type) {
    case SocialLinkType.DISCORD:
      return Discord;
    case SocialLinkType.FACEBOOK:
      return Facebook;
    case SocialLinkType.GITHUB:
      return Github;
    case SocialLinkType.GITLAB:
      return Gitlab;
    case SocialLinkType.INSTAGRAM:
      return Instagram;
    case SocialLinkType.MASTODON:
      return Mastodon;
    case SocialLinkType.MATTERMOST:
      return Globe;
    case SocialLinkType.WEBSITE:
      return Globe;
    case SocialLinkType.TWITTER:
      return Twitter;
    case SocialLinkType.YOUTUBE:
      return Youtube;
    case SocialLinkType.TUMBLR:
      return Tumblr;
    case SocialLinkType.MEETUP:
      return Meetup;
    case SocialLinkType.SLACK:
      return Slack;
    case SocialLinkType.LINKEDIN:
      return Linkedin;
    default:
      return Globe;
  }
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
