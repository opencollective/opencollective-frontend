import type {
  CellContext as TanCellContext,
  Column as TanColumn,
  ColumnDef as TanColumnDef,
  Row as TanRow,
  RowData,
  Table as TanTable,
  TableMeta as TanTableMeta,
} from '@tanstack/react-table';
import {
  columnVisibilityFeature,
  createColumnHelper as createTanColumnHelper,
  createSortedRowModel,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from '@tanstack/react-table';

// Features shared by every DataTable: sorting, row selection and column visibility.
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  rowSelectionFeature,
  columnVisibilityFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { alphanumeric: sortFn_alphanumeric, datetime: sortFn_datetime, text: sortFn_text },
});

type DataTableFeatures = typeof dataTableFeatures;

// Project-level aliases bound to the DataTable feature set, with the TanStack v8 generics shape.
export type ColumnDef<TData extends RowData, TValue = unknown> = TanColumnDef<DataTableFeatures, TData, TValue>;
export type Column<TData extends RowData, TValue = unknown> = TanColumn<DataTableFeatures, TData, TValue>;
export type Row<TData extends RowData> = TanRow<DataTableFeatures, TData>;
export type Table<TData extends RowData> = TanTable<DataTableFeatures, TData>;
export type TableMeta<TData extends RowData> = TanTableMeta<DataTableFeatures, TData>;
export type CellContext<TData extends RowData, TValue = unknown> = TanCellContext<DataTableFeatures, TData, TValue>;

export const createColumnHelper = <TData extends RowData>() => createTanColumnHelper<DataTableFeatures, TData>();
