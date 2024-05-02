import React from 'react';
import { Column, Table } from '@tanstack/react-table';
import clsx from 'clsx';
import { ArrowDown10, ArrowDownZA, ArrowUp10, ArrowUpDown, ArrowUpZA, CheckIcon, EyeOff, Filter } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { OrderDirection } from '../../lib/graphql/types/v2/graphql';

import { SetFilter } from '../dashboard/filters/FilterDropdown';
import { Button } from '../ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';

interface ColumnHeaderProps<TData, TValue> {
  table: Table<TData>;
  column: Column<TData, TValue>;
  sortField?: string;
  filterKey?: string; // Defaults to column.id
  sortType?: 'alphabetic' | 'numerical';
}

export function ColumnHeader<TData, TValue>({
  table,
  column,
  sortField,
  filterKey,
  sortType = 'numerical',
}: ColumnHeaderProps<TData, TValue>) {
  const intl = useIntl();
  const [open, setOpen] = React.useState(false);
  const { queryFilter } = table.options.meta;
  const { labelMsg, align } = column.columnDef.meta;
  filterKey = filterKey ?? column.id;

  const canSort = Boolean(sortField);
  const canHide = column.getCanHide();
  const canFilter = Boolean(queryFilter.filters[filterKey]);

  const hasFilterValue = queryFilter.values[filterKey] !== undefined;
  const [addingFilter, setAddingFilter] = React.useState(false);
  const [tmpFilterValue, setTmpFilterValue] = React.useState(queryFilter.values[filterKey]);

  const isSorted = queryFilter.values.sort?.field === sortField;
  const isSortedDesc = isSorted && queryFilter.values.sort.direction === OrderDirection.DESC;
  const isSortedAsc = isSorted && queryFilter.values.sort.direction === OrderDirection.ASC;

  const UpIcon = sortType === 'alphabetic' ? ArrowUpZA : ArrowUp10;
  const DownIcon = sortType === 'alphabetic' ? ArrowDownZA : ArrowDown10;

  const Icon = isSorted ? (isSortedDesc ? DownIcon : UpIcon) : ArrowUpDown;
  return (
    <div className={clsx('flex items-center', align === 'right' && 'justify-end')}>
      <DropdownMenu
        open={open}
        modal={false}
        onOpenChange={open => {
          if (open) {
            setOpen(true);
            if (canFilter) {
              setAddingFilter(false);
              setTmpFilterValue(queryFilter.values[column.id]);
            }
          } else {
            setOpen(false);
          }
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="xs"
            className={clsx(
              'group/btn -m-2.5 gap-2 data-[state=open]:bg-accent data-[state=open]:text-foreground [&>svg]:data-[state=open]:!text-muted-foreground',
              isSorted && 'text-foreground',
            )}
          >
            <span className={clsx(align === 'right' && 'order-1')}>{labelMsg && intl.formatMessage(labelMsg)}</span>
            {canSort && (
              <Icon
                className={clsx(
                  'h-4 w-4 transition-colors',
                  isSorted ? 'text-foreground' : 'text-muted-foreground group-hover/btn:text-muted-foreground',
                )}
              />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={clsx('max-w-64', addingFilter ? 'p-0' : '')}>
          {addingFilter ? (
            <SetFilter
              tmpValue={tmpFilterValue}
              setTmpValue={setTmpFilterValue}
              filterKey={filterKey}
              setOpen={setOpen}
              {...queryFilter}
            />
          ) : (
            <React.Fragment>
              {canSort && (
                <React.Fragment>
                  <DropdownMenuItem
                    className="group relative justify-between gap-2"
                    onClick={() => queryFilter.setFilter('sort', { field: sortField, direction: OrderDirection.ASC })}
                  >
                    <div className="flex items-center gap-2">
                      <UpIcon
                        size={16}
                        className={clsx(
                          'h-4 w-4 transition-colors',
                          isSortedAsc ? 'text-foreground' : 'text-muted-foreground ',
                        )}
                      />
                      <FormattedMessage defaultMessage="Sort ascending" id="GuZfUM" />
                    </div>
                    {isSortedAsc && <CheckIcon className="" size={16} />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    defaultChecked
                    className="group relative justify-between gap-2"
                    onClick={() => queryFilter.setFilter('sort', { field: sortField, direction: OrderDirection.DESC })}
                  >
                    <div className="flex items-center gap-2">
                      <DownIcon
                        size={16}
                        className={clsx(
                          'h-4 w-4 transition-colors',
                          isSortedDesc ? 'text-foreground' : 'text-muted-foreground ',
                        )}
                      />
                      <span>
                        <FormattedMessage defaultMessage="Sort descending" id="uSWYZd" />
                      </span>{' '}
                    </div>

                    {isSortedDesc && <CheckIcon className=" " size={16} />}
                  </DropdownMenuItem>
                </React.Fragment>
              )}
              {canFilter && canSort && <DropdownMenuSeparator />}
              {canFilter && (
                <DropdownMenuItem
                  className="group gap-2"
                  onSelect={e => {
                    e.preventDefault();

                    setAddingFilter(true);
                  }}
                >
                  <Filter size={16} className={clsx('h-4 w-4 text-muted-foreground transition-colors')} />
                  {hasFilterValue ? (
                    <FormattedMessage defaultMessage="Edit Filter" id="u0zBXD" />
                  ) : (
                    <FormattedMessage defaultMessage="Add Filter" id="Rqzsq/" />
                  )}
                </DropdownMenuItem>
              )}
              {canFilter && canHide && <DropdownMenuSeparator />}
              {canHide && (
                <DropdownMenuItem className="group gap-2" onSelect={() => column.toggleVisibility(false)}>
                  <EyeOff size={16} className={clsx('h-4 w-4 text-muted-foreground transition-colors')} />
                  <FormattedMessage defaultMessage="Hide column" id="iqrlEx" />
                </DropdownMenuItem>
              )}
            </React.Fragment>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
