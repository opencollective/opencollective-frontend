import React from 'react';
import { clsx } from 'clsx';
import { MoreHorizontal, X } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { useWindowResize, VIEWPORTS } from '../lib/hooks/useWindowResize';
import type { Action } from '@/lib/actions/types';

import { DropdownActionItem } from './table/RowActionsMenu';
import { Button } from './ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/DropdownMenu';
import { SheetClose } from './ui/Sheet';
import Link from './Link';

type DrawerHeaderProps = {
  actions?: {
    primary?: Action[];
    secondary?: Action[];
  };
  entityName: string | React.ReactNode;
  entityIdentifier: string | React.ReactNode;
  entityLabel: string | React.ReactNode;
  dropdownTriggerRef?: React.Ref<HTMLButtonElement>;
  forceMoreActions?: boolean;
  separateRowForEntityLabel?: boolean;
};

export default function DrawerHeader({
  entityName,
  entityIdentifier,
  entityLabel,
  actions = {},
  dropdownTriggerRef,
  forceMoreActions = false,
  separateRowForEntityLabel = false,
}: DrawerHeaderProps) {
  const { viewport } = useWindowResize();
  const isMobile = viewport === VIEWPORTS.XSMALL;
  const { primary, secondary } = actions || {};
  const shouldPutPrimaryInMoreActions = forceMoreActions || isMobile;
  const hasMoreActions = (shouldPutPrimaryInMoreActions && Boolean(primary?.length)) || Boolean(secondary?.length);

  return (
    <div className="flex flex-col gap-2 border-b px-6 py-4">
      <div className={clsx('flex items-center justify-between gap-4')}>
        <div className="flex shrink grow items-center gap-1 text-sm text-muted-foreground">
          <span className="whitespace-nowrap">{entityName}</span>

          <div className="w-0 max-w-fit flex-1">{entityIdentifier}</div>
        </div>

        <div className="flex items-center gap-1">
          <SheetClose asChild>
            <Button variant="ghost" size="icon-xs" className="shrink-0" data-cy="close-drawer-btn">
              <X className="h-4 w-4" />
              <span className="sr-only">
                <FormattedMessage id="Close" defaultMessage="Close" />
              </span>
            </Button>
          </SheetClose>
        </div>
      </div>
      <div className={clsx('flex justify-between gap-3', separateRowForEntityLabel && 'flex-col')}>
        <div className="flex items-center gap-2">{entityLabel}</div>

        <div className="ml-auto flex items-center justify-end gap-1">
          {!forceMoreActions && (
            <div className="items-center gap-1 sm:flex">
              {primary?.map(action => (
                <Button
                  key={action.key}
                  asChild={Boolean(action.href)}
                  variant="outline"
                  size="xs"
                  className="gap-1.5"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  data-cy={action['data-cy']}
                >
                  {action.href ? (
                    <Link href={action.href} target={action.target}>
                      {action.Icon && <action.Icon size={16} />}
                      <span>{action.label}</span>
                    </Link>
                  ) : (
                    <React.Fragment>
                      {action.Icon && <action.Icon size={16} />}
                      <span>{action.label}</span>
                    </React.Fragment>
                  )}
                </Button>
              ))}
            </div>
          )}
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
                {shouldPutPrimaryInMoreActions &&
                  primary?.map(action => <DropdownActionItem key={action.key} action={action} />)}

                {shouldPutPrimaryInMoreActions && primary.length > 0 && secondary.length > 0 && (
                  <DropdownMenuSeparator />
                )}

                {secondary?.map(action => (
                  <DropdownActionItem key={action.key} action={action} />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}
