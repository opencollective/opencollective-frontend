import React from 'react';
import { useQuery } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { usePrevious } from '../../../../lib/hooks/usePrevious';
import { i18nPaymentIntentType } from '../../../../lib/i18n/payment-intent';

import Avatar from '../../../Avatar';
import { CopyID } from '../../../CopyId';
import DateTime from '../../../DateTime';
import DrawerHeader from '../../../DrawerHeader';
import FormattedMoneyAmount from '../../../FormattedMoneyAmount';
import LinkCollective from '../../../LinkCollective';
import MessageBoxGraphqlError from '../../../MessageBoxGraphqlError';
import { DataList, DataListItem, DataListItemLabel, DataListItemValue } from '../../../ui/DataList';
import { Sheet, SheetBody, SheetContent } from '../../../ui/Sheet';
import { Skeleton } from '../../../ui/Skeleton';
import { DashboardContext } from '../../DashboardContext';

import { PaymentIntentRelatedExpense, PaymentIntentRelatedOrder } from './PaymentIntentRelatedRecord';
import { PaymentIntentStatusBadge } from './PaymentIntentStatusBadge';
import { PaymentIntentTransactions } from './PaymentIntentTransactions';
import { paymentIntentDetailsQuery } from './queries';

type PaymentIntentDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCloseAutoFocus: (e: React.FocusEvent) => void;
  publicId?: string;
};

const AccountLink = ({ account }) => {
  if (!account) {
    return <span className="text-muted-foreground">-</span>;
  }
  return (
    <LinkCollective
      collective={account}
      withHoverCard
      className="flex items-center gap-2 font-medium hover:text-primary"
    >
      <Avatar size={20} collective={account} />
      {account.name || account.slug}
    </LinkCollective>
  );
};

function PaymentIntentDetails({ publicId }: { publicId?: string }) {
  const intl = useIntl();
  const prevPublicId = usePrevious(publicId);
  const id = publicId || prevPublicId;
  const { account } = React.useContext(DashboardContext);
  const { data, loading, error } = useQuery(paymentIntentDetailsQuery, {
    variables: { publicId: id },
    skip: !id,
    fetchPolicy: 'cache-and-network',
  });

  const paymentIntent = data?.paymentIntent;

  if (error) {
    return (
      <div className="p-6">
        <MessageBoxGraphqlError error={error} />
      </div>
    );
  }

  if (loading && !paymentIntent) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (!paymentIntent) {
    return null;
  }

  const expense = paymentIntent.expense;
  const order = paymentIntent.order;

  return (
    <React.Fragment>
      <DrawerHeader
        entityName={<FormattedMessage defaultMessage="Payment Intent" id="PaymentIntent" />}
        entityIdentifier={<CopyID value={paymentIntent.publicId}>{paymentIntent.publicId}</CopyID>}
        entityLabel={
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold">{paymentIntent.description || '-'}</span>
            <PaymentIntentStatusBadge status={paymentIntent.status} />
          </div>
        }
      />
      <SheetBody>
        <DataList className="mb-6">
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage defaultMessage="Type" id="+U6ozc" />
            </DataListItemLabel>
            <DataListItemValue>{i18nPaymentIntentType(intl, paymentIntent.type)}</DataListItemValue>
          </DataListItem>
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
            </DataListItemLabel>
            <DataListItemValue>
              <DateTime dateStyle="medium" timeStyle="short" value={paymentIntent.paidAt ?? paymentIntent.createdAt} />
            </DataListItemValue>
          </DataListItem>
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage defaultMessage="Payer" id="PaymentIntent.Payer" />
            </DataListItemLabel>
            <DataListItemValue>
              <AccountLink account={paymentIntent.payer} />
            </DataListItemValue>
          </DataListItem>
          <DataListItem>
            <DataListItemLabel>
              <FormattedMessage defaultMessage="Payee" id="PaymentIntent.Payee" />
            </DataListItemLabel>
            <DataListItemValue>
              <AccountLink account={paymentIntent.payee} />
            </DataListItemValue>
          </DataListItem>
          {paymentIntent.amountPledged && (
            <DataListItem>
              <DataListItemLabel>
                <FormattedMessage defaultMessage="Pledged" id="PaymentIntent.AmountPledged" />
              </DataListItemLabel>
              <DataListItemValue>
                <FormattedMoneyAmount
                  amount={paymentIntent.amountPledged.valueInCents}
                  currency={paymentIntent.amountPledged.currency}
                />
              </DataListItemValue>
            </DataListItem>
          )}
          {paymentIntent.amountSent && (
            <DataListItem>
              <DataListItemLabel>
                <FormattedMessage defaultMessage="Sent" id="PaymentIntent.AmountSent" />
              </DataListItemLabel>
              <DataListItemValue>
                <FormattedMoneyAmount
                  amount={paymentIntent.amountSent.valueInCents}
                  currency={paymentIntent.amountSent.currency}
                />
              </DataListItemValue>
            </DataListItem>
          )}
          {paymentIntent.amountReceived && (
            <DataListItem>
              <DataListItemLabel>
                <FormattedMessage defaultMessage="Received" id="PaymentIntent.AmountReceived" />
              </DataListItemLabel>
              <DataListItemValue>
                <FormattedMoneyAmount
                  amount={paymentIntent.amountReceived.valueInCents}
                  currency={paymentIntent.amountReceived.currency}
                />
              </DataListItemValue>
            </DataListItem>
          )}
        </DataList>

        {expense && <PaymentIntentRelatedExpense expense={expense} dashboardAccount={account} />}
        {order && <PaymentIntentRelatedOrder order={order} dashboardAccount={account} />}

        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium">
            <FormattedMessage defaultMessage="Transactions" id="menu.transactions" />
          </h3>
          <PaymentIntentTransactions transactions={paymentIntent.transactions ?? []} />
        </div>
      </SheetBody>
    </React.Fragment>
  );
}

export function PaymentIntentDrawer({ open, onOpenChange, onCloseAutoFocus, publicId }: PaymentIntentDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-cy="payment-intent-drawer"
        className="max-w-xl"
        onCloseAutoFocus={onCloseAutoFocus as unknown as (event: Event) => void}
      >
        <PaymentIntentDetails publicId={publicId} />
      </SheetContent>
    </Sheet>
  );
}
