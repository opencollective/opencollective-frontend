import React from 'react';
import { gql, useQuery } from '@apollo/client';
import { useFormik } from 'formik';
import { Info, Receipt, Shapes } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT } from '@/lib/graphql/helpers';
import type {
  PlatformSubscriptionFieldsFragment,
  PlatformSubscriptionFormQuery,
  PlatformSubscriptionFormQueryVariables,
} from '@/lib/graphql/types/v2/graphql';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import type { BaseModalProps } from '../ModalContext';
import { Button } from '../ui/Button';
import { RadioGroup, RadioGroupCard } from '../ui/RadioGroup';
import { Separator } from '../ui/Separator';
import { Skeleton } from '../ui/Skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

import type { PlatformSubscriptionTierType } from './constants';
import {
  PlatformSubscriptionTierDescription,
  PlatformSubscriptionTierFeatures,
  PlatformSubscriptionTierIcon,
  PlatformSubscriptionTiers,
  PlatformSubscriptionTierTagLine,
  PlatformSubscriptionTierTitles,
} from './constants';
import { PlatformSubscriptionFeatureList } from './PlatformSubscriptionFeatureList';

type ManageSubscriptionModalProps = {
  currentPlan?: PlatformSubscriptionFieldsFragment['plan'];
} & BaseModalProps;

export function ManageSubscriptionModal(props: ManageSubscriptionModalProps) {
  return (
    <Dialog open={props.open} onOpenChange={isOpen => props.setOpen(isOpen)}>
      <DialogContent className="sm:max-w-max">
        <DialogHeader className="mb-4">
          <DialogTitle>Manage Subscription</DialogTitle>
        </DialogHeader>

        <PlatformSubscriptionForm currentPlan={props.currentPlan} />
      </DialogContent>
    </Dialog>
  );
}

type PlatformSubscriptionFormProps = {
  currentPlan?: PlatformSubscriptionFieldsFragment['plan'];
};

function PlatformSubscriptionForm(props: PlatformSubscriptionFormProps) {
  const query = useQuery<PlatformSubscriptionFormQuery, PlatformSubscriptionFormQueryVariables>(
    gql`
      query PlatformSubscriptionForm {
        platformSubscriptionTiers {
          id
          title
          type
          pricing {
            pricePerMonth {
              valueInCents
              currency
            }
            pricePerAdditionalCollective {
              valueInCents
              currency
            }
            pricePerAdditionalExpense {
              valueInCents
              currency
            }
            includedCollectives
            includedExpensesPerMonth
          }
        }
      }
    `,
    {
      context: API_V2_CONTEXT,
    },
  );

  const form = useFormik({
    initialValues: {
      tier: props.currentPlan?.type ?? ('Discover' as PlatformSubscriptionTierType),
      planId: '',
    },
    onSubmit() {},
  });

  const plans = React.useMemo(() => {
    if (query.data?.platformSubscriptionTiers?.length > 0) {
      return query.data.platformSubscriptionTiers.filter(plan => plan.type === form.values.tier);
    }

    return [];
  }, [query.data?.platformSubscriptionTiers, form.values.tier]);

  const currentPlanMatch = React.useMemo(() => {
    if (props.currentPlan && query.data?.platformSubscriptionTiers?.length > 0) {
      return query.data?.platformSubscriptionTiers.find(
        plan =>
          plan.type === props.currentPlan.type &&
          plan.pricing.pricePerMonth.valueInCents === props.currentPlan.pricing.pricePerMonth.valueInCents,
      );
    }
    return null;
  }, [query.data?.platformSubscriptionTiers, props.currentPlan]);

  const { setFieldValue } = form;
  React.useEffect(() => {
    if (!form.values.planId && plans.length > 0) {
      if (currentPlanMatch && currentPlanMatch.type === form.values.tier) {
        setFieldValue('planId', currentPlanMatch.id);
        return;
      }

      setFieldValue('planId', plans[0].id);
    }

    if (form.values.planId && !plans.some(plan => plan.id === form.values.planId)) {
      setFieldValue('planId', '');
    }
  }, [plans, form.values.planId, form.values.tier, currentPlanMatch, setFieldValue]);

  const isValidSelection = form.values.planId && currentPlanMatch?.id !== form.values.planId;
  if (query.error) {
    return <MessageBoxGraphqlError error={query.error} />;
  }

  return (
    <React.Fragment>
      <div className="flex items-center gap-4">
        <div className="font-bold text-nowrap">Choose a tier</div>
        <Separator className="w-auto grow" />
      </div>

      {query.loading ? (
        <div className="flex gap-4">
          <Skeleton className="h-96 w-72" />
          <Skeleton className="h-96 w-72" />
          <Skeleton className="h-96 w-72" />
        </div>
      ) : (
        <RadioGroup
          className="flex grow gap-4"
          value={form.values.tier}
          onValueChange={value => form.setFieldValue('tier', value as PlatformSubscriptionTierType)}
        >
          {PlatformSubscriptionTiers.map(tier => (
            <RadioGroupCard
              key={tier}
              value={tier}
              className="flex w-min grow flex-col"
              indicatorClassName="self-start absolute top-4 left-4"
              contentClassName="flex-col"
            >
              <PlatformSubscriptionTierCard tier={tier} isCurrent={tier === props.currentPlan.type} />
            </RadioGroupCard>
          ))}
        </RadioGroup>
      )}

      <div className="mt-8 flex items-center gap-4">
        <div className="font-bold text-nowrap">Choose a plan</div>
        <Separator className="w-auto grow" />
      </div>

      {query.loading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <RadioGroup
          className="flex grow flex-col gap-4"
          value={form.values.planId}
          onValueChange={value => form.setFieldValue('planId', value as PlatformSubscriptionTierType)}
        >
          {plans.map(plan => (
            <RadioGroupCard
              key={plan.id}
              value={plan.id}
              showSubcontent={plan.id === form.values.planId}
              subContent={<PlatformSubscriptionPlanCard plan={plan} />}
            >
              <div className="flex grow justify-between gap-4">
                <div>
                  {currentPlanMatch?.id === plan.id ? (
                    <div>
                      <b>Current</b>:&nbsp;{plan.title}
                    </div>
                  ) : (
                    plan.title
                  )}
                </div>
                <div>
                  <FormattedMoneyAmount
                    amount={plan.pricing.pricePerMonth.valueInCents}
                    currency={plan.pricing.pricePerMonth.currency}
                  />
                </div>
              </div>
            </RadioGroupCard>
          ))}
        </RadioGroup>
      )}
      <Button disabled={!isValidSelection}>Update</Button>
    </React.Fragment>
  );
}

type PlatformSubscriptionPlanCardProps = {
  plan: PlatformSubscriptionFormQuery['platformSubscriptionTiers'][number];
};

function PlatformSubscriptionPlanCard(props: PlatformSubscriptionPlanCardProps) {
  return (
    <div>
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
                    includedCount: props.plan.pricing.includedCollectives,
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
                      amount={props.plan.pricing.pricePerAdditionalCollective.valueInCents}
                      currency={props.plan.pricing.pricePerAdditionalCollective.currency}
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
                    includedCount: props.plan.pricing.includedExpensesPerMonth,
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
                      amount={props.plan.pricing.pricePerAdditionalExpense.valueInCents}
                      currency={props.plan.pricing.pricePerAdditionalExpense.currency}
                    />
                  ),
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

type PlatformSubscriptionTierCardProps = {
  tier: PlatformSubscriptionTierType;
  isCurrent?: boolean;
  includePrice?: boolean;
  includePackageDetails?: boolean;
  packages?: any[];
};

export function PlatformSubscriptionTierCard(props: PlatformSubscriptionTierCardProps) {
  const Icon = PlatformSubscriptionTierIcon[props.tier];
  const titleMessage = PlatformSubscriptionTierTitles[props.tier];
  const tagLineMessage = PlatformSubscriptionTierTagLine[props.tier];
  const descriptionMessage = PlatformSubscriptionTierDescription[props.tier];
  const features = PlatformSubscriptionTierFeatures[props.tier];
  console.log({ packages: props.packages });
  return (
    <div className="pt-2 pb-5">
      <div className="mb-6 flex justify-center">
        <div className="rounded-full bg-muted p-3">
          <Icon className="size-6 text-muted-foreground" />
        </div>
      </div>
      <div className="flex justify-center text-2xl font-bold">
        <FormattedMessage {...titleMessage} />
      </div>
      <div className="mt-2 flex justify-center text-sm font-medium text-nowrap text-blue-600">
        <FormattedMessage {...tagLineMessage} />
      </div>

      <div className="mt-2 mb-6 flex justify-center text-center text-sm text-muted-foreground">
        <FormattedMessage {...descriptionMessage} />
      </div>
      {props.includePrice && props.packages && (
        <div className="mt-6 mb-6 space-y-1 text-center">
          <p>
            <span className="text-4xl font-bold text-slate-900">
              <FormattedMoneyAmount
                amount={props.packages[0].pricing.pricePerMonth.valueInCents}
                currency={props.packages[0].pricing.pricePerMonth.currency}
                showCurrencyCode={false}
                precision={0}
              />
            </span>
            <span className="text-sm text-muted-foreground">/month</span>
          </p>
        </div>
      )}
      {props.includePackageDetails && props.packages?.length && (
        <div className="mt-6 mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-700">Active collectives included</span>
              <span className="font-medium text-slate-900">{props.packages[0].pricing.includedCollectives}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Price per additional collective</span>
              <span className="font-medium text-slate-900">
                <FormattedMoneyAmount
                  amount={props.packages[0].pricing.pricePerAdditionalCollective.valueInCents}
                  currency={props.packages[0].pricing.pricePerAdditionalCollective.currency}
                  showCurrencyCode={false}
                />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Monthly expenses included</span>
              <span className="font-medium text-slate-900">{props.packages[0].pricing.includedExpensesPerMonth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-700">Price per additional expense</span>
              <span className="font-medium text-slate-900">
                <FormattedMoneyAmount
                  amount={props.packages[0].pricing.pricePerAdditionalExpense.valueInCents}
                  currency={props.packages[0].pricing.pricePerAdditionalExpense.currency}
                  showCurrencyCode={false}
                />
              </span>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="mt-4 w-full rounded-full">
                See more plans
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  <FormattedMessage {...titleMessage} /> Packages
                </DialogTitle>
                <DialogDescription>Choose the perfect package for your organization's needs.</DialogDescription>
              </DialogHeader>
              <div className="">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-medium text-foreground">Active Collectives</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Monthly Expenses</th>
                        <th className="px-4 py-3 text-left font-medium text-foreground">Monthly Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.packages?.map(pkg => (
                        <tr key={pkg.id} className="border-b border-border hover:bg-muted/50">
                          <td className="px-4 py-3 text-foreground">{pkg.pricing.includedCollectives}</td>
                          <td className="px-4 py-3 text-foreground">{pkg.pricing.includedExpensesPerMonth}</td>
                          <td className="px-4 py-3 text-foreground">
                            <FormattedMoneyAmount
                              amount={pkg.pricing.pricePerMonth.valueInCents}
                              currency={pkg.pricing.pricePerMonth.currency}
                              showCurrencyCode={false}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 rounded-lg bg-muted p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per additional collective</span>
                      <span className="font-medium text-foreground">
                        <FormattedMoneyAmount
                          amount={props.packages?.[0].pricing.pricePerAdditionalCollective.valueInCents}
                          currency={props.packages?.[0].pricing.pricePerAdditionalCollective.currency}
                          showCurrencyCode={false}
                        />
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per additional expense</span>
                      <span className="font-medium text-foreground">
                        <FormattedMoneyAmount
                          amount={props.packages?.[0].pricing.pricePerAdditionalExpense.valueInCents}
                          currency={props.packages?.[0].pricing.pricePerAdditionalExpense.currency}
                          showCurrencyCode={false}
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
      <div className="flex grow flex-col justify-end">
        <PlatformSubscriptionFeatureList features={features} />
      </div>
      {props.isCurrent && (
        <div className="absolute bottom-0 left-0 w-full rounded-b-lg border border-blue-400 bg-blue-400 px-4 py-1 text-center font-semibold text-white">
          Current tier
        </div>
      )}
    </div>
  );
}
