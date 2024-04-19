import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { groupBy, isNil, mapValues, toPairs } from 'lodash';
import {
  Banknote,
  Eye,
  FilePlus2,
  Mail,
  MoreHorizontal,
  Pause,
  Play,
  Snowflake,
  SquareSigma,
  Unlink,
} from 'lucide-react';
import { FormattedDate, FormattedMessage, IntlShape } from 'react-intl';

import { HOST_FEE_STRUCTURE } from '../../../../lib/constants/host-fee-structure';
import type { AccountWithHost, HostedCollectiveFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../../../../lib/i18n/collective-type';
import { cn } from '../../../../lib/utils';

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

import AddFundsModal from './AddFundsModal';
import FreezeAccountModal from './FreezeAccountModal';
import UnhostAccountModal from './UnhostAccountModal';

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
        <div className="flex items-center">
          <Avatar collective={collective} className="mr-4" radius={48} />
          {collective.isFrozen && (
            <div className="mr-2 rounded-full bg-white/90 p-[3px] shadow-md">
              <Snowflake className="text-blue-500" size="20" />
            </div>
          )}
          <div className={cn('flex flex-col items-start', collective.isFrozen && 'opacity-50')}>
            <div className="flex items-center text-sm">{collective.name}</div>
            <div className="text-xs">{secondLine}</div>
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
        <div className={cn('flex gap-[-4px]', account.isFrozen && 'opacity-50')}>
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
        <div className={cn('whitespace-nowrap', collective.isFrozen && 'opacity-50')}>
          {collective.hostFeesStructure === HOST_FEE_STRUCTURE.DEFAULT
            ? `(${collective.hostFeePercent}%)`
            : `${collective.hostFeePercent}%`}
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
        <div className={cn('whitespace-nowrap', collective.isFrozen && 'opacity-50')}>
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
        <div className={cn('font-medium text-foreground', collective.isFrozen && 'opacity-50')}>
          <FormattedMoneyAmount
            amount={balance.valueInCents}
            currency={balance.currency}
            showCurrencyCode={false}
            amountStyles={{}}
          />
        </div>
      );
    },
  },
  consolidatedBalance: {
    accessorKey: 'consolidatedBalence',
    header: () => <FormattedMessage id="Balance" defaultMessage="Balance" />,
    cell: ({ row }) => {
      const collective = row.original;
      const isChild = !!collective.parent?.id;
      const stats = collective.stats;
      const hasDifferentBalances = stats.balance?.valueInCents !== stats.consolidatedBalance?.valueInCents;
      const displayBalance = isChild ? stats.balance : stats.consolidatedBalance;
      return (
        <div className={cn('flex items-center font-medium text-foreground', collective.isFrozen && 'opacity-50')}>
          <FormattedMoneyAmount
            amount={displayBalance.valueInCents}
            currency={displayBalance.currency}
            showCurrencyCode={false}
            amountStyles={{}}
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
  const [openModal, setOpenModal] = React.useState<
    null | 'ADD_FUNDS' | 'FREEZE' | 'UNHOST' | 'ADD_AGREEMENT' | 'CONTACT'
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
            data-cy="actions-add-funds"
            onClick={() => setOpenModal('ADD_FUNDS')}
          >
            <Banknote className="mr-2" size="16" />
            <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
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
            <AddFundsModal collective={collective} onClose={() => setOpenModal(null)} onSuccess={onEdit} />
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
