import React from 'react';
import { X } from 'lucide-react';
import { useIntl } from 'react-intl';

import { cn } from '@/lib/utils';

import { CommandItem } from '../ui/Command';

interface SearchCommandItemProps {
  onSelect?: () => void;
  actionLabel?: string;
  children: React.ReactNode;
  showAction?: boolean;
  className?: string;
  value?: string;
  onDelete?: () => void;
}

export const SearchCommandItem = React.memo<SearchCommandItemProps>(
  ({ onSelect, onDelete, actionLabel, children, showAction = false, className = undefined, ...props }) => {
    const intl = useIntl();
    const defaultActionLabel = intl.formatMessage({ defaultMessage: 'Jump to', id: 'u8j6vX' });
    return (
      <CommandItem
        onSelect={onSelect}
        className={cn(
          'justify-between gap-2',
          '[&[data-selected=true]_.action]:bg-background [&[data-selected=true]_.action]:shadow-xs [&[data-selected=true]_.action]:ring [&[data-selected=true]_.action]:ring-border',
          '[&[data-selected=true]_.action]:text-foreground',
          showAction ? '' : '[&[data-selected=false]_.action]:hidden',
          '[&[data-selected=false]_.actions]:hidden',
          className,
        )}
        {...props}
      >
        {children}
        <div className={cn('actions absolute right-2 flex items-center gap-1', showAction ? '' : 'absolute right-2')}>
          <div
            className={cn(
              'action flex items-center gap-1 rounded-md p-1 whitespace-nowrap text-muted-foreground shadow-none transition-colors',
            )}
          >
            {actionLabel ?? defaultActionLabel}
          </div>
          {onDelete && (
            <button
              className="flex size-7 items-center justify-center rounded-md p-1 ring-border transition-colors hover:bg-background hover:shadow-xs hover:ring"
              onClick={e => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
            >
              <X className="!size-4" />
            </button>
          )}
        </div>
      </CommandItem>
    );
  },
);
