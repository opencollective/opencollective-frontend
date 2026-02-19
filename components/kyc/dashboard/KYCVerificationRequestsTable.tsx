import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useIntl } from 'react-intl';

import type {
  AccountHoverCardFieldsFragment,
  KycProvider,
  KycVerificationCollectionFieldsFragment,
} from '@/lib/graphql/types/v2/graphql';
import { KycVerificationStatus } from '@/lib/graphql/types/v2/graphql';

import { AccountHoverCard } from '@/components/AccountHoverCard';
import Avatar from '@/components/Avatar';
import DateTime from '@/components/DateTime';
import { actionsColumn, DataTable } from '@/components/table/DataTable';

import { useKYCVerificationActions } from '../actions/useKYCVerificationActions';
import { KYCVerificationDrawer } from '../drawer/KYCVerificationDrawer';
import { KYCVerificationProviderBadge } from '../drawer/KYCVerificationProviderBadge';
import { KYCVerificationStatusBadge } from '../KYCVerificationStatusBadge';

export type KYCVerificationRow = KycVerificationCollectionFieldsFragment['nodes'][number] & {
  account: AccountHoverCardFieldsFragment;
  createdByUser?: AccountHoverCardFieldsFragment;
};

function dateCell({ cell }) {
  const date = cell.getValue();
  return date ? (
    <span className="truncate">
      <DateTime value={date} dateStyle="medium" />
    </span>
  ) : (
    <span className="text-slate-500 italic">-</span>
  );
}

function getKYCVerificationColumns({ intl }): ColumnDef<KYCVerificationRow>[] {
  const account: ColumnDef<KYCVerificationRow> = {
    accessorKey: 'account',
    header: intl.formatMessage({ defaultMessage: 'Name', id: 'Fields.name' }),
    cell: ({ row }) => {
      const account = row.original.account;
      const mainName = account.legalName || account.name;
      const hasSecondaryName = account.legalName && account.name && account.legalName !== account.name;
      const secondaryName = hasSecondaryName && (account.name || account.legalName);
      return (
        <AccountHoverCard
          account={account}
          trigger={
            <div className="flex items-center text-nowrap">
              <Avatar size={24} collective={account} mr={2} />
              <div className="flex flex-col">
                <span className="max-w-[200px] truncate">{mainName}</span>
                {secondaryName && (
                  <span className="max-w-[200px] truncate text-xs text-slate-500 italic">{secondaryName}</span>
                )}
              </div>
            </div>
          }
        />
      );
    },
  };

  const verifiedName: ColumnDef<KYCVerificationRow> = {
    accessorKey: 'verifiedData.legalName',
    header: intl.formatMessage({ defaultMessage: 'Verified Name', id: 'EFK89S' }),
    meta: { className: 'max-w-40' },
    cell: ({ cell, row }) => {
      if (row.original.status === KycVerificationStatus.VERIFIED) {
        return (
          <div title={cell.getValue() as string} className="truncate overflow-hidden">
            {cell.getValue() as string}
          </div>
        );
      }

      return <span className="text-slate-500 italic">-</span>;
    },
  };

  const requestedAt: ColumnDef<KYCVerificationRow> = {
    accessorKey: 'requestedAt',
    header: intl.formatMessage({ id: 'LegalDocument.RequestedAt', defaultMessage: 'Requested at' }),
    cell: dateCell,
  };
  const verifiedAt: ColumnDef<KYCVerificationRow> = {
    accessorKey: 'verifiedAt',
    header: intl.formatMessage({ defaultMessage: 'Verified at', id: 'CJrQQ0' }),
    cell: dateCell,
  };
  const revokedAt: ColumnDef<KYCVerificationRow> = {
    accessorKey: 'revokedAt',
    header: intl.formatMessage({ defaultMessage: 'Revoked at', id: 'PDbgKg' }),
    cell: dateCell,
  };

  const status: ColumnDef<KYCVerificationRow> = {
    accessorKey: 'status',
    header: intl.formatMessage({ defaultMessage: 'Status', id: 'tzMNF3' }),
    cell: ({ cell }) => <KYCVerificationStatusBadge status={cell.getValue() as KycVerificationStatus} />,
  };

  const provider: ColumnDef<KYCVerificationRow> = {
    accessorKey: 'provider',
    header: intl.formatMessage({ defaultMessage: 'Provider', id: 'xaj9Ba' }),
    cell: ({ cell }) => <KYCVerificationProviderBadge provider={cell.getValue() as KycProvider} />,
  };

  const createdByUser: ColumnDef<KYCVerificationRow> = {
    accessorKey: 'createdByUser',
    header: intl.formatMessage({ defaultMessage: 'Added by', id: 'KYC.AddedBy' }),
    cell: ({ row }) => {
      const createdByUser = row.original.createdByUser;
      if (!createdByUser) {
        return <span className="text-slate-500 italic">-</span>;
      }

      return (
        <AccountHoverCard
          account={createdByUser}
          trigger={
            <div className="flex items-center text-nowrap">
              <Avatar size={24} collective={createdByUser} mr={2} />
              <span className="max-w-[200px] truncate">{createdByUser.name}</span>
            </div>
          }
        />
      );
    },
  };

  return [account, verifiedName, status, provider, createdByUser, requestedAt, verifiedAt, revokedAt, actionsColumn];
}

type KYCVerificationRequestsTableProps = {
  loading?: boolean;
  data: KYCVerificationRow[];
  nbPlaceholders?: number;
  refetchQueries?: string[];
};

export function KYCVerificationRequestsTable(props: KYCVerificationRequestsTableProps) {
  const intl = useIntl();

  const columns = React.useMemo(() => getKYCVerificationColumns({ intl }), [intl]);

  const [openKYCVerificationId, setOpenKYCVerificationId] = React.useState<string | null>(null);

  const getActions = useKYCVerificationActions({ refetchQueries: props.refetchQueries });

  const openKYCVerification = React.useMemo(
    () => props.data.find(verification => verification.id === openKYCVerificationId),
    [props.data, openKYCVerificationId],
  );

  return (
    <React.Fragment>
      <DataTable<KYCVerificationRow, KYCVerificationRow>
        loading={props.loading}
        columns={columns}
        data={props.data}
        nbPlaceholders={props.nbPlaceholders}
        onClickRow={row => setOpenKYCVerificationId(row.original.id)}
        mobileTableView
        getActions={getActions}
      />
      <KYCVerificationDrawer
        open={Boolean(openKYCVerification)}
        verification={openKYCVerification}
        onClose={() => setOpenKYCVerificationId(null)}
        getActions={getActions}
      />
    </React.Fragment>
  );
}
