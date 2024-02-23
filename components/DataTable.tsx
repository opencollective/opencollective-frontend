import React from 'react';
import type { ColumnDef, Row, SortingState, TableMeta } from '@tanstack/react-table';
import { flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';

import { Skeleton } from './ui/Skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  meta?: TableMeta<any>;
  hideHeader?: boolean;
  emptyMessage?: () => React.ReactNode;
  nbPlaceholders?: number;
  onClickRow?: (row: Row<TData>) => void;
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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
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
  ...tableProps
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>(initialSort ?? []);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  });

  return (
    <Table {...tableProps} ref={tableRef}>
      {!hideHeader && (
        <TableHeader className="relative">
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} highlightOnHover={false}>
              {headerGroup.headers.map(header => {
                const columnMeta = header.column.columnDef.meta || {};
                return (
                  <TableHead key={header.id} className={columnMeta['className']} fullWidth={tableProps.fullWidth}>
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
              {table.getAllFlatColumns().map(column => (
                // eslint-disable-next-line react/no-array-index-key
                <TableCell key={column.id} fullWidth={tableProps.fullWidth} compact={compact}>
                  <div className="w-1/2">
                    <Skeleton className="h-4 rounded-lg" />
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map(row => (
            <TableRow
              key={row.id}
              data-cy={getRowDataCy?.(row) || `datatable-row-${row.id}`}
              data-state={row.getIsSelected() && 'selected'}
              {...(onClickRow && {
                onClick: () => onClickRow(row),
                className: 'cursor-pointer',
              })}
              {...(onHoverRow && {
                onMouseEnter: () => onHoverRow(row),
                onMouseLeave: () => onHoverRow(null),
              })}
            >
              {row.getVisibleCells().map(cell => {
                const columnMeta = cell.column.columnDef.meta || {};
                return (
                  <TableCell
                    key={cell.id}
                    className={columnMeta['className']}
                    fullWidth={tableProps.fullWidth}
                    compact={compact}
                    {...(rowHasIndicator && {
                      withIndicator: true,
                      'data-state': rowHasIndicator(row) && 'indicated',
                    })}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        ) : (
          <TableRow highlightOnHover={false}>
            <TableCell colSpan={columns.length} compact={compact}>
              <p className="p-4 text-center text-slate-500">
                {emptyMessage ? emptyMessage() : <FormattedMessage defaultMessage="No data" />}
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
