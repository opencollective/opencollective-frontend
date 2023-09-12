import React from 'react';
import { ColumnDef, TableMeta } from '@tanstack/react-table';
import { FormattedMessage } from 'react-intl';

import { HostApplication, HostApplicationStatus } from '../../../lib/graphql/types/v2/graphql';

import Avatar from '../../Avatar';
import { DataTable } from '../../DataTable';
import DateTime from '../../DateTime';
import StyledHr from '../../StyledHr';
import StyledLinkButton from '../../StyledLinkButton';
import StyledTag from '../../StyledTag';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/DropdownMenu';
import { TableActionsButton } from '../../ui/Table';

interface ApplicationMeta extends TableMeta<HostApplication> {
  openApplication: (agreement: HostApplication) => void;
}

const StatusTag = ({ status }: { status: HostApplicationStatus }) => {
  const tagProps = { textTransform: 'uppercase', fontWeight: 700, fontSize: '12px' };

  switch (status) {
    case 'PENDING':
      return (
        <StyledTag {...tagProps} type="warning">
          <FormattedMessage id="Pending" defaultMessage="Pending" />
        </StyledTag>
      );
    case 'APPROVED':
      return (
        <StyledTag {...tagProps} type="success">
          <FormattedMessage id="PendingApplication.Approved" defaultMessage="Approved" />
        </StyledTag>
      );
    case 'REJECTED':
      return (
        <StyledTag {...tagProps} type="error">
          <FormattedMessage id="PendingApplication.Rejected" defaultMessage="Rejected" />
        </StyledTag>
      );
    default:
      return null;
  }
};

export const columns: ColumnDef<HostApplication>[] = [
  {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Account" />,
    meta: { className: 'w-56' },
    cell: ({ cell }) => {
      const account = cell.getValue() as HostApplication['account'];

      return (
        <div className="flex items-center gap-2 truncate" id={`application-${account.legacyId}`}>
          <Avatar collective={account} radius={24} />
          <span className="truncate">{account.name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: 'account.admins',
    meta: { className: 'w-24' },
    header: () => <FormattedMessage id="Admins" defaultMessage="Admins" />,
    cell: ({ cell }) => {
      const admins = cell.getValue() as HostApplication['account']['members'];

      return (
        <div className="flex items-center -space-x-1">
          {admins.nodes.slice(0, 3).map(admin => (
            <Avatar key={admin.id} collective={admin.account} radius={24} />
          ))}
          {admins.totalCount > 3 && <div className="pl-2 text-slate-600">+{admins.totalCount - 3}</div>}
        </div>
      );
    },
  },
  {
    accessorKey: 'message',
    meta: { className: 'w-24 md:w-auto' },
    header: () => <FormattedMessage id="Contact.Message" defaultMessage="Message" />,
    cell: ({ cell }) => {
      const message = cell.getValue() as HostApplication['message'];
      return (
        <div className="truncate">
          <p className="truncate italic">{message}</p>
        </div>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    meta: { className: 'w-32' },
    header: () => <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />,
    cell: ({ cell }) => {
      const createdAt = cell.getValue() as HostApplication['createdAt'];

      return (
        <div className="whitespace-nowrap">
          <DateTime dateStyle="medium" value={createdAt} />
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    meta: { className: 'w-28' },
    header: () => <FormattedMessage defaultMessage="Status" />,
    cell: ({ cell }) => {
      const status = cell.getValue() as HostApplication['status'];
      return (
        <div className="flex">
          <StatusTag status={status} />
        </div>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: null,
    meta: { className: 'w-14' },
    cell: ({ table, row }) => {
      const { openApplication } = table.options.meta as ApplicationMeta;
      const application = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <TableActionsButton data-Cy={`${application.account.slug}-table-actions`} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                openApplication(application);
              }}
              data-Cy={`${application.account.slug}-view-details`}
            >
              <FormattedMessage defaultMessage="View details" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

type ApplicationsTableProps = {
  hostApplications: { nodes: HostApplication[] };
  openApplication: (application: HostApplication) => void;
  resetFilters?: () => void;
  loading?: boolean;
  nbPlaceholders?: number;
};

export default function HostApplicationsTable({
  hostApplications,
  openApplication,
  loading,
  nbPlaceholders,
  resetFilters,
}: ApplicationsTableProps) {
  return (
    <DataTable
      data-cy="host-applications-table"
      innerClassName="table-fixed"
      columns={columns}
      data={hostApplications?.nodes || []}
      meta={{ openApplication } as ApplicationMeta}
      loading={loading}
      nbPlaceholders={nbPlaceholders}
      onClickRow={row => openApplication(row.original)}
      mobileTableView
      emptyMessage={() => (
        <div>
          <p className="text-base">
            <FormattedMessage defaultMessage="No applications" />
          </p>
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
