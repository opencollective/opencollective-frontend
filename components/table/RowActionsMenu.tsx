import React from 'react';
import type { Row, Table } from '@tanstack/react-table';
import { MoreHorizontal, PanelRightOpen } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { Action } from '@/lib/actions/types';

import Link from '../Link';
import Spinner from '../Spinner';
import { Button } from '../ui/Button';
import { ButtonGroup } from '../ui/ButtonGroup';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

function DropdownActionItemContent({ action }: { action: Action }) {
  return (
    <React.Fragment>
      {action.Icon && <action.Icon className="shrink-0 text-muted-foreground" size={16} />}
      {action.label}
      {action.isLoading && <Spinner className="ml-auto size-4 text-muted-foreground" />}
    </React.Fragment>
  );
}

export function DropdownActionItem({ action }: { action: Action }) {
  const item = action.href ? (
    <DropdownMenuItem asChild className="gap-2.5" disabled={action.disabled} data-cy={action['data-cy']}>
      <Link href={action.href} onClick={action.onClick}>
        <DropdownActionItemContent action={action} />
      </Link>
    </DropdownMenuItem>
  ) : (
    <DropdownMenuItem
      onClick={action.onClick}
      className="gap-2.5"
      disabled={action.disabled}
      data-cy={action['data-cy']}
    >
      <DropdownActionItemContent action={action} />
    </DropdownMenuItem>
  );

  if (action.tooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{item}</TooltipTrigger>
        <TooltipContent side="left">{action.tooltip}</TooltipContent>
      </Tooltip>
    );
  }

  return item;
}
interface RowActionsMenuProps<TData> {
  table: Table<TData>;
  row: Row<TData>;
  actionsMenuTriggerRef: React.MutableRefObject<HTMLButtonElement>;
}

export function RowActionsMenu<TData>({ row, actionsMenuTriggerRef, table }: RowActionsMenuProps<TData>) {
  if (!row.original) {
    return null;
  }
  const { getActions, openDrawer } = table.options.meta;

  if (!getActions) {
    return null;
  }

  const { primary, secondary } = getActions(row.original, actionsMenuTriggerRef) ?? {};
  const hasNoActions = !primary?.length && !secondary?.length && !openDrawer;

  return (
    <DropdownMenu>
      <ButtonGroup className="group/actions">
        {primary
          .filter(a => a.Icon && !a.disabled) // only actions with Icons can be rendered as quick-actions
          .slice(0, 2) // only show the first 2 primary actions
          .map(action => {
            const icon = <action.Icon size={16} />;
            const quickActionClassName =
              'invisible flex border-transparent text-muted-foreground group-hover/row:visible group-hover/row:border-border group-has-data-[state=open]/actions:visible group-has-data-[state=open]/actions:border-border hover:bg-white hover:text-foreground hover:shadow-xs';

            return (
              <Tooltip key={action.key} disableHoverableContent>
                <TooltipTrigger asChild>
                  {action.href ? (
                    <Button
                      asChild
                      size="icon-xs"
                      variant="outline"
                      disabled={action.disabled}
                      className={quickActionClassName}
                    >
                      <Link href={action.href} onClick={action.onClick}>
                        {icon}
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      size="icon-xs"
                      variant="outline"
                      disabled={action.disabled}
                      className={quickActionClassName}
                      onClick={action.onClick}
                    >
                      {icon}
                    </Button>
                  )}
                </TooltipTrigger>
                <TooltipContent>{action.label}</TooltipContent>
              </Tooltip>
            );
          })}

        <DropdownMenuTrigger asChild ref={actionsMenuTriggerRef}>
          <Button
            size="icon-xs"
            variant="outline"
            className="border-transparent text-muted-foreground group-hover/row:border-border hover:bg-white hover:text-foreground hover:shadow-xs data-[state=open]:border-border data-[state=open]:text-foreground"
            data-cy="actions-menu-trigger"
            disabled={hasNoActions}
          >
            <MoreHorizontal size={18} />
          </Button>
        </DropdownMenuTrigger>
      </ButtonGroup>

      <DropdownMenuContent align="end">
        {openDrawer && (
          <DropdownMenuItem onClick={() => openDrawer(row, actionsMenuTriggerRef)} className="gap-2.5">
            <PanelRightOpen className="text-muted-foreground" size={16} />
            <FormattedMessage defaultMessage="View details" id="MnpUD7" />
          </DropdownMenuItem>
        )}
        {primary?.length > 0 && (
          <React.Fragment>
            {openDrawer && <DropdownMenuSeparator />}
            {primary.map(action => (
              <DropdownActionItem key={action.key} action={action} />
            ))}
          </React.Fragment>
        )}

        {secondary?.length > 0 && (
          <React.Fragment>
            {(openDrawer || primary?.length > 0) && <DropdownMenuSeparator />}
            {secondary.map(action => {
              return <DropdownActionItem key={action.key} action={action} />;
            })}
          </React.Fragment>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
