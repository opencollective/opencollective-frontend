import React from 'react';
import { ColumnDef, TableMeta } from '@tanstack/react-table';
import { Download, Eye } from 'lucide-react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';

import { LegalDocument } from '../../../../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../../../../lib/i18n/collective-type';

import { AccountHoverCard } from '../../../AccountHoverCard';
import Avatar from '../../../Avatar';
import { DataTable } from '../../../DataTable';
import DateTime from '../../../DateTime';
import StyledHr from '../../../StyledHr';
import StyledLinkButton from '../../../StyledLinkButton';
import { P } from '../../../Text';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../ui/DropdownMenu';
import { TableActionsButton } from '../../../ui/Table';

import { DownloadLegalDocument } from './DownloadLegalDocument';
import { LegalDocumentServiceBadge } from './LegalDocumentServiceBadge';
import { LegalDocumentStatusBadge } from './LegalDocumentStatusBadge';

interface LegalDocumentTableMeta extends TableMeta<LegalDocument> {
  onOpen: (document: LegalDocument) => void;
  intl: IntlShape;
}

const columns: ColumnDef<LegalDocument>[] = [
  {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Account" id="TwyMau" />,
    meta: { className: 'w-40 sm:w-56' },
    cell: ({ cell }) => {
      const account = cell.getValue() as LegalDocument['account'];
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
    accessorKey: 'account.type',
    header: () => <FormattedMessage defaultMessage="Account Type" id="K1uUiB" />,
    meta: { className: 'w-32' },
    cell: ({ table, cell }) => {
      const { intl } = table.options.meta as LegalDocumentTableMeta;
      const accountType = cell.getValue() as LegalDocument['account']['type'];
      return formatCollectiveType(intl, accountType);
    },
  },
  {
    accessorKey: 'requestedAt',
    header: () => <FormattedMessage defaultMessage="Requested at" id="LegalDocument.RequestedAt" />,
    meta: { className: 'w-32' },
    cell: ({ cell }) => {
      const requestedAt = cell.getValue() as LegalDocument['requestedAt'];
      return requestedAt ? (
        <span className="truncate">
          <DateTime value={requestedAt} dateStyle="medium" />
        </span>
      ) : (
        <span className="italic text-slate-500">
          <FormattedMessage defaultMessage="Never" id="du1laW" />
        </span>
      );
    },
  },
  {
    accessorKey: 'service',
    header: () => <FormattedMessage defaultMessage="Service" id="n7yYXG" />,
    meta: { className: 'w-40' },
    cell: ({ cell }) => {
      const service = cell.getValue() as LegalDocument['service'];
      return <LegalDocumentServiceBadge service={service} />;
    },
  },
  {
    accessorKey: 'status',
    header: () => <FormattedMessage defaultMessage="Status" id="LegalDocument.Status" />,
    meta: { className: 'w-32' },
    cell: ({ cell }) => {
      const status = cell.getValue() as LegalDocument['status'];
      return <LegalDocumentStatusBadge status={status} />;
    },
  },
  {
    accessorKey: 'actions',
    header: null,
    meta: { className: 'w-14' },
    cell: ({ table, row }) => {
      const { onOpen } = table.options.meta as LegalDocumentTableMeta;
      const document = row.original as LegalDocument;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TableActionsButton />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                onOpen(document);
              }}
            >
              <Eye size={16} />
              <FormattedMessage defaultMessage="View details" id="MnpUD7" />
            </DropdownMenuItem>
            {document.documentLink && (
              <DownloadLegalDocument legalDocument={document}>
                {({ download }) => (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      return download();
                    }}
                  >
                    <Download size={16} />
                    <FormattedMessage id="n+rgej" defaultMessage="Download {format}" values={{ format: 'PDF' }} />
                  </DropdownMenuItem>
                )}
              </DownloadLegalDocument>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

type LegalDocumentsTableProps = {
  documents: { nodes: LegalDocument[] };
  onOpen: (document: LegalDocument) => void;
  resetFilters?: () => void;
  loading?: boolean;
  nbPlaceholders?: number;
};

export default function LegalDocumentsTable({
  documents,
  onOpen,
  loading,
  nbPlaceholders,
  resetFilters,
}: LegalDocumentsTableProps) {
  const intl = useIntl();
  return (
    <DataTable
      data-cy="legal-documents-table"
      innerClassName="table-fixed"
      mobileTableView
      columns={columns}
      data={documents?.nodes || []}
      meta={{ onOpen, intl } as LegalDocumentTableMeta}
      loading={loading}
      nbPlaceholders={nbPlaceholders}
      onClickRow={row => onOpen(row.original)}
      emptyMessage={() => (
        <div>
          <P fontSize="16px">
            <FormattedMessage defaultMessage="No legal documents" id="n4TOEl" />
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
