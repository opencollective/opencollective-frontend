import React from 'react';
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../../lib/errors';
import type { Account, Host, VirtualCard as GraphQLVirtualCard } from '../../lib/graphql/types/v2/graphql';
import { VirtualCardStatus } from '../../lib/graphql/types/v2/graphql';
import { useWindowResize } from '../../lib/hooks/useWindowResize';
import { getAvailableLimitShortString } from '../../lib/i18n/virtual-card-spending-limit';

import { AccountHoverCard } from '../AccountHoverCard';
import Avatar from '../Avatar';
import { DataTable } from '../DataTable';
import DateTime from '../DateTime';
import VirtualCard, { ActionsButton } from '../edit-collective/VirtualCard';
import { Grid } from '../Grid';
import StyledTag from '../StyledTag';
import { P } from '../Text';
import { TableActionsButton } from '../ui/Table';
import { toast } from '../ui/useToast';

import VirtualCardDrawer from './VirtualCardDrawer';

type VirtualCardsTableMeta = {
  intl: IntlShape;
  openVirtualCardDrawer: (vc: GraphQLVirtualCard) => void;
  host: Host;
  canEditVirtualCard?: boolean;
  canDeleteVirtualCard?: boolean;
  onDeleteRefetchQuery?: string;
};

const tableColumns: ColumnDef<GraphQLVirtualCard>[] = [
  {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Account" />,
    cell: ({ cell }: CellContext<GraphQLVirtualCard, Account>) => {
      const account = cell.getValue();
      return (
        <AccountHoverCard
          account={account}
          trigger={
            <div className="flex items-center gap-2">
              <Avatar collective={account} radius={24} />
              <span className="min-w-0 flex-1 truncate">{account.name}</span>
            </div>
          }
        />
      );
    },
  },
  {
    accessorKey: 'name',
    header: () => <FormattedMessage id="Fields.name" defaultMessage="Name" />,
    cell: ({ cell }: CellContext<GraphQLVirtualCard, string>) => {
      const name = cell.getValue();
      return <div className="truncate">{name}</div>;
    },
  },
  {
    accessorKey: 'last4',
    meta: { className: 'w-28' },

    header: () => <FormattedMessage id="VirtualCards.CardNumber" defaultMessage="Card Number" />,
    cell: ({ cell }: CellContext<GraphQLVirtualCard, string>) => {
      const last4 = cell.getValue();
      return <span className="whitespace-nowrap text-slate-600">•••• {last4}</span>;
    },
  },
  {
    accessorKey: 'remainingLimit',
    header: () => <FormattedMessage id="VirtualCards.AvailableBalance" defaultMessage="Available Balance" />,
    cell: ({ row, table }) => {
      const vc = row.original;
      const meta = table.options.meta as VirtualCardsTableMeta;
      return (
        <div className="italic text-slate-500">
          {getAvailableLimitShortString(
            meta.intl,
            vc.currency,
            vc.remainingLimit,
            vc.spendingLimitAmount,
            vc.spendingLimitInterval,
            {
              AvailableAmount: v => <span className="font-medium not-italic text-slate-950">{v}</span>,
              AmountSeparator: v => <span>&nbsp;{v}&nbsp;</span>,
              LimitAmount: v => <span>{v}</span>,
              LimitInterval: v => <span>{v}</span>,
            },
            { precision: 0 },
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'spendingLimitRenewsOn',
    meta: { className: 'w-28' },
    header: () => <FormattedMessage id="VirtualCards.RenewsOn" defaultMessage="Renews On" />,
    cell: ({ cell }: CellContext<GraphQLVirtualCard, string>) => {
      const spendingLimitRenewsOn = cell.getValue();

      if (!spendingLimitRenewsOn) {
        return <div className="text-center text-slate-500">-</div>;
      }

      return <DateTime dateStyle="medium" value={cell.getValue()} />;
    },
  },
  {
    accessorKey: 'data.status',
    meta: { className: 'w-28' },
    header: () => <FormattedMessage id="VirtualCards.Status" defaultMessage="Status" />,
    cell: ({ cell }: CellContext<GraphQLVirtualCard, string>) => {
      const status = cell.getValue();

      return (
        <div className="flex">
          <StyledTag
            textTransform="uppercase"
            fontWeight="bold"
            fontSize="12px"
            className="truncate"
            type={status === VirtualCardStatus.ACTIVE.toLowerCase() ? 'success' : 'grey'}
          >
            {status}
          </StyledTag>
        </div>
      );
    },
  },
  {
    accessorKey: 'actions',
    meta: { className: 'w-14' },
    header: () => '',
    cell: ({ row, table }: CellContext<GraphQLVirtualCard, string>) => {
      const meta = table.options.meta as VirtualCardsTableMeta;
      return (
        // Stop click propagation to prevent the row from being clicked
        // eslint-disable-next-line
        <div onClick={e => e.stopPropagation()}>
          <ActionsButton
            virtualCard={row.original}
            host={meta.host}
            onError={error => toast({ variant: 'error', message: i18nGraphqlException(meta.intl, error) })}
            openVirtualCardDrawer={meta.openVirtualCardDrawer}
            canEditVirtualCard={meta.canEditVirtualCard}
            canDeleteVirtualCard={meta.canDeleteVirtualCard}
            onDeleteRefetchQuery={meta.onDeleteRefetchQuery}
            as={TableActionsButton}
          />
        </div>
      );
    },
  },
];

type VirtualCardsTableProps = {
  host: Host;
  virtualCards: GraphQLVirtualCard[];
  loading?: boolean;
  canDeleteVirtualCard?: boolean;
  canEditVirtualCard?: boolean;
  onDeleteRefetchQuery?: string;
};

export default function VirtualCardsTable(props: VirtualCardsTableProps) {
  const intl = useIntl();
  const [isTableView, setIsTableView] = React.useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [selectedVirtualCard, setSelectedVirtualCard] = React.useState<GraphQLVirtualCard>(null);
  useWindowResize(() => setIsTableView(window.innerWidth > 1024));
  const openVirtualCardDrawer = virtualCard => {
    setIsDrawerOpen(true);
    setSelectedVirtualCard(virtualCard);
  };
  if (isTableView) {
    const virtualCardsTableMeta: VirtualCardsTableMeta = {
      openVirtualCardDrawer: openVirtualCardDrawer,
      canDeleteVirtualCard: props.canDeleteVirtualCard,
      canEditVirtualCard: props.canEditVirtualCard,
      onDeleteRefetchQuery: props.onDeleteRefetchQuery,
      host: props.host,
      intl,
    };
    return (
      <React.Fragment>
        <DataTable
          data-cy="virtual-cards-table"
          innerClassName="table-fixed"
          columns={tableColumns}
          data={props.virtualCards || []}
          meta={virtualCardsTableMeta}
          loading={props.loading}
          onClickRow={row => openVirtualCardDrawer(row.original)}
          emptyMessage={() => (
            <div>
              <P fontSize="16px">
                <FormattedMessage defaultMessage="No virtual cards" />
              </P>
            </div>
          )}
        />
        <VirtualCardDrawer
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          virtualCardId={selectedVirtualCard?.id}
          canEditVirtualCard
          canDeleteVirtualCard
          onDeleteRefetchQuery="HostedVirtualCards"
        />
      </React.Fragment>
    );
  } else {
    return (
      <Grid justifyContent="center" mt={4} gridTemplateColumns={['100%', '366px']} gridGap="32px 24px">
        {props.virtualCards?.map(vc => (
          <VirtualCard
            key={vc.id}
            host={props.host}
            virtualCard={vc}
            canEditVirtualCard
            canPauseOrResumeVirtualCard
            canDeleteVirtualCard
            onDeleteRefetchQuery="HostedVirtualCards"
          />
        ))}
      </Grid>
    );
  }
}
