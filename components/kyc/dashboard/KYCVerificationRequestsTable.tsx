import React from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { useIntl } from 'react-intl';

import type {
  AccountHoverCardFieldsFragment,
  KycVerificationCollectionFieldsFragment,
  KycVerificationStatus,
} from '@/lib/graphql/types/v2/graphql';
import type { KycProvider } from '@/lib/graphql/types/v2/schema';

import Avatar from '@/components/Avatar';
import DateTime from '@/components/DateTime';
import { actionsColumn, DataTable } from '@/components/table/DataTable';

import { useKYCVerificationActions } from '../actions/useKYCVerificationActions';
import { KYCVerificationDrawer } from '../drawer/KYCVerificationDrawer';
import { KYCVerificationProviderBadge } from '../drawer/KYCVerificationProviderBadge';
import { KYCVerificationStatusBadge } from '../KYCVerificationStatusBadge';

export type KYCVerificationRow = KycVerificationCollectionFieldsFragment['nodes'][number] & {
  account: AccountHoverCardFieldsFragment;
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
    header: intl.formatMessage({ defaultMessage: 'Account', id: 'TwyMau' }),
    cell: ({ row }) => {
      const account = row.original.account;
      return (
        <div className="flex items-center text-nowrap">
          <Avatar size={24} collective={account} mr={2} />
          {account.name}
        </div>
      );
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

  return [account, status, provider, requestedAt, verifiedAt, revokedAt, actionsColumn];
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
