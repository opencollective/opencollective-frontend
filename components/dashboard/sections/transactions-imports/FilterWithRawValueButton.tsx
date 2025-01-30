import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ALargeSmall, Filter } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { Button } from '../../../ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';

export function FilterWithRawValueButton({
  SecondaryIcon = ALargeSmall,
  message,
  onClick,
}: {
  SecondaryIcon?: LucideIcon;
  message?: React.ReactNode | string;
  onClick: () => void;
}) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          className="relative inline-block h-4 w-4 p-0 text-neutral-500 hover:bg-white hover:text-neutral-700"
          onClick={onClick}
        >
          <Filter size={14} className="inline" />
          {SecondaryIcon && (
            <SecondaryIcon size={12} className="radius-50 bg-opacity-50 absolute -right-1 -bottom-1 bg-white" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{message || <FormattedMessage defaultMessage="Search term" id="UD/BhG" />}</TooltipContent>
    </Tooltip>
  );
}
