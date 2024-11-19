import React from 'react';

import type { SocialLink } from '../../../lib/graphql/types/v2/graphql';
import { iconForSocialLinkType } from '../../../lib/social-links';

import StyledLink from '../../StyledLink';
import StyledRoundButton from '../../StyledRoundButton';

type HeroSocialLinksProps = {
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
