import React from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../../ui/Tooltip';
import { cn } from '../../../../../lib/utils';

export function DefinitionTooltip({ children, className, definition }) {
  return (
    <Tooltip>
      <TooltipTrigger className="cursor-help">
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
