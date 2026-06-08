import React from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import useClipboard from '../lib/hooks/useClipboard';
import { cn } from '../lib/utils';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import { useToast } from './ui/useToast';

type CopyIDProps = {
  children?: React.ReactNode;
  value?: React.ReactNode;
  tooltipLabel?: React.ReactNode;
  Icon?: React.ReactNode;
  className?: string;
  stopEventPropagation?: boolean;
  toastOnCopy?: boolean;
};

export const CopyID = ({
  children = null,
  value,
  tooltipLabel = <FormattedMessage defaultMessage="Copy ID" id="wtLjP6" />,
  Icon = <Copy className="shrink-0 select-none" size={12} />,
  className = 'inline-flex min-h-5 w-full cursor-pointer select-text items-center gap-1 rounded-sm bg-slate-50 px-1 text-left font-mono text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground',
  stopEventPropagation = false,
  toastOnCopy = false,
}: CopyIDProps) => {
  const { isCopied, copy } = useClipboard();
  const { toast } = useToast();

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        <button
          tabIndex={-1}
          onClick={e => {
            e.preventDefault(); // Prevent tooltip from closing when copying
            copy(value ?? children);
            if (toastOnCopy) {
              toast({
                title: <FormattedMessage id="Clipboard.Copied" defaultMessage="Copied!" />,
              });
            }
            if (stopEventPropagation) {
              e.stopPropagation();
            }
          }}
          className={className}
        >
          {children && <div className="shrink truncate">{children}</div>}
          {Icon}
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

type CopyIDDropdownItem = {
  key?: string | number;
  name?: React.ReactNode;
  label?: React.ReactNode;
  tooltipLabel?: React.ReactNode;
  value: string;
};

export const CopyIDDropdown = ({
  children = null,
  value = null,
  ids = [],
  tooltipLabel = <FormattedMessage defaultMessage="Copy ID" id="wtLjP6" />,
  Icon = <Copy className="shrink-0 select-none" size={12} />,
  className = 'inline-flex min-h-5 w-full cursor-pointer select-text items-center gap-1 rounded-sm bg-slate-50 px-1 text-left font-mono text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground',
  stopEventPropagation = false,
  toastOnCopy = false,
}: CopyIDProps & { ids?: CopyIDDropdownItem[] }) => {
  const resolvedIds = ids?.length
    ? ids
    : value || children
      ? [
          {
            value: `${value ?? children}`,
            label: children ?? value,
          },
        ]
      : [];

  if (!resolvedIds.length) {
    return null;
  }

  const primaryId = resolvedIds[0];
  const visibleLabel = children ?? resolvedIds[0]?.label ?? resolvedIds[0]?.value;
  if (resolvedIds.length === 1) {
    return (
      <CopyID
        value={primaryId.value}
        tooltipLabel={primaryId.tooltipLabel ?? tooltipLabel}
        Icon={Icon}
        className={className}
        stopEventPropagation={stopEventPropagation}
        toastOnCopy={toastOnCopy}
      >
        {visibleLabel}
      </CopyID>
    );
  }

  return (
    <DropdownMenu>
      <div className={cn(className, 'gap-0 overflow-hidden p-0')}>
        <CopyID
          value={primaryId.value}
          tooltipLabel={primaryId.tooltipLabel ?? tooltipLabel}
          Icon={Icon}
          className="inline-flex min-h-5 min-w-0 flex-1 items-center gap-1 rounded-none bg-transparent px-1 text-left font-mono text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
          stopEventPropagation={stopEventPropagation}
          toastOnCopy={toastOnCopy}
        >
          {visibleLabel}
        </CopyID>
        <DropdownMenuTrigger asChild>
          <button
            tabIndex={-1}
            className="inline-flex min-h-5 shrink-0 items-center rounded-none bg-transparent px-1 text-muted-foreground transition-colors hover:bg-slate-100 hover:text-foreground"
            onClick={e => {
              if (stopEventPropagation) {
                e.stopPropagation();
              }
            }}
          >
            <ChevronDown className="shrink-0 select-none" size={12} />
          </button>
        </DropdownMenuTrigger>
      </div>
      <DropdownMenuContent align="start" className="min-w-[220px]">
        {resolvedIds.map((id: CopyIDDropdownItem, index: number) => (
          <DropdownMenuItem
            asChild
            key={id.key ?? id.value ?? index}
            onClick={e => {
              if (stopEventPropagation) {
                e.stopPropagation();
              }
            }}
          >
            <CopyID
              value={id.value}
              tooltipLabel={id.tooltipLabel ?? tooltipLabel}
              className="inline-flex min-h-7 w-full cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1 text-left font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              stopEventPropagation={stopEventPropagation}
              toastOnCopy={toastOnCopy}
            >
              <div className="flex min-w-0 flex-col items-start gap-0.5">
                {id.name && <span className="font-sans text-[11px] text-muted-foreground">{id.name}</span>}
                <span className="truncate">{id.label ?? id.value}</span>
              </div>
            </CopyID>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
