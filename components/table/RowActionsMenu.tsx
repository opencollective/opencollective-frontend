import React from 'react';
import type { Row, Table } from '@tanstack/react-table';
import { MoreHorizontal, PanelRightOpen } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import StyledSpinner from '../StyledSpinner';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

export function DropdownActionItem({ action }) {
  return (
    <DropdownMenuItem
      key={action.label}
      onClick={action.onClick}
      className="gap-2.5"
      disabled={action.disabled}
      data-cy={action['data-cy']}
    >
      {action.Icon && <action.Icon className="shrink-0 text-muted-foreground" size={16} />}
      {action.label}
      {action.isLoading && <StyledSpinner className="ml-auto size-4 text-muted-foreground" />}
    </DropdownMenuItem>
  );
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
  const openDetails = () => {
    openDrawer?.(row, actionsMenuTriggerRef);
  };

  return (
    <div className="">
      {primary?.length > 0 && (
        <div className="absolute right-[2.625rem] flex items-center gap-0.5 opacity-0 transition-opacity group-hover/row:opacity-100">
          {primary.map(action => (
            <Tooltip delayDuration={200} key={action.key}>
              <TooltipTrigger asChild>
                <Button
                  key={action.key}
                  variant="outline"
                  // variant={action.variant || 'outline'}
                  size="icon-xs"
                  className="border-transparent text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm group-hover/row:border-border data-[state=open]:border-border data-[state=open]:text-foreground"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  data-cy={action['data-cy']}
                >
                  {action.Icon && <action.Icon size={16} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      )}
      <DropdownMenu>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild ref={actionsMenuTriggerRef}>
              <Button
                size="icon-xs"
                variant="outline"
                className="border-transparent text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm group-hover/row:border-border data-[state=open]:border-border data-[state=open]:text-foreground"
              >
                <MoreHorizontal size={18} />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>More</TooltipContent>
        </Tooltip>

        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => openDetails()} className="gap-2.5">
            <PanelRightOpen className="text-muted-foreground" size={16} />
            <FormattedMessage defaultMessage="Open details" id="iIXH4W" />
          </DropdownMenuItem>
          {primary?.length > 0 && (
            <React.Fragment>
              <DropdownMenuSeparator />
              {primary.map(action => (
                <DropdownActionItem key={action.key} action={action} />
              ))}
            </React.Fragment>
          )}

          {secondary?.length > 0 && (
            <React.Fragment>
              <DropdownMenuSeparator />
              {secondary.map(action => {
                return <DropdownActionItem key={action.key} action={action} />;
              })}
            </React.Fragment>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
