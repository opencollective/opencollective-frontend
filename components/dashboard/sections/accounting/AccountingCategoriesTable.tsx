import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { Edit, Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { CollectiveType } from '../../../../lib/constants/collectives';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import type {
  AccountingCategoryTableQuery,
  AccountingCategoryTableQueryVariables,
} from '../../../../lib/graphql/types/v2/graphql';
import type { AccountingCategory } from '../../../../lib/graphql/types/v2/schema';
import { AccountingCategoryKind } from '../../../../lib/graphql/types/v2/schema';
import { i18nExpenseType } from '../../../../lib/i18n/expense';

import { I18nItalic } from '../../../I18nFormatters';
import Loading from '../../../Loading';
import { DataTable } from '../../../table/DataTable';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import { TableActionsButton } from '../../../ui/Table';

import { AccountingCategoryDrawer } from './AccountingCategoryDrawer';
import type { EditableAccountingCategoryFields } from './AccountingCategoryForm';
import { AccountingCategoryAppliesToI18n, AccountingCategoryKindI18n } from './AccountingCategoryForm';

type AccountingCategoriesTableMeta = {
  disabled?: boolean;
  onDelete: (category: AccountingCategory) => void;
  onRowEdit: (category: AccountingCategory) => void;
};

const columns = [
  {
    accessorKey: 'code',
    header: () => <FormattedMessage id="AccountingCategory.code" defaultMessage="Code" />,
    meta: { input: { required: true, maxLength: 255 } },
    cell: ({ cell }) => {
      return (
        <div className="inline-block rounded-xl bg-slate-50 px-2 py-1 font-bold text-slate-800">{cell.getValue()}</div>
      );
    },
  },
  {
    accessorKey: 'name',
    header: () => (
      <FormattedMessage defaultMessage="Name <i>· Friendly name</i>" id="5xKiMX" values={{ i: I18nItalic }} />
    ),
    meta: { input: { required: true, maxLength: 255 } },
    cell: ({ cell, row }) => {
      return (
        <div className="inline-block rounded-xl bg-slate-50 px-2 py-1 font-bold text-slate-800">
          {cell.getValue()}
          {row.original.friendlyName && (
            <span className="font-normal text-slate-700 italic">&nbsp;·&nbsp;{row.original.friendlyName}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'hostOnly',
    header: () => <FormattedMessage defaultMessage="Visible only to host admins" id="NvBPFR" />,
    cell: ({ cell }) => {
      return cell.getValue() ? (
        <FormattedMessage defaultMessage="Yes" id="a5msuh" />
      ) : (
        <FormattedMessage defaultMessage="No" id="oUWADl" />
      );
    },
  },
  {
    accessorKey: 'kind',
    header: () => <FormattedMessage defaultMessage="Kind" id="Transaction.Kind" />,
    cell: ({ cell }) => {
      return <FormattedMessage {...AccountingCategoryKindI18n[cell.getValue()]} />;
    },
  },
  {
    accessorKey: 'appliesTo',
    header: () => <FormattedMessage defaultMessage="Applies to" id="6WqHWi" />,
    cell: ({ cell }) => {
      const value = cell.getValue();
      return <FormattedMessage {...AccountingCategoryAppliesToI18n[value || 'ALL']} />;
    },
  },
  {
    accessorKey: 'expensesTypes',
    header: () => <FormattedMessage defaultMessage="Expense types" id="7oAuzt" />,
    cell: ({ cell, row }) => {
      function CellContent() {
        const intl = useIntl();
        return cell.getValue() === null
          ? intl.formatMessage({ id: 'AllExpenses', defaultMessage: 'All expenses' })
          : cell
              .getValue()
              .map(value => i18nExpenseType(intl, value))
              .join(', ');
      }

      if (row.original.kind !== AccountingCategoryKind.EXPENSE) {
        return '-';
      }

      return <CellContent />;
    },
  },
  {
    accessorKey: 'actions',
    header: null,
    meta: { className: 'w-14' },
    cell: ({ table, row }) => {
      if (table.options.meta.disabled) {
        return null;
      }
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TableActionsButton />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={e => {
                (table.options.meta as AccountingCategoriesTableMeta).onRowEdit(row.original);
                e.stopPropagation();
              }}
            >
              <Edit size={16} />
              <FormattedMessage id="Edit" defaultMessage="Edit" />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer text-red-500"
              onClick={e => {
                (table.options.meta as AccountingCategoriesTableMeta).onDelete(row.original);
                e.stopPropagation();
              }}
            >
              <Trash2 size={16} />
              <FormattedMessage id="actions.delete" defaultMessage="Delete" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

type AccountingCategoriesTableProps = {
  hostSlug: string;
  accountingCategories: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>[];
  loading?: boolean;
  isFiltered?: boolean;
  isAdmin?: boolean;
  onDelete: (category: AccountingCategory) => void;
  onEdit: (category: Pick<AccountingCategory, 'id' | EditableAccountingCategoryFields>) => void;
};

export function AccountingCategoriesTable(props: AccountingCategoriesTableProps) {
  const [selectedCategoryId, setSelectedCategoryId] = React.useState(null);
  const [isInitiallyEditing, setIsInitiallyEditing] = React.useState(false);

  const selectedCategory = React.useMemo(
    () => selectedCategoryId && props.accountingCategories.find(c => c.id === selectedCategoryId),
    [selectedCategoryId, props.accountingCategories],
  );

  const query = useQuery<AccountingCategoryTableQuery, AccountingCategoryTableQueryVariables>(
    gql`
      query AccountingCategoryTable($hostSlug: String!) {
        host(slug: $hostSlug) {
          id
          type
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
      variables: {
        hostSlug: props.hostSlug,
      },
    },
  );

  const isIndependentCollective = query.data?.host?.type === CollectiveType.COLLECTIVE;

  const visibleColumns = React.useMemo(
    () => (isIndependentCollective ? columns.filter(c => c.accessorKey !== 'appliesTo') : columns),
    [isIndependentCollective],
  );

  if (query.loading) {
    return <Loading />;
  }

  return (
    <React.Fragment>
      <DataTable
        loading={props.loading}
        nbPlaceholders={10}
        columns={visibleColumns}
        data={props.accountingCategories}
        emptyMessage={
          props.isFiltered
            ? () => <FormattedMessage defaultMessage="No chart of accounts found" id="9DNi/v" />
            : () => <FormattedMessage defaultMessage="No chart of accounts" id="dSDEnR" />
        }
        meta={
          {
            disabled: !props.isAdmin,
            onDelete: props.onDelete,
            onRowEdit: category => {
              setSelectedCategoryId(category.id);
              setIsInitiallyEditing(true);
            },
          } as AccountingCategoriesTableMeta
        }
        onClickRow={row => setSelectedCategoryId(row.original.id)}
      />
      <AccountingCategoryDrawer
        isIndependentCollective={isIndependentCollective}
        open={!!selectedCategory}
        accountingCategory={selectedCategory}
        onClose={() => setSelectedCategoryId(null)}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
        isInitiallyEditing={isInitiallyEditing}
      />
    </React.Fragment>
  );
}
