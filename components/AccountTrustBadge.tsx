import React from 'react';
import type { ClassValue } from 'clsx';
import { Award, BadgeCheck, ExternalLink } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { GraphQLV1Collective } from '@/lib/custom_typings/GraphQLV1';
import type { Host } from '@/lib/graphql/types/v2/schema';
import { cn } from '@/lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import StyledLink from './StyledLink';

export const AccountTrustBadge = ({
  account,
  className,
  size = 16,
}: {
  account: Pick<Host | GraphQLV1Collective, 'name' | 'isTrustedHost' | 'isFirstPartyHost'>;
  size: number;
  className?: ClassValue;
}) => {
  const badgeStyles = cn('transition-all duration-200 hover:scale-110', 'cursor-help', className);

  if (account.isFirstPartyHost) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <BadgeCheck size={size} className={cn(badgeStyles, 'text-yellow-500 hover:text-yellow-600')} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs py-4 font-normal" sideOffset={4}>
          <FormattedMessage
            defaultMessage="{name} is a Certified Fiscal Host that has undergone a rigorous verification process. They meet the highest standards of financial management, compliance, and community support."
            id="VtqD78"
            values={{ name: <strong>{account.name}</strong> }}
          />
          <br />
          <StyledLink href="/help/fiscal-hosts/verified-hosts" openInNewTab display="block" mt={2} color="blue.300">
            <ExternalLink className="mr-1 inline-block" size={12} />
            <FormattedMessage defaultMessage="Learn more about the certification process" id="p9jbci" />
          </StyledLink>
        </TooltipContent>
      </Tooltip>
    );
  } else if (account.isTrustedHost) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <BadgeCheck size={size} className={cn(badgeStyles, 'text-blue-500 hover:text-blue-600')} />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs py-4 font-normal" sideOffset={4}>
          <FormattedMessage
            defaultMessage="{name} is a Verified Fiscal Host."
            id="tyJxaO"
            values={{ name: <strong>{account.name}</strong> }}
          />
          <br />
          <StyledLink href="/help/fiscal-hosts/verified-hosts" openInNewTab display="block" mt={2} color="blue.300">
            <ExternalLink className="mr-1 inline-block" size={12} />
            <FormattedMessage defaultMessage="Learn more about the verification process" id="dmUJl9" />
          </StyledLink>
        </TooltipContent>
      </Tooltip>
    );
  } else {
    return null;
  }
};
