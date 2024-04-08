import React from 'react';
import { TooltipContentProps } from '@radix-ui/react-tooltip';
import { InfoIcon } from 'lucide-react';

import { cn } from '../lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

export function InfoTooltipIcon({
  children,
  className,
  contentClassname,
  size = 16,
  side,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassname?: string;
  size?: number;
  side?: TooltipContentProps['side'];
}) {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger className="cursor-help" onClick={e => e.preventDefault()} asChild>
        <InfoIcon size={size} className={cn('text-muted-foreground', className)} />
      </TooltipTrigger>
      <TooltipContent
        side={side}
        className={cn('max-w-xs text-left', contentClassname)}
        onPointerDownOutside={e => e.preventDefault()}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
