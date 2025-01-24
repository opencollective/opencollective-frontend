import React from 'react';

import type { SocialLink } from '../../lib/graphql/types/v2/schema';
import { iconForSocialLinkType } from '../../lib/social-links';

import Link from '../Link';

type HeroSocialLinksProps = {
  socialLinks: SocialLink[];
};

export default function HeroSocialLinks({ socialLinks }: HeroSocialLinksProps) {
  return (
    <div className="flex justify-center gap-1">
      {socialLinks.map((socialLink, index) => {
        const Icon = iconForSocialLinkType(socialLink.type);
        return (
          <Link
            key={socialLink.type + socialLink.url}
            data-cy={`social-link-${index}`}
            href={socialLink.url}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-primary/10"
          >
            <Icon size={16} />
          </Link>
        );
      })}
    </div>
  );
}
