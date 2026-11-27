import '@tanstack/react-table';

import type { ColumnVisibilityState, OnChangeFn, RowData, TableFeatures } from '@tanstack/react-table';
import type { RefObject } from 'react';
import type { IntlShape, MessageDescriptor } from 'react-intl';

import type { GetActions } from '../../lib/actions/types';
import type { Account } from '../../lib/graphql/types/v2/graphql';
import type { useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';

import type { Row } from './tableFeatures';

// Type parameters must match TanStack's declarations for the interface merge, even when unused.
/* eslint-disable @typescript-eslint/no-unused-vars */
declare module '@tanstack/react-table' {
  interface ColumnMeta<TFeatures extends TableFeatures, TData extends RowData, TValue = unknown> {
    className?: string;
    labelMsg?: MessageDescriptor;
    align?: 'left' | 'right';
  }
  interface TableMeta<TFeatures extends TableFeatures, TData extends RowData> {
    intl?: IntlShape;
    queryFilter?: useQueryFilterReturnType<any>;
    setColumnVisibility?: OnChangeFn<ColumnVisibilityState>;
    columnVisibility?: ColumnVisibilityState;
    defaultColumnVisibility?: ColumnVisibilityState;
    hasDefaultColumnVisibility?: boolean;
    openDrawer?: (row: Row<TData>, actionsMenuTriggerRef?: RefObject<HTMLElement>) => void;
    getActions?: GetActions<TData>;
    showQuickActions?: boolean;

    // TODO: remove types below when all tables use getActions
    // Hosted Collectives table
    onEdit?: () => void;
    host?: Account;

    // AccountingCateriesTable
    disabled?: boolean;
    onDelete?: (v: any) => void;
    [key: string]: any; // Allow additional properties for flexibility
  }
}
