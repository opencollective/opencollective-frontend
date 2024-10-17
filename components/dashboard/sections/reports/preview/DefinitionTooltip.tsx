import React from 'react';

import { cn } from '../../../../../lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../ui/Tooltip';

interface Props extends React.ComponentPropsWithoutRef<'span'> {
  definition: React.ReactNode;
}

export function DefinitionTooltip({ children, className, definition }: Props) {
  return (
    <Tooltip>
      <TooltipTrigger className="inline cursor-help break-before-auto break-words text-left" asChild>
        <span
          className={cn(
            'underline decoration-slate-300 decoration-dashed underline-offset-2 transition-colors hover:decoration-slate-400',
            className,
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-96 font-normal tracking-normal">{definition}</TooltipContent>
    </Tooltip>
  );
}
