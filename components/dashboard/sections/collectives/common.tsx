import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { groupBy, mapValues, toPairs } from 'lodash';
import { Banknote, FilePlus2, Mail, MoreHorizontal, Pause, Unlink } from 'lucide-react';
import { createPortal } from 'react-dom';
import { FormattedDate, FormattedMessage, IntlShape } from 'react-intl';

import { HOST_FEE_STRUCTURE } from '../../../../lib/constants/host-fee-structure';
import type { AccountWithHost, HostedCollectiveFieldsFragment } from '../../../../lib/graphql/types/v2/graphql';
import formatCollectiveType from '../../../../lib/i18n/collective-type';

import { AccountHoverCard } from '../../../AccountHoverCard';
import AddAgreementModal from '../../../agreements/AddAgreementModal';
import Avatar from '../../../Avatar';
import ContactCollectiveModal from '../../../ContactCollectiveModal';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import AddFundsModal from '../../../host-dashboard/AddFundsModal';
import FreezeAccountModal from '../../../host-dashboard/FreezeAccountModal';
import UnhostAccountModal from '../../../host-dashboard/UnhostAccountModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../ui/DropdownMenu';
import { TableActionsButton } from '../../../ui/Table';

export const cols: Record<string, ColumnDef<any, any>> = {
  collective: {
    accessorKey: 'collective',
    header: () => <FormattedMessage id="Collective" defaultMessage="Collective" />,
    cell: ({ row, table }) => {
      const { intl, openCollectiveDetails } = table.options.meta as {
        intl: IntlShape;
        openCollectiveDetails: (c: HostedCollectiveFieldsFragment) => void;
      };
      const collective = row.original;
      const children = mapValues(groupBy(collective.childrenAccounts?.nodes, 'type'), 'length');
      const secondLine = toPairs(children)
        .map(([type, count]) => count && `${count} ${formatCollectiveType(intl, type, count)}`)
        .join(', ');
      return (
        <button onClick={() => openCollectiveDetails?.(collective)} className="flex items-center">
          <Avatar collective={collective} radius={48} className="mr-4" />
          <div className="flex flex-col items-start">
            <div className="text-sm">{collective.name}</div>
            <div>{secondLine}</div>
          </div>
        </button>
      );
    },
  },
  childCollective: {
    accessorKey: 'collective',
    header: () => <FormattedMessage id="Fields.name" defaultMessage="Name" />,
    cell: ({ row, table }) => {
      const collective = row.original;
      const { openCollectiveDetails } = table.options.meta as any;
      return (
        <button onClick={() => openCollectiveDetails?.(collective)} className="text-sm">
          {collective.name}
        </button>
      );
    },
  },
  team: {
    accessorKey: 'team',
    header: () => <FormattedMessage id="Team" defaultMessage="Team" />,
    cell: ({ row }) => {
      const account = row.original;
      const admins = account.members?.nodes || [];
      return (
        <div className="flex gap-[-4px]">
          {admins.map(admin => (
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
        </div>
      );
    },
  },
  fee: {
    accessorKey: 'fee',
    header: () => <FormattedMessage defaultMessage="Fee" />,
    cell: ({ row }) => {
      const collective = row.original;
      return (
        <div className="whitespace-nowrap">
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
      const since = row.original.approvedAt;
      return (
        <div className="whitespace-nowrap">
          <FormattedDate value={since} day="numeric" month="long" year="numeric" />
        </div>
      );
    },
  },
  balance: {
    accessorKey: 'balence',
    header: () => <FormattedMessage id="Balance" defaultMessage="Balance" />,
    cell: ({ row }) => {
      const balance = row.original.stats.balance;
      return (
        <div className="text-sm">
          <FormattedMoneyAmount amount={balance.valueInCents} currency={balance.currency} showCurrencyCode={false} />
        </div>
      );
    },
  },
  actions: {
    accessorKey: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const collective = row.original;
      const { onEdit, host } = table.options.meta as any;
      return (
        host.id === collective.host?.id && (
          <div className="row flex w-min items-center self-end">
            <MoreActionsMenu collective={collective} onEdit={onEdit}>
              <TableActionsButton className="h-8 w-8">
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
}: {
  collective: HostedCollectiveFieldsFragment & Partial<AccountWithHost>;
  children: React.ReactNode;
  onEdit?: () => void;
}) => {
  const [openModal, setOpenModal] = React.useState<
    null | 'ADD_FUNDS' | 'FREEZE' | 'UNHOST' | 'ADD_AGREEMENT' | 'CONTACT'
  >(null);

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[240px]">
          <DropdownMenuItem className="cursor-pointer" onClick={() => setOpenModal('ADD_FUNDS')}>
            <Banknote className="mr-2" size="16" />
            <FormattedMessage id="menu.addFunds" defaultMessage="Add Funds" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => setOpenModal('ADD_AGREEMENT')}>
            <FilePlus2 className="mr-2" size="16" />
            <FormattedMessage defaultMessage="Add Agreement" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => setOpenModal('CONTACT')}>
            <Mail className="mr-2" size="16" />
            <FormattedMessage id="Contact" defaultMessage="Contact" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => setOpenModal('FREEZE')}>
            <Pause className="mr-2" size="16" />
            <FormattedMessage defaultMessage="Freeze Collective" />
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={() => setOpenModal('UNHOST')}>
            <Unlink className="mr-2" size="16" />
            <FormattedMessage defaultMessage="Unhost" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {openModal &&
        createPortal(
          <React.Fragment>
            {openModal === 'ADD_FUNDS' && (
              <AddFundsModal collective={collective} onClose={() => setOpenModal(null)} onSuccess={onEdit} />
            )}
            {openModal === 'FREEZE' && (
              <FreezeAccountModal collective={collective} onClose={() => setOpenModal(null)} onSuccess={onEdit} />
            )}
            {openModal === 'UNHOST' && (
              <UnhostAccountModal collective={collective} host={collective.host} onClose={() => setOpenModal(null)} />
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
          </React.Fragment>,
          window.document.body,
        )}
    </React.Fragment>
  );
};
