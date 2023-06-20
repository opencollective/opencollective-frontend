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
import { SettingsContext } from '../../lib/SettingsContext';

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
  const { settings } = React.useContext(SettingsContext);

  const loadingArray = Array.from({ length: loadingCount }, () => ({}));

  return (
    <div className="border rounded-md  bg-white w-full">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, i, a) => {
                return (
                  <TableHead
                    className={
                      i === 0 && settings.fullBleedTable
                        ? 'pl-12'
                        : a.length - 1 === i && settings.fullBleedTable
                        ? 'pr-12'
                        : ''
                    }
                    key={header.id}
                  >
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
                  <div className="p-4 pl-12">
                    <div className="h-4 w-24 animate-pulse rounded bg-slate-100"></div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="p-4 pr-12">
                    <div className="h-4 w-12 animate-pulse rounded bg-slate-100"></div>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow className="hover:bg-slate-100/50 " key={row.id} data-state={row.getIsSelected() && 'selected'}>
                {row.getVisibleCells().map((cell, i, a) => (
                  <TableCell
                    className={
                      // i === 0 && settings.fullBleedTable
                      //   ? 'pl-8'
                      //   : a.length - 1 === i && settings.fullBleedTable
                      //   ? 'pr-8'
                      //   : ''
                      ''
                    }
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow noBorder>
              <TableCell colSpan={columns.length} className="py-8 px-12 text-slate-500">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
