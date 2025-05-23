import React from 'react';
import type { ColumnDef, TableMeta } from '@tanstack/react-table';
import { includes } from 'lodash';
import { Check, Filter, MinusCircle, MoreHorizontal, PanelRightOpen } from 'lucide-react';
import { useRouter } from 'next/router';
import { FormattedMessage, useIntl } from 'react-intl';

import { isHostAccount } from '@/lib/collective';
import useProcessExpense from '@/lib/expenses/useProcessExpense';
import type { Expense } from '@/lib/graphql/types/v2/schema';
import formatCollectiveType from '@/lib/i18n/collective-type';
import { getDashboardRoute } from '@/lib/url-helpers';

import { AccountHoverCard } from '@/components/AccountHoverCard';
import AmountWithExchangeRateInfo from '@/components/AmountWithExchangeRateInfo';
import { AvatarWithLink } from '@/components/AvatarWithLink';
import DateTime from '@/components/DateTime';
import type { ConfirmProcessExpenseModalType } from '@/components/expenses/ConfirmProcessExpenseModal';
import ConfirmProcessExpenseModal from '@/components/expenses/ConfirmProcessExpenseModal';
import ExpenseStatusTag, { getExpenseStatusMsgType } from '@/components/expenses/ExpenseStatusTag';
import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import LinkCollective from '@/components/LinkCollective';
import StyledSpinner from '@/components/StyledSpinner';
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
      return <FundCell account={cell.getValue()} />;
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

  const permissions = props.grant?.permissions;

  const [processModal, setProcessModal] = React.useState<ConfirmProcessExpenseModalType>(null);
  const processExpense = useProcessExpense({
    expense: props.grant,
  });

  return (
    <React.Fragment>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{props.children}</DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[240px]" align="end">
          <DropdownMenuItem
            disabled={processExpense.loading}
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
                disabled={processExpense.loading}
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
          {(permissions?.canApprove || permissions?.canReject) && <DropdownMenuSeparator />}
          {permissions?.canApprove && (
            <DropdownMenuItem
              disabled={processExpense.loading}
              onClick={async e => {
                e.preventDefault();
                await processExpense.approve();
              }}
            >
              <Check className="text-muted-foreground" size={16} />
              <FormattedMessage defaultMessage="Approve grant" id="202vW9" />
              {processExpense.loading && processExpense.currentAction === 'APPROVE' && <StyledSpinner size={16} />}
            </DropdownMenuItem>
          )}
          {permissions?.canReject && (
            <DropdownMenuItem disabled={processExpense.loading} onClick={() => setProcessModal('REJECT')}>
              <MinusCircle className="text-muted-foreground" size={16} />
              <FormattedMessage defaultMessage="Reject grant" id="laRuyZ" />
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {processModal && (
        <ConfirmProcessExpenseModal type={processModal} expense={props.grant} onClose={() => setProcessModal(null)} />
      )}
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

function FundCell({ account }) {
  return (
    <div className="flex">
      <div className="pr-4">
        <AccountHoverCard
          account={account}
          trigger={
            <span className="inline-flex">
              <AvatarWithLink size={32} account={account} />
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
        {account.stats?.balanceWithBlockedFunds && (
          <div className="text-sm">
            <FormattedMessage
              defaultMessage="Balance: {amount}"
              id="C0kGx0"
              values={{
                amount: (
                  <FormattedMoneyAmount
                    showCurrencyCode={false}
                    currency={account.stats.balanceWithBlockedFunds.currency}
                    amount={account.stats.balanceWithBlockedFunds.valueInCents}
                  />
                ),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
