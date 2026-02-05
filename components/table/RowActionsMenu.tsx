import React from 'react';
import type { Row, Table } from '@tanstack/react-table';
import { MoreHorizontal, PanelRightOpen } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import type { Action } from '@/lib/actions/types';

import Spinner from '../Spinner';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

export function DropdownActionItem({ action }: { action: Action }) {
  const item = (
    <DropdownMenuItem
      onClick={action.onClick}
      className="gap-2.5"
      disabled={action.disabled}
      data-cy={action['data-cy']}
    >
      {action.Icon && <action.Icon className="shrink-0 text-muted-foreground" size={16} />}
      {action.label}
      {action.isLoading && <Spinner className="ml-auto size-4 text-muted-foreground" />}
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
