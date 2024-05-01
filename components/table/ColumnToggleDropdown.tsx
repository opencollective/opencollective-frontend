import React from 'react';
import { Table } from '@tanstack/react-table';
import clsx from 'clsx';
import { RotateCcw, Settings2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

export function ColumnToggleDropdown<TData>({ table }: { table: Table<TData> }) {
  const { hasDefaultColumnVisibility, setColumnVisibility, defaultColumnVisibility } = table.options.meta;
  const intl = useIntl();

  if (!defaultColumnVisibility) {
    return null;
  }
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          size="icon-xs"
          variant="outline"
          className={clsx('transition-colors', !hasDefaultColumnVisibility && 'text-blue-600')}
        >
          <Settings2 size={18} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <FormattedMessage defaultMessage="Toggle columns" id="5PWP+M" />
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {table
          .getAllColumns()
          .filter(column => typeof column.accessorFn !== 'undefined' && column.getCanHide())
          .map(column => {
            const { labelMsg } = column.columnDef.meta || {};
            return (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="capitalize"
                checked={column.getIsVisible()}
                onCheckedChange={value => column.toggleVisibility(!!value)}
                onSelect={event => event.preventDefault()}
              >
                {labelMsg ? intl.formatMessage(labelMsg) : column.id}
              </DropdownMenuCheckboxItem>
            );
          })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={'gap-2 '}
          onSelect={e => {
            e.preventDefault();
            setColumnVisibility(defaultColumnVisibility);
          }}
          disabled={hasDefaultColumnVisibility}
        >
          <RotateCcw size={16} className="text-muted-foreground" />
          <FormattedMessage defaultMessage="Restore default" id="qSnPFR" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
