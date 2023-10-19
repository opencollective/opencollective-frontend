import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { cloneDeep, get, isEqual, pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../../../lib/errors';
import { API_V2_CONTEXT } from '../../../../lib/graphql/helpers';
import useWarnIfUnsavedChanges from '../../../../lib/hooks/warnIfUnsavedChanges';

import { DataTable } from '../../../DataTable';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { Button } from '../../../ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import { TableActionsButton } from '../../../ui/Table';
import { useToast } from '../../../ui/useToast';

type AccountingCategoriesTableProps = {
  hostSlug: string;
};

type AccountingCategoriesTableMeta = {
  remove: (rowIndex: number) => void;
  update: (rowIndex: number, accessorKey: string, value: string) => void;
  disabled?: boolean;
};

const accountingCategoriesQuery = gql`
  query AdminAccountingCategoriesQuery($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      accountingCategories {
        totalCount
        nodes {
          id
          code
          name
          friendlyName
        }
      }
    }
  }
`;

// TODO adapt for host types other than organization
const editAccountingCategoryMutation = gql`
  mutation EditAccountingCategories($hostSlug: String!, $categories: [AccountingCategoryInput!]!) {
    editAccountingCategories(account: { slug: $hostSlug }, categories: $categories) {
      id
      ... on Organization {
        host {
          id
          accountingCategories {
            totalCount
            nodes {
              id
              code
              name
              friendlyName
            }
          }
        }
      }
    }
  }
`;

const EditableCell = ({ getValue, row, column, table }) => {
  const initialValue = getValue();
  const [value, setValue] = React.useState(initialValue);

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const placeholderPath = column.columnDef.meta?.placeholderPath;
  const placeholder = placeholderPath ? get(row.original, placeholderPath) : column.columnDef.header;
  return (
    <input
      placeholder={placeholder}
      {...column.columnDef.meta?.input}
      className="w-full rounded p-2 outline-[--primary-color-300]"
      value={value}
      onChange={e => table.options.meta.update(row.index, column.id, e.target.value)}
      disabled={table.options.meta.disabled}
    />
  );
};

const columns = [
  {
    accessorKey: 'code',
    header: () => <FormattedMessage id="AccountingCategory.code" defaultMessage="Code" />,
    cell: EditableCell,
    meta: { input: { required: true, maxLength: 255 } },
  },
  {
    accessorKey: 'name',
    header: () => <FormattedMessage id="Fields.name" defaultMessage="Name" />,
    cell: EditableCell,
    meta: { input: { required: true, maxLength: 255 } },
  },
  {
    accessorKey: 'friendlyName',
    header: () => <FormattedMessage id="AccountingCategory.friendlyName" defaultMessage="Friendly name" />,
    cell: EditableCell,
    meta: { placeholderPath: 'name', maxLength: 255 },
  },
  {
    accessorKey: 'actions',
    header: null,
    meta: { className: 'w-14' },
    cell: ({ cell, table }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TableActionsButton />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              className="cursor-pointer text-red-500"
              onClick={() => (table.options.meta as AccountingCategoriesTableMeta).remove(cell.row.index)}
            >
              <FormattedMessage id="actions.delete" defaultMessage="Delete" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

const DEFAULT_CATEGORY = { code: '', name: '', friendlyName: '' };

export const AccountingCategoriesTable = ({ hostSlug }: AccountingCategoriesTableProps) => {
  const intl = useIntl();
  const { toast } = useToast();
  const tableRef = React.useRef(null);
  const [rowIdxToFocus, setRowIdxToFocus] = React.useState<number | null>(null);
  const graphQLParams = { context: API_V2_CONTEXT, variables: { hostSlug } };
  const { data, error, loading } = useQuery(accountingCategoriesQuery, graphQLParams);
  const categoriesFromData = get(data, 'host.accountingCategories.nodes', []);
  const [categories, setCategories] = React.useState(categoriesFromData);
  const [editAccountingCategories, { loading: submitting }] = useMutation(
    editAccountingCategoryMutation,
    graphQLParams,
  );

  // Show a warning if the user tries to leave the page with unsaved changes
  const isSaved = isEqual(categories, categoriesFromData);
  useWarnIfUnsavedChanges(isSaved);

  // (Re)load the categories when fresh data is available
  React.useEffect(() => {
    setCategories(categoriesFromData);
  }, [categoriesFromData]);

  // Focus the first input of the last row when adding a new row
  React.useEffect(() => {
    if (rowIdxToFocus !== null && tableRef.current) {
      const firstInput = tableRef.current.querySelector(`tbody tr:nth-child(${rowIdxToFocus + 1}) input`);
      if (firstInput) {
        firstInput.focus();
      }
    }
  }, [rowIdxToFocus]);

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <form
      onSubmit={async e => {
        e.preventDefault();
        try {
          const cleanCategories = categories.map(category => pick(category, ['id', 'code', 'name', 'friendlyName']));
          await editAccountingCategories({ variables: { categories: cleanCategories } });
          toast({ variant: 'success', message: intl.formatMessage({ id: 'saved', defaultMessage: 'Saved' }) });
        } catch (e) {
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      }}
    >
      <DataTable
        tableRef={tableRef}
        loading={loading}
        nbPlaceholders={10}
        columns={columns}
        data={categories}
        emptyMessage={() => <FormattedMessage defaultMessage="No chart of accounts" />}
        meta={
          {
            remove: rowIndex => {
              setRowIdxToFocus(null);
              setCategories(categories => {
                const newData = [...categories];
                newData.splice(rowIndex, 1);
                return newData;
              });
            },
            update: (rowIndex, accessorKey, value) => {
              setCategories(categories => {
                const newData = cloneDeep(categories);
                newData[rowIndex][accessorKey] = value;
                return newData;
              });
            },
          } as AccountingCategoriesTableMeta
        }
        footer={
          <div className="flex justify-end space-x-2 border-t border-slate-200 px-4 py-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                // Add one row and focus its first input
                setCategories([...categories, cloneDeep(DEFAULT_CATEGORY)]);
                setRowIdxToFocus(categories.length);
              }}
            >
              + <FormattedMessage id="accountingCategory.add" defaultMessage="Add new" />
            </Button>
            <Button type="submit" size="sm" disabled={isSaved} loading={submitting} className="min-w-[60px]">
              <FormattedMessage id="save" defaultMessage="Save" />
            </Button>
          </div>
        }
      />
    </form>
  );
};
