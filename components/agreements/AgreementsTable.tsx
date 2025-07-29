import React from 'react';
import type { ColumnDef, TableMeta } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';

import type { GetActions } from '../../lib/actions/types';
import type { Agreement } from '../../lib/graphql/types/v2/schema';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import DateTime from '../DateTime';
import { Box } from '../Grid';
import StyledHr from '../StyledHr';
import StyledLinkButton from '../StyledLinkButton';
import { actionsColumn, DataTable } from '../table/DataTable';
import { P } from '../Text';
import UploadedFilePreview from '../UploadedFilePreview';

interface AgreementMeta extends TableMeta<Agreement> {
  openAgreement: (agreement: Agreement) => void;
  onFilePreview: (agreement: Agreement) => void;
}

const columns: ColumnDef<Agreement>[] = [
  {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Account" id="TwyMau" />,
    meta: { className: 'w-40 sm:w-56' },

    cell: ({ cell }) => {
      const account = cell.getValue() as Agreement['account'];
      return (
        <AccountHoverCard
          account={account}
          trigger={
            <div className="flex items-center gap-2 truncate">
              <Avatar collective={account} radius={24} />
              <span className="truncate">{account.name}</span>
            </div>
          }
        />
      );
    },
  },
  {
    accessorKey: 'title',
    meta: { className: 'w-32 sm:w-auto' },
    header: () => <FormattedMessage id="Title" defaultMessage="Title" />,
    cell: ({ cell }) => {
      const title = cell.getValue() as Agreement['title'];
      return <div className="truncate">{title}</div>;
    },
  },

  {
    accessorKey: 'expiresAt',
    header: () => <FormattedMessage id="Agreement.expiresAt" defaultMessage="Expires" />,
    meta: { className: 'w-32' },

    cell: ({ cell }) => {
      const expiresAt = cell.getValue() as Agreement['expiresAt'];
      return expiresAt ? (
        <span className="truncate">
          <DateTime value={expiresAt} dateStyle="medium" />
        </span>
      ) : (
        <span className="text-slate-500 italic">
          <FormattedMessage defaultMessage="Never" id="du1laW" />
        </span>
      );
    },
  },
  {
    accessorKey: 'attachment',
    header: () => <FormattedMessage id="Expense.Attachment" defaultMessage="Attachment" />,
    meta: { className: 'w-20' },
    cell: ({ row, table }) => {
      const agreement = row.original as Agreement;
      const attachment = agreement.attachment;
      if (!attachment?.url) {
        return <Box size={32} />;
      }

      const meta = table.options.meta as AgreementMeta;
      return (
        <div className="flex justify-end">
          <UploadedFilePreview
            url={attachment?.url}
            size={32}
            borderRadius="8px"
            openFileViewer={() => meta?.onFilePreview(agreement)}
            className="hover:shadow-sm"
          />
        </div>
      );
    },
  },
  {
    ...actionsColumn,
    meta: { className: 'w-24 text-right' },
    header: () => {
      return <FormattedMessage defaultMessage="Actions" id="CollectivePage.NavBar.ActionMenu.Actions" />;
    },
  },
];

type AgreementsTableProps = {
  agreements: { nodes: Agreement[] };
  openAgreement: (agreement: Agreement) => void;
  resetFilters?: () => void;
  loading?: boolean;
  nbPlaceholders?: number;
  onFilePreview?: (agreement: Agreement) => void;
  getActions?: GetActions<Agreement>;
};

export default function AgreementsTable({
  agreements,
  openAgreement,
  loading,
  nbPlaceholders,
  resetFilters,
  onFilePreview,
  getActions,
}: AgreementsTableProps) {
  return (
    <DataTable
      data-cy="agreements-table"
      innerClassName="table-fixed"
      mobileTableView
      columns={columns}
      data={agreements?.nodes || []}
      meta={{ openAgreement, onFilePreview } as AgreementMeta}
      loading={loading}
      nbPlaceholders={nbPlaceholders}
      onClickRow={row => openAgreement(row.original)}
      getActions={getActions}
      emptyMessage={() => (
        <div>
          <P fontSize="16px">
            <FormattedMessage defaultMessage="No agreements" id="7eGjv6" />
          </P>
          {resetFilters && (
            <div>
              <StyledHr maxWidth={300} m="16px auto" borderColor="black.100" />
              <StyledLinkButton onClick={resetFilters}>
                <FormattedMessage defaultMessage="Reset filters" id="jZ0o74" />
              </StyledLinkButton>
            </div>
          )}
        </div>
      )}
    />
  );
}
