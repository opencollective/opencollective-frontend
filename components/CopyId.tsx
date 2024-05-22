import React from 'react';
import { Check, Copy } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useClipboard from '../lib/hooks/useClipboard';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';

export const CopyID = ({
  children,
  value,
  tooltipLabel = <FormattedMessage defaultMessage="Copy ID" id="wtLjP6" />,
}) => {
  const { isCopied, copy } = useClipboard();

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <button
          tabIndex={-1}
          onClick={e => {
            e.preventDefault(); // Prevent tooltip from closing when copying
            copy(value ?? children);
          }}
          className="inline-flex w-full cursor-pointer select-text items-center gap-1 rounded-sm bg-slate-50 px-1 text-left font-mono text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
        >
          <div className="shrink truncate">{children}</div>
          <Copy className="shrink-0 select-none" size={12} />
        </button>
      </TooltipTrigger>
      <TooltipContent
        onPointerDownOutside={e => {
          e.preventDefault(); // Prevent tooltip from closing when copying
        }}
      >
        {isCopied ? (
          <div className="flex items-center gap-1">
            <Check size={16} />
            <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />
          </div>
        ) : (
          tooltipLabel
        )}
      </TooltipContent>
    </Tooltip>
  );
};
