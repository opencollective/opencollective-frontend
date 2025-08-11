import React from 'react';
import { Info, Receipt, Shapes } from 'lucide-react';
import { FormattedDate, FormattedMessage } from 'react-intl';

import type { PlatformBillingFieldsFragment, PlatformSubscriptionFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { Badge } from '@/components/ui/Badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

type PlatformSubscriptionCardProps = {
  subscription: PlatformSubscriptionFieldsFragment;
  billing: PlatformBillingFieldsFragment;
};

export function PlatformSubscriptionCard(props: PlatformSubscriptionCardProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full flex-col rounded-xl border">
        <div className="mb-4 flex justify-between px-4 pt-4">
          <div className="font-bold">
            {props.subscription.endDate ? (
              <FormattedMessage
                defaultMessage="{dateFrom} to {dateTo}"
                id="76YT3Y"
                values={{
                  dateFrom: <FormattedDate timeZone="UTC" dateStyle="medium" value={props.subscription.startDate} />,
                  dateTo: <FormattedDate timeZone="UTC" dateStyle="medium" value={props.subscription.endDate} />,
                }}
              />
            ) : (
              <FormattedMessage
                defaultMessage="Since {date}"
                id="x9TypM"
                values={{
                  date: <FormattedDate timeZone="UTC" dateStyle="medium" value={props.subscription.startDate} />,
                }}
              />
            )}
          </div>
          <div>
            {props.subscription.isCurrent ? (
              <Badge type="info" size="sm" className="px-4">
                <FormattedMessage defaultMessage="Active" id="Subscriptions.Active" />
              </Badge>
            ) : (
              <Badge type="neutral" size="sm" className="px-4">
                <FormattedMessage defaultMessage="Past Plan" id="yT1ekX" />
              </Badge>
            )}
          </div>
        </div>

        {props.subscription.isCurrent && (
          <div className="flex gap-4 p-4">
            <div className="flex gap-3">
              <div>
                <Shapes />
              </div>
              <div className="flex flex-col gap-1">
                <div>
                  <b>
                    <FormattedMessage
                      defaultMessage="{includedCount} Active Collectives"
                      id="PQL55g"
                      values={{
                        includedCount: props.subscription.plan.pricing.includedCollectives,
                      }}
                    />
                  </b>
                  &nbsp;
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={14} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <FormattedMessage
                        defaultMessage="Active collectives have at least one ledger transaction in the billing period."
                        id="j0U5jT"
                      />
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-sm text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="{amount} / Collective after that"
                    id="vNN8Hw"
                    values={{
                      amount: (
                        <FormattedMoneyAmount
                          amount={props.subscription.plan.pricing.pricePerAdditionalCollective.valueInCents}
                          currency={props.subscription.plan.pricing.pricePerAdditionalCollective.currency}
                        />
                      ),
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <div>
                <Receipt />
              </div>
              <div className="flex flex-col gap-1">
                <div>
                  <b>
                    <FormattedMessage
                      defaultMessage="{includedCount} Paid Expenses"
                      id="V35NqH"
                      values={{
                        includedCount: props.subscription.plan.pricing.includedExpensesPerMonth,
                      }}
                    />
                  </b>
                  &nbsp;
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={14} />
                    </TooltipTrigger>
                    <TooltipContent>
                      <FormattedMessage defaultMessage="Completed expenses with the 'Paid' status." id="IHdyue" />
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="text-sm text-muted-foreground">
                  <FormattedMessage
                    defaultMessage="{amount} / expense after that"
                    id="F7fqJa"
                    values={{
                      amount: (
                        <FormattedMoneyAmount
                          amount={props.subscription.plan.pricing.pricePerAdditionalExpense.valueInCents}
                          currency={props.subscription.plan.pricing.pricePerAdditionalExpense.currency}
                        />
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        {props.subscription.isCurrent && !props.subscription.endDate && (
          <div className="w-full rounded-xl rounded-t-none bg-green-100 py-2 text-center text-sm font-bold text-oc-blue-tints-900">
            <FormattedMessage
              defaultMessage="On {dueDate}, your subscription will be renewed and you will be billed {basePrice}"
              id="yrldr5"
              values={{
                dueDate: <FormattedDate dateStyle="medium" timeZone="UTC" value={props.billing.dueDate} />,
                basePrice: (
                  <FormattedMoneyAmount
                    amount={props.billing.baseAmount.valueInCents}
                    currency={props.billing.baseAmount.currency}
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
