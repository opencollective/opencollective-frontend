import React from 'react';
import { truncate } from 'lodash';

import { cn, truncateMiddle } from '../lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

/**
 * A tooltip that truncates a value if it's longer than the
 * provided length.
 */
const TruncatedTextWithTooltip = ({
  value,
  cursor = 'help',
  truncatePosition = 'start',
  length = 30,
}: {
  value: string;
  cursor?: React.CSSProperties['cursor'];
  truncatePosition?: 'start' | 'middle' | 'end';
  length?: number;
}) => {
  if (value?.length <= length) {
    return value;
  } else {
    return (
      <Tooltip>
        <TooltipTrigger className={cn(cursor && `cursor-${cursor}`)}>
          {truncatePosition === 'start'
            ? truncate(value, { length })
            : truncatePosition === 'middle'
              ? truncateMiddle(value, length)
              : '...'}
        </TooltipTrigger>
        <TooltipContent>{value}</TooltipContent>
      </Tooltip>
    );
  }
};

export default TruncatedTextWithTooltip;
