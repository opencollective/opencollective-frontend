import React, { forwardRef } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, Row, TableMeta, useReactTable } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import LoadingPlaceholder from './LoadingPlaceholder';
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  meta?: TableMeta<any>;
  hideHeader?: boolean;
  emptyMessage?: () => React.ReactNode;
  nbPlaceholders?: number;
  onClickRow?: (row: Row<TData>) => void;
  className?: string;
  innerClassName?: string;
  mobileTableView?: boolean;
  footer?: React.ReactNode;
}

function DataTableWithRef<TData, TValue>(
  {
    columns,
    data,
    meta,
    loading,
    emptyMessage,
    hideHeader,
    nbPlaceholders = 10,
    onClickRow,
    footer,
    ...tableProps
  }: DataTableProps<TData, TValue>,
  ref: React.Ref<HTMLTableElement>,
) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
  });

  return (
    <Table {...tableProps} ref={ref}>
      {!hideHeader && (
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} highlightOnHover={false}>
              {headerGroup.headers.map(header => {
                const columnMeta = header.column.columnDef.meta || {};
                return (
                  <TableHead key={header.id} className={columnMeta['className']}>
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
                <TableCell key={column.id}>
                  <div className="w-1/2">
                    <LoadingPlaceholder height={16} className="" borderRadius={8} />
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map(row => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
              {...(onClickRow && {
                onClick: () => onClickRow(row),
                className: 'cursor-pointer',
              })}
            >
              {row.getVisibleCells().map(cell => {
                const columnMeta = cell.column.columnDef.meta || {};
                return (
                  <TableCell key={cell.id} className={columnMeta['className']}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                );
              })}
            </TableRow>
          ))
        ) : (
          <TableRow highlightOnHover={false}>
            <TableCell colSpan={columns.length}>
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

export const DataTable = forwardRef(DataTableWithRef);
