import React from 'react';
import type { ColumnDef, TableMeta } from '@tanstack/react-table';
import { includes } from 'lodash';
import { Filter, MoreHorizontal, PanelRightOpen } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { isHostAccount } from '@/lib/collective';
import type { Expense } from '@/lib/graphql/types/v2/schema';
import formatCollectiveType from '@/lib/i18n/collective-type';
import { getDashboardRoute } from '@/lib/url-helpers';

import { AccountHoverCard } from '@/components/AccountHoverCard';
import AmountWithExchangeRateInfo from '@/components/AmountWithExchangeRateInfo';
import Avatar from '@/components/Avatar';
import { AvatarWithLink } from '@/components/AvatarWithLink';
import DateTime from '@/components/DateTime';
import ExpenseStatusTag, { getExpenseStatusMsgType } from '@/components/expenses/ExpenseStatusTag';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import LinkCollective from '@/components/LinkCollective';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { TableActionsButton } from '@/components/ui/Table';

import { DashboardContext } from '../../DashboardContext';

export const grantColumns: Record<string, ColumnDef<any, any>> = {
  account: {
    accessorKey: 'account',
    header: () => <FormattedMessage defaultMessage="Fund" id="Tags.FUND" />,
    cell: ({ cell }) => {
      const account = cell.getValue();
      return (
        <AccountHoverCard
          account={account}
          trigger={
            <span className="inline-flex">
              <LinkCollective noTitle className="flex items-center font-semibold hover:underline" collective={account}>
                <Avatar className="mr-4" collective={account} radius={32} />
                <div>{account.name}</div>
              </LinkCollective>
            </span>
          }
        />
      );
    },
  },
  beneficiary: {
    accessorKey: 'payee',
    header: () => <FormattedMessage defaultMessage="Beneficiary" id="VfJsl4" />,
    cell: ({ cell, row }) => {
      const createdByAccount = row.original.createdByAccount;
      return <BeneficiaryCell account={cell.getValue()} createdByAccount={createdByAccount} />;
    },
  },
  createdAt: {
    accessorKey: 'createdAt',
    header: () => <FormattedMessage defaultMessage="Date" id="expense.incurredAt" />,
    cell: ({ cell }) => {
      return <DateTime value={cell.getValue()} />;
    },
  },
  amount: {
    accessorKey: 'amount',
    header: () => <FormattedMessage defaultMessage="Amount" id="Fields.amount" />,
    cell: ({ row }) => {
      const grant = row.original;
      const hasExchangeRate =
        grant.amountInAccountCurrency && grant.amountInAccountCurrency?.currency !== grant.currency;
      return (
        <div className="flex flex-col items-end text-sm font-medium text-slate-800">
          <span>
            <FormattedMoneyAmount amount={grant.amount} currency={grant.currency} precision={2} />
          </span>

          {hasExchangeRate && (
            <div className="text-xs text-slate-600">
              <AmountWithExchangeRateInfo amount={grant.amountInAccountCurrency as any} />
            </div>
          )}
        </div>
      );
    },
  },
  status: {
    accessorKey: 'status',
    header: () => <FormattedMessage defaultMessage="Status" id="tzMNF3" />,
    cell: ({ row }) => {
      const grant = row.original;
      return (
        <div className="flex justify-end">
          <ExpenseStatusTag
            type={getExpenseStatusMsgType(grant.status)}
            status={grant.status}
            showTaxFormTag={includes(grant.requiredLegalDocuments, 'US_TAX_FORM')}
            payee={grant.payee}
          />
        </div>
      );
    },
  },
  actions: {
    accessorKey: 'actions',
    header: '',
    cell: ({ row, table }) => {
      const grant = row.original;
      const meta = table.options.meta as GrantsTableMeta;
      return (
        // Stop propagation since the row is clickable
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="flex flex-1 items-center justify-end" onClick={e => e.stopPropagation()}>
          <MoreActionsMenu
            grant={grant}
            onViewDetailsClick={meta.onViewDetailsClick}
            enableViewGrantsByBeneficiary={meta.enableViewGrantsByBeneficiary}
          >
            <TableActionsButton data-cy="more-actions-btn" className="h-8 w-8">
              <MoreHorizontal className="relative h-3 w-3" aria-hidden="true" />
            </TableActionsButton>
          </MoreActionsMenu>
        </div>
      );
    },
  },
};

export type GrantsTableMeta = TableMeta<any> & {
  onViewDetailsClick: (grant: Expense) => void;
  enableViewGrantsByBeneficiary?: boolean;
};

type MoreActionsMenuProps = {
  children?: React.ReactNode;
  grant: Expense;
  onViewDetailsClick: (grant: Expense) => void;
  enableViewGrantsByBeneficiary?: boolean;
};
function MoreActionsMenu(props: MoreActionsMenuProps) {
  const router = useRouter();
  const { account } = React.useContext(DashboardContext);

  const isHost = isHostAccount(account);
  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{props.children}</DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[240px]" align="end">
          <DropdownMenuItem
            onClick={() => props.onViewDetailsClick(props.grant)}
            className="cursor-pointer"
            data-cy="actions-view-grant"
          >
            <PanelRightOpen className="text-muted-foreground" size={16} />
            <FormattedMessage defaultMessage="View details" id="MnpUD7" />
          </DropdownMenuItem>
          {props.enableViewGrantsByBeneficiary && (
            <React.Fragment>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    getDashboardRoute(
                      account,
                      `${isHost ? 'hosted-grants' : 'grants'}?fromAccount=${props.grant.payee.slug}`,
                    ),
                  )
                }
              >
                <Filter className="text-muted-foreground" size={16} />
                <FormattedMessage defaultMessage="View previous grants" id="j3TuUR" />
              </DropdownMenuItem>
            </React.Fragment>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </React.Fragment>
  );
}

function BeneficiaryCell({ account, createdByAccount }) {
  const intl = useIntl();

  const hasPreviousGrants = false;

  return (
    <div className="flex">
      <div className="pr-4">
        <AccountHoverCard
          account={account}
          trigger={
            <span className="inline-flex">
              <AvatarWithLink
                size={32}
                account={account}
                secondaryAccount={account.id === createdByAccount.id ? null : createdByAccount}
              />
            </span>
          }
        />
      </div>
      <div>
        <div className="font-semibold">
          <AccountHoverCard
            account={account}
            trigger={
              <span className="inline-flex">
                <LinkCollective noTitle className="inline-flex hover:underline" collective={account}>
                  {account.name}
                </LinkCollective>
              </span>
            }
          />
        </div>
        <div>
          <span>{formatCollectiveType(intl, account.type)}</span>
          {hasPreviousGrants && (
            <span>
              &nbsp;•&nbsp;
              <FormattedMessage
                defaultMessage="Granted {amount} in {countGrants, plural, one {# grant} other {# grants}}"
                id="zV1NPO"
                values={{
                  amount: <FormattedMoneyAmount currency="USD" amount={10000} />,
                  countGrants: 10,
                }}
              />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
