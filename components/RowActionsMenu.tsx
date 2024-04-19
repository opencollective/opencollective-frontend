import React from 'react';
import { MoreHorizontal, PanelRightOpen } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { ActionType } from '../lib/actions/types';

import { Button } from './ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import StyledSpinner from './StyledSpinner';

function ActionItem({ action }) {
  return (
    <DropdownMenuItem key={action.label} onClick={action.onClick} className="gap-2" disabled={action.disabled}>
      {action.Icon && <action.Icon size={16} />}
      {action.label}
      {action.isLoading && <StyledSpinner className="ml-auto size-4 text-muted-foreground" />}
    </DropdownMenuItem>
  );
}

export function RowActionsMenu({ row, actionsMenuTriggerRef, table }) {
  if (!row.original) {
    return null;
  }
  const { getActions, openDrawer } = table.options.meta;

  const actions = getActions(row.original, actionsMenuTriggerRef);
  const openDetails = () => {
    openDrawer?.(row.original, actionsMenuTriggerRef);
  };
  const primaryActions = actions.filter(a => a.type === ActionType.PRIMARY);
  const secondaryActions = actions.filter(a => a.type === ActionType.SECONDARY);
  console.log(actionsMenuTriggerRef);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild ref={actionsMenuTriggerRef}>
        <Button
          size="icon-xs"
          variant="outline"
          className="border-transparent text-muted-foreground hover:bg-white hover:text-foreground hover:shadow-sm group-hover/row:border-border data-[state=open]:border-border data-[state=open]:text-foreground"
        >
          <MoreHorizontal size={18} />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openDetails()} className="gap-2">
          <PanelRightOpen size={16} />
          <FormattedMessage defaultMessage="Open details" id="iIXH4W" />
        </DropdownMenuItem>
        {primaryActions.length > 0 && (
          <React.Fragment>
            <DropdownMenuSeparator />
            {primaryActions.map(action => (
              <ActionItem key={action.label} action={action} />
            ))}
          </React.Fragment>
        )}

        {secondaryActions.length > 0 && (
          <React.Fragment>
            <DropdownMenuSeparator />
            {secondaryActions.map(action => {
              return <ActionItem key={action.label} action={action} />;
            })}
          </React.Fragment>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
