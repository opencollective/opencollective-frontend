import React from 'react';
import type { TooltipContentProps } from '@radix-ui/react-tooltip';
import { InfoIcon } from 'lucide-react';

import { cn } from '../lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

export function InfoTooltipIcon({
  children,
  className,
  contentClassname,
  size = 16,
  side,
  sideOffset,
}: {
  children: React.ReactNode;
  className?: string;
  contentClassname?: string;
  size?: number;
  side?: TooltipContentProps['side'];
  sideOffset?: number;
}) {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger className="cursor-help" onClick={e => e.preventDefault()} asChild>
        <InfoIcon size={size} className={cn('text-muted-foreground', className)} />
      </TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={sideOffset}
        className={cn('z-[9999] max-w-xs text-left', contentClassname)}
        onPointerDownOutside={e => e.preventDefault()}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
