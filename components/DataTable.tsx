import React from 'react';
import { ColumnDef, flexRender, getCoreRowModel, TableMeta, useReactTable } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';

import LoadingPlaceholder from './LoadingPlaceholder';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';
import { P } from './Text';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  loading?: boolean;
  meta?: TableMeta<any>;
  hideHeader?: boolean;
  highlightRowOnHover?: boolean;
  emptyMessage?: () => React.ReactNode;
  nbPlaceholders?: number;
  headerProps?: React.ComponentProps<typeof TableHeader>;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
  loading,
  emptyMessage,
  hideHeader,
  nbPlaceholders = 10,
  highlightRowOnHover = true,
  headerProps,
  ...tableProps
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta,
  });

  return (
    <Table {...tableProps}>
      {!hideHeader && (
        <TableHeader {...headerProps}>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map(header => {
                const columnMeta = header.column.columnDef.meta || {};
                return (
                  <TableHead key={header.id} textAlign="left" {...columnMeta['styles']}>
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
                  <LoadingPlaceholder height={16} width={100} m={3} borderRadius={8} />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map(row => (
            <TableRow
              highlightOnHover={highlightRowOnHover}
              key={row.id}
              data-state={row.getIsSelected() && 'selected'}
            >
              {row.getVisibleCells().map(cell => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length}>
              <P p={4} textAlign="center">
                {emptyMessage ? emptyMessage() : <FormattedMessage defaultMessage="No data" />}
              </P>
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
