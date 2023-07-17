import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { themeGet } from '@styled-system/theme-get';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon } from 'lucide-react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { Account, VirtualCardRequest, VirtualCardRequestStatus } from '../../lib/graphql/types/v2/graphql';
import { useWindowResize } from '../../lib/hooks/useWindowResize';
import { getSpendingLimitShortString } from '../../lib/i18n/virtual-card-spending-limit';

import Avatar from '../Avatar';
import { DataTable } from '../DataTable';
import DateTime from '../DateTime';
import EditVirtualCardModal from '../edit-collective/EditVirtualCardModal';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import Loading from '../Loading';
import PopupMenu from '../PopupMenu';
import StyledHr from '../StyledHr';
import StyledRoundButton from '../StyledRoundButton';
import StyledTag from '../StyledTag';
import { P, Span } from '../Text';
import { TOAST_TYPE, useToasts } from '../ToastProvider';

import VirtualCardRequestCard from './VirtualCardRequestCard';

const Action = styled.button`
  padding: 8px;
  margin: 0 8px;
  cursor: pointer;
  line-height: 16px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  background: transparent;
  outline: none;
  text-align: inherit;
  text-transform: capitalize;

  color: ${props => props.theme.colors.black[800]};

  :hover {
    color: ${props => props.theme.colors.black[700]};
  }

  :focus {
    color: ${props => props.theme.colors.black[700]};
    text-decoration: underline;
  }

  svg {
    margin-right: 8px;
    vertical-align: text-top;
  }
`;

const RejectVirtualCardRequestMutation = gql`
  mutation RejectVirtualCardRequest($virtualCardRequest: VirtualCardRequestReferenceInput!) {
    rejectVirtualCardRequest(virtualCardRequest: $virtualCardRequest) {
      id
      status
    }
  }
`;

function VirtualCardRequestTableActions({ virtualCardRequest }: { virtualCardRequest: VirtualCardRequest }) {
  const intl = useIntl();
  const { addToast } = useToasts();

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
      addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
    }
  }, [rejectRequestMutation, intl]);
  const loading = rejectRequestMutationResult.loading;

  return (
    <React.Fragment>
      <PopupMenu
        placement="bottom-start"
        Button={({ onClick }) => (
          <StyledRoundButton size={24} color="#C4C7CC" onClick={onClick}>
            <MoreHorizontalIcon size={12} color="#76777A" />
          </StyledRoundButton>
        )}
      >
        <Flex flexDirection="column">
          {virtualCardRequest.status === VirtualCardRequestStatus.PENDING && (
            <React.Fragment>
              <Action disabled={loading} onClick={() => setIsVirtualCardModalOpen(true)}>
                <FormattedMessage id="actions.approve" defaultMessage="Approve" />
              </Action>
              <StyledHr borderColor="black.100" my={2} mx={2} />
              <Action disabled={loading} onClick={rejectRequest}>
                <FormattedMessage id="actions.reject" defaultMessage="Reject" />
              </Action>
            </React.Fragment>
          )}
        </Flex>
      </PopupMenu>
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

const CellButton = styled.button`
  border: 0;
  width: 100%;
  outline: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 16px;
  font-weight: 500;
  color: ${themeGet('colors.black.900')};
  &:hover,
  :focus-visible {
    .title {
      text-decoration: underline;
    }
  }
`;

type VirtualCardRequestsTableMeta = {
  onSelectedVirtualCardRequest: (virtualCardRequest: VirtualCardRequest) => void;
  intl: IntlShape;
};

export const tableColumns: ColumnDef<VirtualCardRequest>[] = [
  {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Account" />,
    cell: ({ cell }: CellContext<VirtualCardRequest, Account>) => {
      const account = cell.getValue();
      return (
        <Flex alignItems="center" p={3} gridGap={2}>
          <Avatar collective={account} radius={20} />
          <LinkCollective collective={account}>
            <Span letterSpacing="0" color="black.700" truncateOverflow fontSize="14px">
              {account.name}
            </Span>
          </LinkCollective>
        </Flex>
      );
    },
  },
  {
    accessorKey: 'assignee',
    header: () => <FormattedMessage defaultMessage="Assignee" />,
    cell: ({ cell }: CellContext<VirtualCardRequest, Account>) => {
      const assignee = cell.getValue();
      return (
        <Flex alignItems="center" p={3} gridGap={2}>
          <Avatar collective={assignee} radius={20} />
          <LinkCollective collective={assignee}>
            <Span letterSpacing="0" color="black.700" truncateOverflow fontSize="14px">
              {assignee.name}
            </Span>
          </LinkCollective>
        </Flex>
      );
    },
  },
  {
    accessorKey: 'purpose',
    header: () => <FormattedMessage id="Fields.purpose" defaultMessage="Purpose" />,
    cell: ({ cell, row, table }: CellContext<VirtualCardRequest, string>) => {
      const purpose = cell.getValue();
      const meta = table.options.meta as VirtualCardRequestsTableMeta;
      return (
        <CellButton onClick={() => meta.onSelectedVirtualCardRequest(row.original)}>
          <Box style={{ textOverflow: 'ellipsis' }} overflow="hidden" maxWidth="250px" fontSize="14px">
            {purpose}
          </Box>
        </CellButton>
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage id="VirtualCards.CreatedAt" defaultMessage="Created At" />,
    cell: ({ cell }: CellContext<VirtualCardRequest, string>) => {
      return (
        <Box textAlign="center">
          <DateTime dateStyle="medium" value={cell.getValue()} />
        </Box>
      );
    },
  },
  {
    accessorKey: 'spendingLimitAmount',
    header: () => <FormattedMessage id="VirtualCards.SpendingLimit" defaultMessage="Spending Limit" />,
    cell: ({ row, table }) => {
      const vcr = row.original;
      const meta = table.options.meta as VirtualCardRequestsTableMeta;
      return getSpendingLimitShortString(meta.intl, vcr.currency, vcr.spendingLimitAmount, vcr.spendingLimitInterval, {
        LimitAmount: v => (
          <Span fontSize="14px" fontWeight="normal" color="black.600" fontStyle="italic">
            {v}
          </Span>
        ),
        LimitInterval: v => (
          <Span fontSize="14px" fontWeight="normal" color="black.600" fontStyle="italic">
            {v}
          </Span>
        ),
      });
    },
  },
  {
    accessorKey: 'status',
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
    cell: ({ row }: CellContext<VirtualCardRequest, string>) => {
      return (
        row.original.status === VirtualCardRequestStatus.PENDING && (
          <VirtualCardRequestTableActions virtualCardRequest={row.original} />
        )
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
          columns={tableColumns}
          meta={virtualCardRequestsTableMeta}
          data={props.virtualCardRequests || []}
          loading={props.loading}
          emptyMessage={() => (
            <div>
              <P fontSize="16px">
                <FormattedMessage defaultMessage="No Virtual Card Requests" />
              </P>
            </div>
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
