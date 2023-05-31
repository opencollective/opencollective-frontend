import React from 'react';
// import type {TData } from "@tanstack/react-table"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  RowData,
  SortingState,
  TableMeta,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta: TableMeta<any>;
  defaultColumnVisibility?: VisibilityState;
  loading?: boolean;
  loadingCount?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
  defaultColumnVisibility = {},
  loading,
  loadingCount = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(defaultColumnVisibility);
  // console.log({ columnVisibility });
  React.useEffect(() => {
    setColumnVisibility(defaultColumnVisibility);
  }, [defaultColumnVisibility]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    meta,
    state: {
      sorting,
      columnVisibility,
    },
  });

  const loadingArray = Array.from({ length: loadingCount }, () => ({}));

  return (
    <div>
      <div className="mb-4 flex justify-end"></div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              loadingArray.map((_, i) => (
                <TableRow key={i} className="">
                  <TableCell>
                    <div className="p-4">
                      <div className="h-4 w-24 animate-pulse rounded bg-slate-100"></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="p-4">
                      <div className="h-4 w-12 animate-pulse rounded bg-slate-100"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow highlightOnHover key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-4 text-center text-slate-500">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
