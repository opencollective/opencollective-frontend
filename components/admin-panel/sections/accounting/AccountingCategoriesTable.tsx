import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { AccountingCategory } from '../../../../lib/graphql/types/v2/graphql';
import { AccountingCategoryKind } from '../../../../lib/graphql/types/v2/graphql';
import { i18nExpenseType } from '../../../../lib/i18n/expense';

import { DataTable } from '../../../DataTable';
import { I18nItalic } from '../../../I18nFormatters';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import { TableActionsButton } from '../../../ui/Table';

import { AccountingCategoryDrawer } from './AccountingCategoryDrawer';
import type { EditableAccountingCategoryFields } from './AccountingCategoryForm';
import { AccountingCategoryKindI18n } from './AccountingCategoryForm';

type AccountingCategoriesTableMeta = {
  disabled?: boolean;
  onDelete: (category: AccountingCategory) => void;
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
    header: () => <FormattedMessage defaultMessage="Name <i>· Friendly name</i>" values={{ i: I18nItalic }} />,
    meta: { input: { required: true, maxLength: 255 } },
    cell: ({ cell, row }) => {
      return (
        <div className="inline-block rounded-xl bg-slate-50 px-2 py-1 font-bold text-slate-800">
          {cell.getValue()}
          {row.original.friendlyName && (
            <span className="font-normal italic text-slate-700">&nbsp;·&nbsp;{row.original.friendlyName}</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'hostOnly',
    header: () => <FormattedMessage defaultMessage="Host Only" />,
    cell: ({ cell }) => {
      return cell.getValue() ? <FormattedMessage defaultMessage="Yes" /> : <FormattedMessage defaultMessage="No" />;
    },
  },
  {
    accessorKey: 'kind',
    header: () => <FormattedMessage defaultMessage="Applies to" />,
    cell: ({ cell }) => {
      return <FormattedMessage {...AccountingCategoryKindI18n[cell.getValue()]} />;
    },
  },
  {
    accessorKey: 'expensesTypes',
    header: () => <FormattedMessage defaultMessage="Expense types" />,
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
              className="cursor-pointer text-red-500"
              onClick={() => (table.options.meta as AccountingCategoriesTableMeta).onDelete(row.original)}
            >
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

  const selectedCategory = React.useMemo(
    () => selectedCategoryId && props.accountingCategories.find(c => c.id === selectedCategoryId),
    [selectedCategoryId, props.accountingCategories],
  );
  return (
    <React.Fragment>
      <DataTable
        loading={props.loading}
        nbPlaceholders={10}
        columns={columns}
        data={props.accountingCategories}
        emptyMessage={
          props.isFiltered
            ? () => <FormattedMessage defaultMessage="No chart of accounts found" />
            : () => <FormattedMessage defaultMessage="No chart of accounts" />
        }
        meta={
          {
            disabled: !props.isAdmin,
            onDelete: props.onDelete,
          } as AccountingCategoriesTableMeta
        }
        onClickRow={row => setSelectedCategoryId(row.original.id)}
      />
      <AccountingCategoryDrawer
        open={!!selectedCategory}
        accountingCategory={selectedCategory}
        onClose={() => setSelectedCategoryId(null)}
        onEdit={props.onEdit}
        onDelete={props.onDelete}
      />
    </React.Fragment>
  );
}
