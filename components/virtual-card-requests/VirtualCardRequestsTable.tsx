import React from 'react';
import { useMutation } from '@apollo/client';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT, gql } from '../../lib/graphql/helpers';
import type { Account, VirtualCardRequest } from '../../lib/graphql/types/v2/graphql';
import { VirtualCardRequestStatus } from '../../lib/graphql/types/v2/graphql';
import { useWindowResize } from '../../lib/hooks/useWindowResize';
import { getSpendingLimitShortString } from '../../lib/i18n/virtual-card-spending-limit';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import { DataTable } from '../DataTable';
import DateTime from '../DateTime';
import EditVirtualCardModal from '../edit-collective/EditVirtualCardModal';
import { Box, Flex } from '../Grid';
import Loading from '../Loading';
import StyledTag from '../StyledTag';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/DropdownMenu';
import { TableActionsButton } from '../ui/Table';
import { useToast } from '../ui/useToast';

import VirtualCardRequestCard from './VirtualCardRequestCard';

const RejectVirtualCardRequestMutation = gql`
  mutation RejectVirtualCardRequest($virtualCardRequest: VirtualCardRequestReferenceInput!) {
    rejectVirtualCardRequest(virtualCardRequest: $virtualCardRequest) {
      id
      status
    }
  }
`;

function VirtualCardRequestTableActions({
  virtualCardRequest,
  onSelectedVirtualCardRequest,
}: {
  virtualCardRequest: VirtualCardRequest;
  onSelectedVirtualCardRequest: (virtualCardRequest: VirtualCardRequest) => void;
}) {
  const intl = useIntl();
  const { toast } = useToast();

  const [isVirtualCardModalOpen, setIsVirtualCardModalOpen] = React.useState(false);

  const [rejectRequestMutation, rejectRequestMutationResult] = useMutation(RejectVirtualCardRequestMutation, {
    context: API_V2_CONTEXT,
    variables: {
      virtualCardRequest: {
        id: virtualCardRequest.id,
      },
    },
  });

  const rejectRequest = React.useCallback(async () => {
    try {
      await rejectRequestMutation();
    } catch (e) {
      toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
    }
  }, [rejectRequestMutation, intl]);
  const loading = rejectRequestMutationResult.loading;

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TableActionsButton />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              onSelectedVirtualCardRequest(virtualCardRequest);
            }}
          >
            <FormattedMessage defaultMessage="View details" />
          </DropdownMenuItem>
          {virtualCardRequest.status === VirtualCardRequestStatus.PENDING && (
            <React.Fragment>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={loading}
                onClick={e => {
                  e.stopPropagation();
                  setIsVirtualCardModalOpen(true);
                }}
              >
                <FormattedMessage id="actions.approve" defaultMessage="Approve" />
              </DropdownMenuItem>
              <DropdownMenuItem disabled={loading} onClick={rejectRequest}>
                <FormattedMessage id="actions.reject" defaultMessage="Reject" />
              </DropdownMenuItem>
            </React.Fragment>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {isVirtualCardModalOpen && (
        <EditVirtualCardModal
          host={virtualCardRequest.host}
          collective={virtualCardRequest.account}
          onClose={() => setIsVirtualCardModalOpen(false)}
          onSuccess={() => setIsVirtualCardModalOpen(false)}
          virtualCardRequest={virtualCardRequest}
          virtualCard={{
            spendingLimitAmount: virtualCardRequest.spendingLimitAmount.valueInCents,
            spendingLimitInterval: virtualCardRequest.spendingLimitInterval,
            name: virtualCardRequest.purpose,
            assignee: virtualCardRequest.assignee,
          }}
        />
      )}
    </React.Fragment>
  );
}

type VirtualCardRequestsTableMeta = {
  onSelectedVirtualCardRequest: (virtualCardRequest: VirtualCardRequest) => void;
  intl: IntlShape;
};

const tableColumns: ColumnDef<VirtualCardRequest>[] = [
  {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Account" />,
    meta: { className: 'w-48' },

    cell: ({ cell }: CellContext<VirtualCardRequest, Account>) => {
      const account = cell.getValue();
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
    accessorKey: 'assignee',
    meta: { className: 'w-36' },

    header: () => <FormattedMessage defaultMessage="Assignee" />,
    cell: ({ cell, row }: CellContext<VirtualCardRequest, Account>) => {
      const assignee = cell.getValue();
      const virtualCardRequest = row.original;
      return (
        <AccountHoverCard
          account={assignee}
          includeAdminMembership={{ accountSlug: virtualCardRequest.account.slug }}
          trigger={
            <div className="flex items-center gap-2 truncate">
              <Avatar collective={assignee} radius={24} />
              <span className="truncate">{assignee.name}</span>
            </div>
          }
        />
      );
    },
  },
  {
    accessorKey: 'purpose',
    header: () => <FormattedMessage id="Fields.purpose" defaultMessage="Purpose" />,
    cell: ({ cell }: CellContext<VirtualCardRequest, string>) => {
      const purpose = cell.getValue();
      return <div className="truncate">{purpose}</div>;
    },
  },
  {
    accessorKey: 'createdAt',
    meta: { className: 'w-28' },
    header: () => <FormattedMessage id="VirtualCards.CreatedAt" defaultMessage="Created At" />,
    cell: ({ cell }: CellContext<VirtualCardRequest, string>) => {
      return (
        <div className="">
          <DateTime dateStyle="medium" value={cell.getValue()} />
        </div>
      );
    },
  },
  {
    accessorKey: 'spendingLimitAmount',
    meta: { className: 'w-32' },
    header: () => <FormattedMessage id="VirtualCards.SpendingLimit" defaultMessage="Spending Limit" />,
    cell: ({ row, table }) => {
      const vcr = row.original;
      const meta = table.options.meta as VirtualCardRequestsTableMeta;
      return getSpendingLimitShortString(meta.intl, vcr.currency, vcr.spendingLimitAmount, vcr.spendingLimitInterval, {
        LimitAmount: v => <span className="italic text-slate-600">{v}</span>,
        LimitInterval: v => <span className="italic text-slate-600">{v}</span>,
      });
    },
  },
  {
    accessorKey: 'status',
    meta: { className: 'w-28' },
    header: () => <FormattedMessage id="VirtualCards.Status" defaultMessage="Status" />,
    cell: ({ cell }: CellContext<VirtualCardRequest, string>) => {
      const status = cell.getValue();

      return (
        <StyledTag
          textTransform="uppercase"
          fontWeight="bold"
          fontSize="12px"
          type={
            status === VirtualCardRequestStatus.PENDING
              ? 'warning'
              : status === VirtualCardRequestStatus.APPROVED
                ? 'success'
                : 'error'
          }
        >
          {status}
        </StyledTag>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: () => '',
    meta: { className: 'w-14' },

    cell: ({ row, table }: CellContext<VirtualCardRequest, string>) => {
      const { onSelectedVirtualCardRequest } = table.options.meta as VirtualCardRequestsTableMeta;
      return (
        // Stop click propagation to prevent the row from being clicked
        // eslint-disable-next-line
        <div onClick={e => e.stopPropagation()}>
          <VirtualCardRequestTableActions
            virtualCardRequest={row.original}
            onSelectedVirtualCardRequest={onSelectedVirtualCardRequest}
          />
        </div>
      );
    },
  },
];

type VirtualCardRequestsTableProps = {
  virtualCardRequests: VirtualCardRequest[];
  loading?: boolean;
  onSelectedVirtualCardRequest: (virtualCardRequest: VirtualCardRequest) => void;
};

export function VirtualCardRequestsTable(props: VirtualCardRequestsTableProps) {
  const intl = useIntl();
  const [isTableView, setIsTableView] = React.useState(true);
  useWindowResize(() => setIsTableView(window.innerWidth > 1024));

  const virtualCardRequestsTableMeta: VirtualCardRequestsTableMeta = {
    onSelectedVirtualCardRequest: virtualCardRequest => {
      props?.onSelectedVirtualCardRequest(virtualCardRequest);
    },
    intl,
  };

  return (
    <React.Fragment>
      {isTableView ? (
        <DataTable
          data-cy="virtual-card-requests-table"
          innerClassName="table-fixed"
          columns={tableColumns}
          meta={virtualCardRequestsTableMeta}
          data={props.virtualCardRequests || []}
          loading={props.loading}
          onClickRow={row => props?.onSelectedVirtualCardRequest(row.original)}
          emptyMessage={() => (
            <p className="font-base">
              <FormattedMessage defaultMessage="No Virtual Card Requests" />
            </p>
          )}
        />
      ) : props.loading ? (
        <Loading />
      ) : (
        <Flex flexDirection="column" gap="8px">
          {props.virtualCardRequests.map(virtualCardRequest => {
            return (
              <Box key={virtualCardRequest.id}>
                <VirtualCardRequestCard
                  onClick={props.onSelectedVirtualCardRequest}
                  virtualCardRequest={virtualCardRequest}
                />
              </Box>
            );
          })}
        </Flex>
      )}
    </React.Fragment>
  );
}
