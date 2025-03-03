import React from 'react';
import type { ColumnDef, TableMeta } from '@tanstack/react-table';
import { groupBy, isNil, mapValues, toPairs } from 'lodash';
import {
  Banknote,
  Eye,
  FilePlus2,
  Mail,
  MoreHorizontal,
  Pause,
  Play,
  Receipt,
  ReceiptText,
  SquareSigma,
  Unlink,
  View,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { IntlShape } from 'react-intl';
import { FormattedDate, FormattedMessage } from 'react-intl';

import { HOST_FEE_STRUCTURE } from '../../../../lib/constants/host-fee-structure';
import type { HostedCollectiveFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import type { AccountWithHost } from '../../../../lib/graphql/types/v2/schema';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { getDashboardRoute } from '../../../../lib/url-helpers';

import { AccountHoverCard } from '../../../AccountHoverCard';
import AddAgreementModal from '../../../agreements/AddAgreementModal';
import Avatar from '../../../Avatar';
import ContactCollectiveModal from '../../../ContactCollectiveModal';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import { Badge } from '../../../ui/Badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../ui/DropdownMenu';
import { TableActionsButton } from '../../../ui/Table';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../../ui/Tooltip';
import { DashboardContext } from '../../DashboardContext';
import { HostCreateExpenseModal } from '../expenses/HostCreateExpenseModal';

import AddFundsModal from './AddFundsModal';
import FreezeAccountModal from './FreezeAccountModal';
import UnhostAccountModal from './UnhostAccountModal';

export interface HostedCollectivesDataTableMeta extends TableMeta<any> {
  openCollectiveDetails?: (c: HostedCollectiveFieldsFragment) => void;
}

export const cols: Record<string, ColumnDef<any, any>> = {
  collective: {
    accessorKey: 'collective',
    header: () => <FormattedMessage id="Collective" defaultMessage="Collective" />,
    cell: ({ row, table }) => {
      const { intl } = table.options.meta as {
        intl: IntlShape;
      };
      const collective = row.original;
      const children = mapValues(groupBy(collective.childrenAccounts?.nodes, 'type'), 'length');
      const isChild = collective.parent;
      const secondLine = isChild ? (
        <FormattedMessage
          defaultMessage="{childAccountType} by {parentAccount}"
          id="9f14iS"
          values={{
            childAccountType: (
              <Badge size="xs" type="outline">
                {formatCollectiveType(intl, collective.type)}
              </Badge>
            ),
            parentAccount: collective.parent.name,
          }}
        />
      ) : (
        toPairs(children)
          .map(([type, count]) => count && `${count} ${formatCollectiveType(intl, type, count)}`)
          .join(', ')
      );
      return (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center">
            <Avatar collective={collective} className="mr-4" radius={48} />
            {collective.isFrozen && (
              <Badge type="info" size="xs" className="mr-2">
                <FormattedMessage id="CollectiveStatus.Frozen" defaultMessage="Frozen" />
              </Badge>
            )}
            <div className="flex flex-col items-start">
              <div className="flex items-center text-sm">{collective.name}</div>
              <div className="text-xs">{secondLine}</div>
            </div>
          </div>
          {Boolean(collective.policies?.COLLECTIVE_ADMINS_CAN_SEE_PAYOUT_METHODS) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <View className="cursor-help" size="16" />
              </TooltipTrigger>
              <TooltipContent>
                <FormattedMessage
                  defaultMessage="All Collective Admins can view sensitive payout method details"
                  id="CollectiveAdminsPayoutMethods"
                />
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  host: {
    accessorKey: 'host',
    header: () => <FormattedMessage id="Member.Role.HOST" defaultMessage="Host" />,
    cell: ({ row }) => {
      const host = row.original.isHost ? row.original : row.original.host;
      if (!host) {
        return null;
      }
      return (
        <div className="flex items-center">
          <Avatar collective={host} className="mr-4" radius={24} />
          <div className="flex flex-col items-start">
            <div className="flex items-center text-sm">{host.name}</div>
          </div>
        </div>
      );
    },
  },
  childCollective: {
    accessorKey: 'collective',
    header: () => <FormattedMessage id="Fields.name" defaultMessage="Name" />,
    cell: ({ row }) => {
      const collective = row.original;
      return <div className="text-sm">{collective.name}</div>;
    },
  },
  team: {
    accessorKey: 'team',
    header: () => <FormattedMessage id="Team" defaultMessage="Team" />,
    cell: ({ row }) => {
      const DISPLAYED_TEAM_MEMBERS = 3;
      const account = row.original;
      const admins = account.members?.nodes || [];
      const displayed = admins.length > DISPLAYED_TEAM_MEMBERS ? admins.slice(0, DISPLAYED_TEAM_MEMBERS - 1) : admins;
      const left = admins.length - displayed.length;
      return (
        <div className="flex gap-[-4px]">
          {displayed.map(admin => (
            <AccountHoverCard
              key={admin.id}
              account={admin.account}
              includeAdminMembership={{ accountSlug: account.slug }}
              trigger={
                <div className="ml-[-8px] flex items-center first:ml-0">
                  <Avatar collective={admin.account} radius={24} displayTitle={false} />
                </div>
              }
            />
          ))}
          {left ? (
            <div className="ml-[-8px] flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-[11px] font-semibold text-blue-400 first:ml-0">
              +{left}
            </div>
          ) : null}
        </div>
      );
    },
  },
  fee: {
    accessorKey: 'fee',
    header: () => <FormattedMessage defaultMessage="Fee" id="uT4OlP" />,
    cell: ({ row }) => {
      const collective = row.original;
      return isNil(collective.hostFeePercent) ? (
        ''
      ) : (
        <div className="whitespace-nowrap">
          {collective.hostFeesStructure === HOST_FEE_STRUCTURE.DEFAULT ? (
            <FormattedMessage
              id="DefaultFee"
              defaultMessage="Default (%{hostFeePercent})"
              values={{ hostFeePercent: collective.hostFeePercent }}
            />
          ) : (
            `${collective.hostFeePercent}%`
          )}
        </div>
      );
    },
  },
  hostedSince: {
    accessorKey: 'hostedSince',
    header: () => <FormattedMessage id="HostedSince" defaultMessage="Hosted since" />,
    cell: ({ row }) => {
      const collective = row.original;
      const since = collective.approvedAt;
      return isNil(since) ? (
        ''
      ) : (
        <div suppressHydrationWarning className="whitespace-nowrap">
          <FormattedDate value={since} day="numeric" month="long" year="numeric" />
        </div>
      );
    },
  },
  balance: {
    accessorKey: 'balance',
    header: () => <FormattedMessage id="Balance" defaultMessage="Balance" />,
    cell: ({ row }) => {
      const collective = row.original;
      const balance = collective.stats.balance;
      return (
        <div className="font-medium text-foreground">
          <FormattedMoneyAmount amount={balance.valueInCents} currency={balance.currency} showCurrencyCode={true} />
        </div>
      );
    },
  },
  consolidatedBalance: {
    accessorKey: 'consolidatedBalence',
    header: () => <FormattedMessage id="TotalBalance" defaultMessage="Total Balance" />,
    cell: ({ row }) => {
      const collective = row.original;
      const isChild = !!collective.parent?.id;
      const stats = collective.stats;
      const hasDifferentBalances = stats.balance?.valueInCents !== stats.consolidatedBalance?.valueInCents;
      const displayBalance = isChild ? stats.balance : stats.consolidatedBalance;
      return (
        <div className="flex items-center font-medium text-foreground">
          <FormattedMoneyAmount
            amount={displayBalance.valueInCents}
            currency={displayBalance.currency}
            showCurrencyCode={true}
          />

          {!isChild && hasDifferentBalances && (
            <Tooltip>
              <TooltipTrigger className="cursor-help align-middle">
                <SquareSigma className="ml-1" size="16" />
              </TooltipTrigger>
              <TooltipContent className="font-normal">
                <FormattedMessage
                  id="Tooltip.ConsolidatedBalance"
                  defaultMessage="Includes the balance of all events and projects"
                />
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      );
    },
  },
  actions: {
    accessorKey: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const collective = row.original;
      const { onEdit, host, openCollectiveDetails } = table.options.meta as any;
      return (
        host?.id === collective.host?.id && (
          // Stop propagation since the row is clickable
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <div className="flex flex-1 items-center justify-end" onClick={e => e.stopPropagation()}>
            <MoreActionsMenu collective={collective} onEdit={onEdit} openCollectiveDetails={openCollectiveDetails}>
              <TableActionsButton data-cy="more-actions-btn" className="h-8 w-8">
                <MoreHorizontal className="relative h-3 w-3" aria-hidden="true" />
              </TableActionsButton>
            </MoreActionsMenu>
          </div>
        )
      );
    },
  },
};

export const MoreActionsMenu = ({
  collective,
  children,
  onEdit,
  openCollectiveDetails,
}: {
  collective: HostedCollectiveFieldsFragment & Partial<AccountWithHost>;
  children: React.ReactNode;
  onEdit?: () => void;
  openCollectiveDetails?: (c: HostedCollectiveFieldsFragment) => void;
}) => {
  const router = useRouter();
  const { account } = React.useContext(DashboardContext);
  const [openModal, setOpenModal] = React.useState<
    null | 'ADD_FUNDS' | 'ADD_EXPENSE' | 'FREEZE' | 'UNHOST' | 'ADD_AGREEMENT' | 'CONTACT'
  >(null);

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[240px]" align="end">
          {openCollectiveDetails && (
            <React.Fragment>
              <DropdownMenuItem className="cursor-pointer" onClick={() => openCollectiveDetails(collective)}>
                <Eye className="mr-2" size="16" />
                <FormattedMessage id="viewDetails" defaultMessage="View Details" />
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </React.Fragment>
          )}
          <DropdownMenuItem
            className="cursor-pointer"
            data-cy="actions-view-transactions"
            onClick={() => router.push(getDashboardRoute(account, `host-transactions?account=${collective.slug}`))}
          >
            <ReceiptText className="mr-2" size="16" />
            <FormattedMessage id="viewTransactions" defaultMessage="View Transactions" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            data-cy="actions-add-funds"
            onClick={() => setOpenModal('ADD_FUNDS')}
          >
            <Banknote className="mr-2" size="16" />
            <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            data-cy="actions-add-expense"
            onClick={() => setOpenModal('ADD_EXPENSE')}
          >
            <Receipt className="mr-2" size="16" />
            <FormattedMessage defaultMessage="Add expense" id="6/UjBO" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            data-cy="actions-add-agreement"
            onClick={() => setOpenModal('ADD_AGREEMENT')}
          >
            <FilePlus2 className="mr-2" size="16" />
            <FormattedMessage defaultMessage="Add Agreement" id="apnXKF" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            data-cy="actions-contact"
            onClick={() => setOpenModal('CONTACT')}
          >
            <Mail className="mr-2" size="16" />
            <FormattedMessage id="Contact" defaultMessage="Contact" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" data-cy="actions-freeze" onClick={() => setOpenModal('FREEZE')}>
            {collective.isFrozen ? (
              <React.Fragment>
                <Play className="mr-2" size="16" />
                <FormattedMessage defaultMessage="Unfreeze Collective" id="gX79wf" />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <Pause className="mr-2" size="16" />
                <FormattedMessage defaultMessage="Freeze Collective" id="ILjcbM" />
              </React.Fragment>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" data-cy="actions-unhost" onClick={() => setOpenModal('UNHOST')}>
            <Unlink className="mr-2" size="16" />
            <FormattedMessage defaultMessage="Unhost" id="2KTLpo" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openModal && (
        <React.Fragment>
          {openModal === 'ADD_FUNDS' && (
            <AddFundsModal
              host={collective.host}
              collective={collective}
              onClose={() => setOpenModal(null)}
              onSuccess={onEdit}
            />
          )}
          {openModal === 'ADD_EXPENSE' && (
            <HostCreateExpenseModal
              open
              setOpen={() => setOpenModal(null)}
              host={collective.host}
              account={collective}
            />
          )}
          {openModal === 'FREEZE' && (
            <FreezeAccountModal collective={collective} onClose={() => setOpenModal(null)} onSuccess={onEdit} />
          )}
          {openModal === 'UNHOST' && (
            <UnhostAccountModal
              collective={collective}
              host={collective.host}
              onClose={() => setOpenModal(null)}
              onSuccess={onEdit}
            />
          )}
          {openModal === 'ADD_AGREEMENT' && (
            <AddAgreementModal
              account={collective}
              hostLegacyId={collective.host.legacyId}
              onClose={() => setOpenModal(null)}
              onCreate={() => setOpenModal(null)}
            />
          )}
          {openModal === 'CONTACT' && (
            <ContactCollectiveModal
              collective={{ ...collective, id: collective.legacyId }}
              onClose={() => setOpenModal(null)}
            />
          )}
        </React.Fragment>
      )}
    </React.Fragment>
  );
};
