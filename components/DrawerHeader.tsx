import React from 'react';
import clsx from 'clsx';
import { MoreHorizontal, X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { useWindowResize, VIEWPORTS } from '../lib/hooks/useWindowResize';

import { DropdownActionItem } from './table/RowActionsMenu';
import { Button } from './ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/DropdownMenu';
import { SheetClose } from './ui/Sheet';

export default function DrawerHeader({ actions, entityName, entityIdentifier, entityLabel, dropdownTriggerRef }) {
  const { viewport } = useWindowResize();
  const isMobile = viewport === VIEWPORTS.XSMALL;
  const { primary, secondary } = actions || {};
  const hasMoreActions = (isMobile && Boolean(primary?.length)) || Boolean(secondary?.length);

  return (
    <div className="flex flex-col gap-1 border-b px-6 py-4">
      <div className={clsx('flex items-center justify-between gap-4')}>
        <div className="flex shrink grow items-center gap-1 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">{entityName}</span>

          <div className="w-0 max-w-fit flex-1">{entityIdentifier}</div>
        </div>

        <div className="flex items-center gap-1">
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
      <div className="flex justify-between">
        <div className="flex items-center gap-2">{entityLabel}</div>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            {primary?.map(action => (
              <Button
                key={action.label}
                variant="outline"
                size="xs"
                className="gap-1.5"
                onClick={action.onClick}
                disabled={action.disabled}
                data-cy={action['data-cy']}
              >
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
                {isMobile && primary?.map(action => <DropdownActionItem key={action.label} action={action} />)}

                {isMobile && primary.length > 0 && secondary.length > 0 && <DropdownMenuSeparator />}

                {secondary?.map(action => <DropdownActionItem key={action.label} action={action} />)}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
