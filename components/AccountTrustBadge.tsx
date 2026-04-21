import React from 'react';
import type { ClassValue } from 'clsx';
import { BadgeCheck, ExternalLink } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { GraphQLV1Collective } from '@/lib/custom_typings/GraphQLV1';
import type { Host } from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import { getI18nLink } from './I18nFormatters';
import StyledLink from './StyledLink';

export const AccountTrustBadge = ({
  account,
  className,
  size = 18,
}: {
  size?: number;
  className?: ClassValue;
  account: Pick<Host | GraphQLV1Collective, 'id' | 'name' | 'isFirstPartyHost' | 'isVerified'> & {
    host?: Pick<Host | GraphQLV1Collective, 'id' | 'name' | 'isFirstPartyHost' | 'isVerified'>;
  };
}) => {
  const badgeStyles = cn('cursor-help transition-all duration-200 hover:scale-110', className);
  const isSelfHost = account.host && account.host.id === account.id;
  if (account.isFirstPartyHost || (isSelfHost && account.host.isFirstPartyHost)) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <BadgeCheck size={size} className={cn(badgeStyles, 'text-yellow-500 hover:text-yellow-600')} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs py-4 font-normal" sideOffset={4}>
          <FormattedMessage
            defaultMessage="This host is a certified member of <OficoLink>OFi Consortium</OficoLink> - Stewarding the Open Collective Platform. They meet the highest standards of financial management, compliance, and community support."
            id="gpm/lE"
            values={{
              OficoLink: getI18nLink({
                href: 'https://oficonsortium.org/',
                openInNewTab: true,
                fontWeight: 'bold',
              }),
            }}
          />
          <br />
          <StyledLink
            href="https://documentation.opencollective.com/fiscal-hosts/certified-member-badge"
            openInNewTab
            display="block"
            mt={2}
            color="blue.300"
          >
            <ExternalLink className="mr-1 inline-block" size={12} />
            <FormattedMessage defaultMessage="Learn more about certification" id="R4FCoG" />
          </StyledLink>
        </TooltipContent>
      </Tooltip>
    );
  } else if (account.isVerified || (isSelfHost && account.host.isVerified)) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <BadgeCheck size={size} className={cn(badgeStyles, 'text-blue-500 hover:text-blue-600')} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs py-4 font-normal" sideOffset={4}>
          <FormattedMessage
            defaultMessage="{name} is a Verified Account."
            id="Z7JfKX"
            values={{ name: <strong>{account.name}</strong> }}
          />
          <br />
          <StyledLink
            href="https://documentation.opencollective.com/getting-started/verification-badge"
            openInNewTab
            display="block"
            mt={2}
            color="blue.300"
          >
            <ExternalLink className="mr-1 inline-block" size={12} />
            <FormattedMessage defaultMessage="Learn more about verification" id="oVrfUg" />
          </StyledLink>
        </TooltipContent>
      </Tooltip>
    );
  } else {
    return null;
  }
};
