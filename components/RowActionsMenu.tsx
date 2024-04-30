import React from 'react';
import { MoreHorizontal, PanelRightOpen } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { Button } from './ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import StyledSpinner from './StyledSpinner';

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

export function RowActionsMenu({ row, actionsMenuTriggerRef, table }) {
  if (!row.original) {
    return null;
  }
  const { getActions, openDrawer } = table.options.meta;

  const { primary, secondary } = getActions(row.original, actionsMenuTriggerRef);
  const openDetails = () => {
    openDrawer?.(row.id, actionsMenuTriggerRef);
  };

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
          <PanelRightOpen className="text-muted-foreground" size={16} />
          <FormattedMessage defaultMessage="Open details" id="iIXH4W" />
        </DropdownMenuItem>
        {primary?.length > 0 && (
          <React.Fragment>
            <DropdownMenuSeparator />
            {primary.map(action => (
              <DropdownActionItem key={action.label} action={action} />
            ))}
          </React.Fragment>
        )}

        {secondary?.length > 0 && (
          <React.Fragment>
            <DropdownMenuSeparator />
            {secondary.map(action => {
              return <DropdownActionItem key={action.label} action={action} />;
            })}
          </React.Fragment>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
