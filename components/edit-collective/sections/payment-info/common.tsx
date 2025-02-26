import React from 'react';
import { ArrowLeftRight, Coins, Ellipsis, Receipt } from 'lucide-react';
import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import type { ManagePaymentMethodsQuery } from '@/lib/graphql/types/v2/graphql';
import { getDashboardRoute } from '@/lib/url-helpers';
import { cn } from '@/lib/utils';

import Link from '@/components/Link';
import { Button } from '@/components/ui/Button';
import { Collapsible, CollapsibleContent } from '@/components/ui/Collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';

type MethodCardProps = {
  showSubcontent?: boolean;
  subContent?: React.ReactNode;
  disabled?: boolean;
  children?: ReactNode | undefined;
  subContentClassName?: string;
};

export const MethodCard = ({ children, showSubcontent, subContent, ...props }: MethodCardProps) => {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-lg bg-card text-sm text-card-foreground ring-1 shadow-xs ring-border',
        props.disabled && 'bg-gray-50 ring-0',
      )}
      {...props}
    >
      <div className={cn('flex w-full items-center gap-4 p-4', props.disabled && 'text-gray-400')}>{children} </div>
      {subContent && (
        <Collapsible open={showSubcontent}>
          <CollapsibleContent className={cn('p-4 pt-0', props.subContentClassName)}>{subContent}</CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export const moreActionsThunk = (account: ManagePaymentMethodsQuery['account']) =>
  function MoreActions(
    paymentInfo:
      | ManagePaymentMethodsQuery['account']['payoutMethods'][0]
      | ManagePaymentMethodsQuery['account']['paymentMethods'],
  ) {
    const isPaymentMethodList = Array.isArray(paymentInfo);
    const transactionsLink = getDashboardRoute(
      account,
      isPaymentMethodList
        ? `transactions?${paymentInfo.map(pm => `paymentMethodId=${pm.id}`).join('&')}`
        : `transactions?payoutMethodId=${paymentInfo.id}`,
    );
    const ordersLink =
      isPaymentMethodList &&
      getDashboardRoute(
        account,
        `outgoing-contributions?${paymentInfo.map(pm => `paymentMethodId=${pm.id}`).join('&')}`,
      );
    const expensesLink =
      !isPaymentMethodList && getDashboardRoute(account, `submitted-expenses?payoutMethodId=${paymentInfo.id}`);

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-xs" variant="ghost">
            <Ellipsis size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="min-w-[240px]" align="end">
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link href={transactionsLink}>
              <ArrowLeftRight className="mr-2" size="16" />
              <FormattedMessage defaultMessage="View transactions" id="DfQJQ6" />
            </Link>
          </DropdownMenuItem>
          {ordersLink && (
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href={ordersLink}>
                <Coins className="mr-2" size="16" />
                <FormattedMessage defaultMessage="View contributions" id="7rsA36" />
              </Link>
            </DropdownMenuItem>
          )}
          {expensesLink && (
            <DropdownMenuItem className="cursor-pointer" asChild>
              <Link href={expensesLink}>
                <Receipt className="mr-2" size="16" />
                <FormattedMessage defaultMessage="View expenses" id="rZDjnQ" />
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };
