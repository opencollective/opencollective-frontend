import React from 'react';
import { AlertTriangle, CircleAlert, CircleCheck, Info } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { cn } from '@/lib/utils';

import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
import DateTime from './DateTime';
import HTMLContent from './HTMLContent';

type FiscalHostNoteLike = {
  type: 'WARNING' | 'INFO' | 'POSITIVE';
  note?: string | null;
  updatedAt?: string | null;
  updatedBy?: { name?: string | null } | null;
};

type FiscalHostNoteBadgeProps = {
  note?: FiscalHostNoteLike | null;
  className?: string;
  iconSize?: number;
  showLabel?: boolean;
};

const FiscalHostNoteAttribution = ({ note, className }: { note: FiscalHostNoteLike; className?: string }) => {
  if (!note.updatedAt && !note.updatedBy?.name) {
    return null;
  }

  return (
    <div className={cn('text-xs', className)}>
      {note.updatedBy?.name && (
        <FormattedMessage
          defaultMessage="Updated by {name}"
          id="FiscalHostNote.UpdatedBy"
          values={{ name: note.updatedBy.name }}
        />
      )}
      {note.updatedAt && (
        <span>
          {note.updatedBy?.name ? ' · ' : ''}
          <DateTime value={note.updatedAt} dateStyle="medium" />
        </span>
      )}
    </div>
  );
};

/** Tooltip showing a fiscal host note, wrapping the element that should trigger it. */
export const FiscalHostNoteTooltip = ({
  note,
  children,
}: {
  note: FiscalHostNoteLike;
  children: React.ReactElement;
}) => (
  <Tooltip delayDuration={100}>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent className="max-w-sm text-left">
      <HTMLContent content={note.note} className="text-sm" openLinksInNewTab />
      <FiscalHostNoteAttribution note={note} className="mt-1 text-slate-300" />
    </TooltipContent>
  </Tooltip>
);

/**
 * A host-private note about an account. Renders nothing when there is no note so it can be
 * dropped next to any account avatar.
 */
export const FiscalHostNoteBadge = ({
  note,
  className,
  iconSize = 16,
  showLabel = false,
}: FiscalHostNoteBadgeProps) => {
  const intl = useIntl();

  if (!note?.note) {
    return null;
  }

  const isWarning = note.type === 'WARNING';
  const isPositive = note.type === 'POSITIVE';
  const Icon = isWarning ? AlertTriangle : isPositive ? CircleCheck : Info;
  const label = isWarning
    ? intl.formatMessage({ defaultMessage: 'Fiscal host warning', id: 'FiscalHostNote.Warning' })
    : intl.formatMessage({ defaultMessage: 'Fiscal host note', id: 'FiscalHostNote.Title' });

  return (
    <FiscalHostNoteTooltip note={note}>
      <button
        type="button"
        aria-label={label}
        className={cn(
          'inline-flex shrink-0 cursor-help items-center gap-1 rounded-full',
          isWarning ? 'text-red-600' : isPositive ? 'text-green-600' : 'text-slate-500',
          className,
        )}
        onClick={event => event.stopPropagation()}
      >
        <Icon size={iconSize} aria-hidden="true" />
        {showLabel && <span className="text-xs font-medium">{label}</span>}
      </button>
    </FiscalHostNoteTooltip>
  );
};

/** Non-interactive indicator for the avatar overlay: a circled alert coloured by the note level. */
export const FiscalHostNoteIndicator = ({
  note,
  size = 14,
  className,
  variant = 'icon',
}: {
  note: FiscalHostNoteLike;
  size?: number;
  className?: string;
  variant?: 'icon' | 'dot';
}) => {
  const isWarning = note.type === 'WARNING';
  const isPositive = note.type === 'POSITIVE';

  if (variant === 'dot') {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'block shrink-0 rounded-full',
          isWarning ? 'bg-red-500' : isPositive ? 'bg-green-500' : 'bg-blue-500',
          className,
        )}
        style={{ width: size, height: size }}
      />
    );
  }

  const Icon = isPositive ? CircleCheck : CircleAlert;
  return (
    <Icon
      aria-hidden="true"
      size={size}
      className={cn(
        'shrink-0',
        isWarning ? 'text-red-500' : isPositive ? 'text-green-500' : 'text-blue-500',
        className,
      )}
    />
  );
};

type FiscalHostNoteBlockProps = {
  note: FiscalHostNoteLike;
  className?: string;
};

/** Inline presentation of a fiscal host note, used where there is room for the note itself (hover cards). */
export const FiscalHostNoteBlock = ({ note, className }: FiscalHostNoteBlockProps) => {
  const isWarning = note.type === 'WARNING';
  const isPositive = note.type === 'POSITIVE';
  const Icon = isWarning ? AlertTriangle : isPositive ? CircleCheck : Info;

  return (
    <div
      className={cn(
        'rounded-md border p-2.5 text-xs',
        isWarning
          ? 'border-red-200 bg-red-50'
          : isPositive
            ? 'border-green-200 bg-green-50'
            : 'border-slate-200 bg-slate-50',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center gap-1.5 font-medium',
          isWarning ? 'text-red-700' : isPositive ? 'text-green-700' : 'text-slate-700',
        )}
      >
        <Icon size={14} aria-hidden="true" />
        {isWarning ? (
          <FormattedMessage defaultMessage="Fiscal host warning" id="FiscalHostNote.Warning" />
        ) : (
          <FormattedMessage defaultMessage="Fiscal host note" id="FiscalHostNote.Title" />
        )}
      </div>
      {note.note && <HTMLContent content={note.note} className="mt-1.5 text-xs" openLinksInNewTab />}
      <FiscalHostNoteAttribution note={note} className="mt-1.5 text-muted-foreground" />
    </div>
  );
};
