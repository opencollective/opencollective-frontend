import React from 'react';
import { Button } from './ui/Button';
import { FormattedMessage } from 'react-intl';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import { MoreHorizontal, X } from 'lucide-react';
import clsx from 'clsx';
import { VIEWPORTS, useWindowResize } from '../lib/hooks/useWindowResize';
import { Dropdown } from 'react-day-picker';
import { SheetClose } from './ui/Sheet';

export default function DrawerHeader({
  primaryActions,
  secondaryActions,
  entityName,
  entityIdentifier,
  entityLabel,
  dropdownTriggerRef,
  compact = false,
}) {
  const { viewport } = useWindowResize();
  const isMobile = viewport === VIEWPORTS.XSMALL;
  const hasMoreActions = (isMobile && Boolean(primaryActions?.length)) || Boolean(secondaryActions?.length);
  const actions = (
    <div className="flex items-center gap-1">
      <div className="hidden items-center gap-1 sm:flex">
        {primaryActions?.map(action => (
          <Button key={action.label} variant="outline" size="xs" className="gap-1" onClick={action.onClick}>
            {action.Icon && <action.Icon size={16} />}
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
      {hasMoreActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild ref={dropdownTriggerRef}>
            <Button variant="outline" size="icon-xs">
              <MoreHorizontal size={16} />
              <span className="sr-only">
                <FormattedMessage defaultMessage="More actions" id="S8/4ZI" />
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isMobile &&
              primaryActions?.map(action => (
                <DropdownMenuItem key={action.label} onClick={action.onClick} className="gap-2">
                  {action.Icon && <action.Icon size={16} />}
                  <span>{action.label}</span>
                </DropdownMenuItem>
              ))}

            {isMobile && primaryActions.length > 0 && secondaryActions.length > 0 && <DropdownMenuSeparator />}

            {secondaryActions?.map(action => (
              <DropdownMenuItem key={action.label} onClick={action.onClick} className="gap-2">
                {action.Icon && <action.Icon size={16} />}
                <span>{action.label}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
  return (
    <div className="flex flex-col gap-1 border-b px-6 py-4">
      <div className={clsx('flex items-center justify-between gap-4')}>
        {false ? (
          <div />
        ) : (
          <div className="flex shrink grow items-center gap-1 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">{entityName}</span>

            <div className="w-0 max-w-fit flex-1">{entityIdentifier}</div>
          </div>
        )}

        <div className="flex items-center gap-1">
          {compact && actions}

          <SheetClose asChild>
            <Button variant="ghost" size="icon-xs" className="shrink-0">
              <X className="h-4 w-4" />
              <span className="sr-only">
                <FormattedMessage id="Close" defaultMessage="Close" />
              </span>
            </Button>
          </SheetClose>
        </div>
      </div>
      {!compact && (
        <div className="flex justify-between">
          <div className="flex items-center gap-2">{entityLabel}</div>

          {actions}
        </div>
      )}
    </div>
  );
}
