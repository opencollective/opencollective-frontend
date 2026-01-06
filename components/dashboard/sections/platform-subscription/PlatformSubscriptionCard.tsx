import React from 'react';
import { clsx } from 'clsx';
import { ArrowRight, ChevronDown, ChevronUp, Info, Receipt, Shapes } from 'lucide-react';
import { FormattedDate, FormattedMessage } from 'react-intl';

import type { PlatformSubscriptionFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import FormattedMoneyAmount from '@/components/FormattedMoneyAmount';
import { useModal } from '@/components/ModalContext';
import { SubscriptionFeaturesModal } from '@/components/platform-subscriptions/SubscriptionFeaturesModal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/Tooltip';

type PlatformSubscriptionCardProps = {
  subscription: PlatformSubscriptionFieldsFragment;
  hasHosting: boolean;
};

export function PlatformSubscriptionCard(props: PlatformSubscriptionCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const periodLabel = props.subscription.endDate ? (
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
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex w-full flex-col rounded-xl border">
        <div className="mb-4 flex items-center justify-between px-4 pt-4">
          <div className="font-bold">
            <span>{periodLabel}</span>
            {!props.subscription.isCurrent && <span>&nbsp;-&nbsp;{props.subscription.plan.title}</span>}
          </div>
          <div className="flex gap-2">
            <div className="flex items-center text-nowrap">
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
            {!props.subscription.isCurrent && (
              <Button onClick={() => setIsExpanded(e => !e)} size="sm" variant="ghost">
                {isExpanded ? <ChevronUp /> : <ChevronDown />}
              </Button>
            )}
          </div>
        </div>

        {(props.subscription.isCurrent || isExpanded) && (
          <PlatformSubscriptionDetails
            className="p-4"
            subscription={props.subscription}
            hasHosting={props.hasHosting}
          />
        )}
      </div>
    </div>
  );
}

export function PlatformSubscriptionDetails(props: PlatformSubscriptionCardProps & { className?: string }) {
  const { showModal } = useModal();

  return (
    <div className={clsx('flex flex-wrap gap-16', props.className)}>
      {props.hasHosting && (
        <div className="flex gap-3">
          <div>
            <Shapes />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center text-sm">
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
            <div className="text-xs text-muted-foreground">
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
      )}

      <div className="flex gap-3">
        <div>
          <Receipt />
        </div>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-center">
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
          <div className="text-xs text-muted-foreground">
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

      <div className="flex grow justify-end">
        <div>
          <Button
            variant="ghost"
            className="text-sm font-bold"
            onClick={() => showModal(SubscriptionFeaturesModal, { features: props.subscription.plan.features })}
          >
            <FormattedMessage defaultMessage="View all features" id="iHBbHN" />
            <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
