import '@tanstack/react-table';

import type { OnChangeFn, Row, RowData, VisibilityState } from '@tanstack/react-table';
import type { RefObject } from 'react';
import type { IntlShape, MessageDescriptor } from 'react-intl';

import type { GetActions } from '../../lib/actions/types';
import { Account } from '../../lib/graphql/types/v2/graphql';
import type { useQueryFilterReturnType } from '../../lib/hooks/useQueryFilter';
declare module '@tanstack/react-table' {
  interface ColumnMeta {
    className?: string;
    labelMsg?: MessageDescriptor;
    align?: 'left' | 'right';
  }
  interface TableMeta<TData extends RowData> {
    intl?: IntlShape;
    queryFilter?: useQueryFilterReturnType<any>;
    setColumnVisibility?: OnChangeFn<VisibilityState>;
    columnVisibility?: VisibilityState;
    defaultColumnVisibility?: VisibilityState;
    hasDefaultColumnVisibility?: boolean;
    onClickRow?: (row: Row<TData>, actionsMenuTriggerRef?: RefObject<HTMLElement>) => void;
    getActions?: GetActions<TData>;

    // TODO: remove types below when all tables use getActions
    // Hosted Collectives table
    onEdit?: () => void;
    host?: Account;

    // AccountingCateriesTable
    disabled?: boolean;
    onDelete?: (v: any) => void;
  }
}
