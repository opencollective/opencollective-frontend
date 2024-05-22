import React from 'react';
import {
  CellContext as TanCellContext,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  OnChangeFn,
  Row,
  SortingState,
  TableMeta,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import clsx from 'clsx';
import { isEqual, omitBy } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { GetActions } from '../../lib/actions/types';
import type { useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';

import { Skeleton } from '../ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table';

import { ColumnToggleDropdown } from './ColumnToggleDropdown';
import { RowActionsMenu } from './RowActionsMenu';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  meta?: TableMeta<TData>;
  hideHeader?: boolean;
  emptyMessage?: () => React.ReactNode;
  nbPlaceholders?: number;
  onClickRow?: (row: Row<TData>, actionsMenuTriggerRef?: React.RefObject<HTMLElement>) => void;
  onHoverRow?: (row: Row<TData>) => void;
  rowHasIndicator?: (row: Row<TData>) => boolean;
  className?: string;
  innerClassName?: string;
  mobileTableView?: boolean;
  fullWidth?: boolean;
  footer?: React.ReactNode;
  tableRef?: React.Ref<HTMLTableElement>;
  compact?: boolean;
  initialSort?: SortingState;
  getRowDataCy?: (row: Row<TData>) => string;
  getRowId?: (data: TData) => string;
  columnVisibility?: VisibilityState;
  setColumnVisibility?: OnChangeFn<VisibilityState>;
  defaultColumnVisibility?: VisibilityState;
  queryFilter?: useQueryFilterReturnType<any, any>;
  getActions?: GetActions<TData>;
}

const defaultGetRowId = (data: any) => data.id;

export function DataTable<TData, TValue>({
  columns,
  data,
  loading,
  emptyMessage,
  hideHeader,
  nbPlaceholders = 10,
  onClickRow,
  onHoverRow,
  rowHasIndicator,
  footer,
  tableRef,
  compact,
  initialSort,
  getRowDataCy,
  getRowId = defaultGetRowId,
  columnVisibility,
  defaultColumnVisibility,
  setColumnVisibility,
  queryFilter,
  getActions,
  meta, // TODO: Possibly remove this prop once the getActions pattern is implemented fully
  ...tableProps
}: DataTableProps<TData, TValue>) {
  const intl = useIntl();
  const [sorting, setSorting] = React.useState<SortingState>(initialSort ?? []);
  const [rowSelection, setRowSelection] = React.useState({});

  const hasDefaultColumnVisibility = isEqual(
    omitBy(columnVisibility, v => v),
    omitBy(defaultColumnVisibility, v => v),
  );

  const table = useReactTable<TData>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    getRowId,
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      rowSelection,
      columnVisibility,
    },
    meta: {
      intl,
      onClickRow,
      queryFilter,
      getActions,
      hasDefaultColumnVisibility,
      setColumnVisibility,
      defaultColumnVisibility,
      ...meta,
    },
  });

  return (
    <Table {...tableProps} ref={tableRef}>
      {!hideHeader && (
        <TableHeader className="relative">
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} highlightOnHover={false}>
              {headerGroup.headers.map(header => {
                const { className, align } = header.column.columnDef.meta || {};
                return (
                  <TableHead
                    key={header.id}
                    className={clsx(align === 'right' && 'text-right', className)}
                    fullWidth={tableProps.fullWidth}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
      )}

      <TableBody>
        {loading ? (
          [...new Array(nbPlaceholders)].map((_, rowIdx) => (
            // eslint-disable-next-line react/no-array-index-key
            <TableRow key={rowIdx}>
              {table.getVisibleFlatColumns().map(column => {
                const { className, align } = column.columnDef.meta || {};
                const showSkeleton = column.id !== 'actions' && column.columnDef.header;

                return (
                  <TableCell
                    key={column.id}
                    fullWidth={tableProps.fullWidth}
                    compact={compact}
                    className={clsx(align === 'right' && 'text-right', className)}
                  >
                    {showSkeleton && (
                      <div className="inline-block w-1/2">
                        <Skeleton className="h-4 rounded-lg" />
                      </div>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        ) : table.getRowModel().rows?.length ? (
          table
            .getRowModel()
            .rows.map(row => (
              <DataTableRow
                key={row.id}
                row={row}
                onClickRow={onClickRow}
                getRowDataCy={getRowDataCy}
                rowHasIndicator={rowHasIndicator}
                tableProps={tableProps}
                compact={compact}
                onHoverRow={onHoverRow}
              />
            ))
        ) : (
          <TableRow highlightOnHover={false}>
            <TableCell colSpan={columns.length} compact={compact}>
              <p className="p-4 text-center text-slate-500">
                {emptyMessage ? emptyMessage() : <FormattedMessage defaultMessage="No data" id="UG5qoS" />}
              </p>
            </TableCell>
          </TableRow>
        )}
      </TableBody>

      {footer && (
        <tfoot>
          <tr>
            <th colSpan={table.getCenterLeafColumns().length}>{footer}</th>
          </tr>
        </tfoot>
      )}
    </Table>
  );
}

function DataTableRow({ row, onClickRow, getRowDataCy, rowHasIndicator, tableProps, compact, onHoverRow }) {
  // Reference that can be picked up by the actions column, to enable returning focus when closing a drawer or modal opened from actions menu
  const actionsMenuTriggerRef = React.useRef(null);
  return (
    <TableRow
      data-cy={getRowDataCy?.(row) || `datatable-row-${row.id}`}
      data-state={row.getIsSelected() && 'selected'}
      {...(onClickRow && {
        onClick: () => onClickRow(row, actionsMenuTriggerRef),
        className: 'cursor-pointer',
      })}
      {...(onHoverRow && {
        onMouseEnter: () => onHoverRow(row),
        onMouseLeave: () => onHoverRow(null),
      })}
    >
      {row.getVisibleCells().map(cell => {
        const { className, align } = cell.column.columnDef.meta || {};
        return (
          <TableCell
            key={cell.id}
            className={clsx(align === 'right' && 'text-right', className)}
            fullWidth={tableProps.fullWidth}
            compact={compact}
            {...(rowHasIndicator && {
              withIndicator: true,
              'data-state': rowHasIndicator(row) && 'indicated',
            })}
          >
            {flexRender(cell.column.columnDef.cell, {
              ...cell.getContext(),
              actionsMenuTriggerRef,
            })}
          </TableCell>
        );
      })}
    </TableRow>
  );
}

type CellContext<TData, TValue> = TanCellContext<TData, TValue> & {
  actionsMenuTriggerRef?: React.MutableRefObject<any>;
};

export const actionsColumn = {
  accessorKey: 'actions',
  header: ({ table }) => (
    <div className="-mr-2 flex justify-end">
      <ColumnToggleDropdown table={table} />
    </div>
  ),
  meta: { className: 'w-14' },
  enableHiding: false,
  cell: (ctx: unknown) => {
    const { table, row, actionsMenuTriggerRef } = ctx as CellContext<any, any>;
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={e => e.stopPropagation()} className="-mr-2 flex items-center justify-end">
        <RowActionsMenu table={table} row={row} actionsMenuTriggerRef={actionsMenuTriggerRef} />
      </div>
    );
  },
};
