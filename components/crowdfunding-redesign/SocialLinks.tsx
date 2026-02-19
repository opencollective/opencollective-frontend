import React from 'react';

import type { SocialLink } from '../../lib/graphql/types/v2/graphql';
import { iconForSocialLinkType } from '../../lib/social-links';
import { cn } from '@/lib/utils';

import Link from '../Link';

type HeroSocialLinksProps = {
  socialLinks: SocialLink[];
  className?: string;
};

export default function HeroSocialLinks({ socialLinks, className }: HeroSocialLinksProps) {
  return (
    <div className="flex justify-center gap-1">
      {socialLinks.map((socialLink, index) => {
        const Icon = iconForSocialLinkType(socialLink.type);
        return (
          <Link
            key={socialLink.type + socialLink.url}
            data-cy={`social-link-${index}`}
            href={socialLink.url}
            className={cn('flex size-8 items-center justify-center rounded-full hover:bg-primary/10', className)}
          >
            <Icon size={16} />
          </Link>
        );
      })}
    </div>
  );
}
