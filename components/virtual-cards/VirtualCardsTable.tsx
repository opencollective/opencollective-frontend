import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { CellContext, ColumnDef } from '@tanstack/react-table';
import { MoreHorizontalIcon } from 'lucide-react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';
import styled from 'styled-components';

import { i18nGraphqlException } from '../../lib/errors';
import {
  Account,
  Host,
  VirtualCard as GraphQLVirtualCard,
  VirtualCardStatus,
} from '../../lib/graphql/types/v2/graphql';
import { useWindowResize } from '../../lib/hooks/useWindowResize';
import { getAvailableLimitShortString } from '../../lib/i18n/virtual-card-spending-limit';

import Avatar from '../Avatar';
import { DataTable } from '../DataTable';
import DateTime from '../DateTime';
import VirtualCard, { ActionsButton } from '../edit-collective/VirtualCard';
import { Box, Flex, Grid } from '../Grid';
import { I18nBold } from '../I18nFormatters';
import LinkCollective from '../LinkCollective';
import StyledRoundButton from '../StyledRoundButton';
import StyledTag from '../StyledTag';
import { P, Span } from '../Text';
import { Toast, TOAST_TYPE, useToasts } from '../ToastProvider';

import VirtualCardDrawer from './VirtualCardDrawer';

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

type VirtualCardsTableMeta = {
  intl: IntlShape;
  addToast: (toast: Partial<Toast>) => void;
  openVirtualCardDrawer: (vc: GraphQLVirtualCard) => void;
  host: Host;
  canEditVirtualCard?: boolean;
  canDeleteVirtualCard?: boolean;
  onDeleteRefetchQuery?: string;
};

export const tableColumns: ColumnDef<GraphQLVirtualCard>[] = [
  {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Account" />,
    cell: ({ cell }: CellContext<GraphQLVirtualCard, Account>) => {
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
    accessorKey: 'name',
    header: () => <FormattedMessage id="Fields.name" defaultMessage="Name" />,
    cell: ({ cell, row, table }: CellContext<GraphQLVirtualCard, string>) => {
      const name = cell.getValue();
      const vc = row.original;
      const meta = table.options.meta as VirtualCardsTableMeta;
      return (
        <CellButton onClick={() => meta.openVirtualCardDrawer(vc)}>
          <Box style={{ textOverflow: 'ellipsis' }} overflow="hidden" maxWidth="250px" fontSize="14px">
            {name}
          </Box>
        </CellButton>
      );
    },
  },
  {
    accessorKey: 'last4',
    header: () => <FormattedMessage id="VirtualCards.CardNumber" defaultMessage="Card Number" />,
    cell: ({ cell }: CellContext<GraphQLVirtualCard, string>) => {
      const last4 = cell.getValue();
      return (
        <Box style={{ whiteSpace: 'nowrap' }} p={3} fontSize="14px">
          **** {last4}
        </Box>
      );
    },
  },
  {
    accessorKey: 'remainingLimit',
    header: () => <FormattedMessage id="VirtualCards.AvailableBalance" defaultMessage="Available Balance" />,
    cell: ({ row, table }) => {
      const vc = row.original;
      const meta = table.options.meta as VirtualCardsTableMeta;

      return getAvailableLimitShortString(
        meta.intl,
        vc.currency,
        vc.remainingLimit,
        vc.spendingLimitAmount,
        vc.spendingLimitInterval,
        {
          AvailableAmount: I18nBold,
          AmountSeparator: v => <strong>&nbsp;{v}&nbsp;</strong>,
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
        },
      );
    },
  },
  {
    accessorKey: 'spendingLimitRenewsOn',
    header: () => <FormattedMessage id="VirtualCards.RenewsOn" defaultMessage="Renews On" />,
    cell: ({ cell }: CellContext<GraphQLVirtualCard, string>) => {
      const spendingLimitRenewsOn = cell.getValue();

      if (!spendingLimitRenewsOn) {
        return <Box textAlign="center">-</Box>;
      }

      return (
        <Box textAlign="center">
          <DateTime dateStyle="medium" value={cell.getValue()} />
        </Box>
      );
    },
  },
  {
    accessorKey: 'data.status',
    header: () => <FormattedMessage id="VirtualCards.Status" defaultMessage="Status" />,
    cell: ({ cell }: CellContext<GraphQLVirtualCard, string>) => {
      const status = cell.getValue();

      return (
        <StyledTag
          textTransform="uppercase"
          fontWeight="bold"
          fontSize="12px"
          type={status === VirtualCardStatus.ACTIVE.toLowerCase() ? 'success' : 'grey'}
        >
          {status}
        </StyledTag>
      );
    },
  },
  {
    accessorKey: 'actions',
    header: () => '',
    cell: ({ row, table }: CellContext<GraphQLVirtualCard, string>) => {
      const meta = table.options.meta as VirtualCardsTableMeta;
      return (
        <Box textAlign="center">
          <ActionsButton
            virtualCard={row.original}
            host={meta.host}
            onError={error =>
              meta.addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(meta.intl, error) })
            }
            canEditVirtualCard={meta.canEditVirtualCard}
            canDeleteVirtualCard={meta.canDeleteVirtualCard}
            onDeleteRefetchQuery={meta.onDeleteRefetchQuery}
            // eslint-disable-next-line react/display-name
            as={React.forwardRef((props, ref: React.ForwardedRef<HTMLButtonElement>) => {
              return (
                <StyledRoundButton size={24} color="#C4C7CC" {...props} ref={ref}>
                  <MoreHorizontalIcon size={12} color="#76777A" />
                </StyledRoundButton>
              );
            })}
          />
        </Box>
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
  const { addToast } = useToasts();
  const [isTableView, setIsTableView] = React.useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
  const [selectedVirtualCard, setSelectedVirtualCard] = React.useState<GraphQLVirtualCard>(null);
  useWindowResize(() => setIsTableView(window.innerWidth > 1024));

  if (isTableView) {
    const virtualCardsTableMeta: VirtualCardsTableMeta = {
      openVirtualCardDrawer: virtualCard => {
        setIsDrawerOpen(true);
        setSelectedVirtualCard(virtualCard);
      },
      canDeleteVirtualCard: props.canDeleteVirtualCard,
      canEditVirtualCard: props.canEditVirtualCard,
      onDeleteRefetchQuery: props.onDeleteRefetchQuery,
      host: props.host,
      intl,
      addToast,
    };
    return (
      <React.Fragment>
        <DataTable
          data-cy="virtual-cards-table"
          columns={tableColumns}
          data={props.virtualCards || []}
          meta={virtualCardsTableMeta}
          loading={props.loading}
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
        {props.virtualCards.map(vc => (
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
