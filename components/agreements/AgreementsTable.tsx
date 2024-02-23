import React from 'react';
import type { ColumnDef, TableMeta } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';

import type { Agreement } from '../../lib/graphql/types/v2/graphql';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import { DataTable } from '../DataTable';
import DateTime from '../DateTime';
import { Box } from '../Grid';
import StyledHr from '../StyledHr';
import StyledLinkButton from '../StyledLinkButton';
import { P } from '../Text';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/DropdownMenu';
import { TableActionsButton } from '../ui/Table';
import UploadedFilePreview from '../UploadedFilePreview';

interface AgreementMeta extends TableMeta<Agreement> {
  openAgreement: (agreement: Agreement) => void;
  onFilePreview: (agreement: Agreement) => void;
}

const columns: ColumnDef<Agreement>[] = [
  {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Account" />,
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
        <span className="italic text-slate-500">
          <FormattedMessage defaultMessage="Never" />
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
            className="hover:shadow"
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: null,
    meta: { className: 'w-14' },
    cell: ({ table, row }) => {
      const { openAgreement } = table.options.meta as AgreementMeta;
      const application = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TableActionsButton />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                openAgreement(application);
              }}
            >
              <FormattedMessage defaultMessage="View details" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
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
};

export default function AgreementsTable({
  agreements,
  openAgreement,
  loading,
  nbPlaceholders,
  resetFilters,
  onFilePreview,
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
      emptyMessage={() => (
        <div>
          <P fontSize="16px">
            <FormattedMessage defaultMessage="No agreements" />
          </P>
          {resetFilters && (
            <div>
              <StyledHr maxWidth={300} m="16px auto" borderColor="black.100" />
              <StyledLinkButton onClick={resetFilters}>
                <FormattedMessage defaultMessage="Reset filters" />
              </StyledLinkButton>
            </div>
          )}
        </div>
      )}
    />
  );
}
