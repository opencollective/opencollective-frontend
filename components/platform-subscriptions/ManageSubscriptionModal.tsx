import React from 'react';
import { gql, useMutation, useQuery } from '@apollo/client';
import { clsx } from 'clsx';
import { useFormik } from 'formik';
import { omit } from 'lodash';
import { ArrowLeft, ArrowRight, Check, Info, Minus, Receipt, Shapes } from 'lucide-react';
import Image from 'next/image';
import { defineMessages, FormattedDate, FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '@/lib/errors';
import type {
  PlatformBillingFieldsFragment,
  PlatformSubscriptionFieldsFragment,
  PlatformSubscriptionFormQuery,
  PlatformSubscriptionFormQueryVariables,
  UpdatePlatformSubscriptionMutation,
  UpdatePlatformSubscriptionMutationVariables,
} from '@/lib/graphql/types/v2/graphql';
import { cn } from '@/lib/utils';

import { Dialog, DialogContent, DialogFooter, DialogHeader } from '@/components/ui/Dialog';

import {
  platformSubscriptionFeatures,
  platformSubscriptionFragment,
} from '../dashboard/sections/platform-subscription/fragments';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import type { BaseModalProps } from '../ModalContext';
import { Button } from '../ui/Button';
import { RadioGroup, RadioGroupCard } from '../ui/RadioGroup';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { Separator } from '../ui/Separator';
import { Skeleton } from '../ui/Skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';
import { toast } from '../ui/useToast';

import type { PlatformSubscriptionFeatures, PlatformSubscriptionTierType } from './constants';
import {
  PlatformSubscriptionFeatureTitles,
  PlatformSubscriptionTierDescription,
  PlatformSubscriptionTierFeatures,
  PlatformSubscriptionTierImage,
  PlatformSubscriptionTiers,
  PlatformSubscriptionTierTagLine,
  PlatformSubscriptionTierTitles,
} from './constants';
import { PlatformSubscriptionFeatureList } from './PlatformSubscriptionFeatureList';

type ManageSubscriptionModalProps = {
  currentPlan?: PlatformSubscriptionFieldsFragment['plan'];
  accountSlug: string;
  billing?: PlatformBillingFieldsFragment;
  desiredFeature?: (typeof PlatformSubscriptionFeatures)[number];
} & BaseModalProps;

export function ManageSubscriptionModal(props: ManageSubscriptionModalProps) {
  const [step, setStep] = React.useState<Step>(Step.TIER);
  const intl = useIntl();

  const query = useQuery<PlatformSubscriptionFormQuery, PlatformSubscriptionFormQueryVariables>(gql`
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
        features {
          ...PlatformSubscriptionFeatures
        }
      }
    }
    ${platformSubscriptionFeatures}
  `);

  const [updatePlanMutation] = useMutation<
    UpdatePlatformSubscriptionMutation,
    UpdatePlatformSubscriptionMutationVariables
  >(
    gql`
      mutation UpdatePlatformSubscription($accountSlug: String!, $planId: String!) {
        updateAccountPlatformSubscription(account: { slug: $accountSlug }, planId: $planId) {
          ... on AccountWithPlatformSubscription {
            platformSubscription {
              ...PlatformSubscriptionFields
            }
          }
        }
      }
      ${platformSubscriptionFragment}
    `,
    {
      variables: {
        accountSlug: props.accountSlug,
        planId: '',
      },
      refetchQueries: ['DashboardPlatformSubscription'],
    },
  );

  const initialTierSelection = props.desiredFeature
    ? PlatformSubscriptionTierFeatures.Discover[props.desiredFeature]
      ? 'Discover'
      : PlatformSubscriptionTierFeatures.Basic[props.desiredFeature]
        ? 'Basic'
        : 'Pro'
    : props.currentPlan?.type || 'Discover';

  const form = useFormik({
    initialValues: {
      tier: initialTierSelection as PlatformSubscriptionTierType,
      planId: '',
    },
    async onSubmit(values) {
      try {
        await updatePlanMutation({
          variables: {
            accountSlug: props.accountSlug,
            planId: values.planId,
          },
        });
        toast({ variant: 'success', message: 'Plan updated' });
        props.setOpen(false);
      } catch (err) {
        toast({ variant: 'error', message: i18nGraphqlException(intl, err) });
      }
    },
  });

  const selectedPlan = query.data?.platformSubscriptionTiers?.find(plan => plan.id === form.values.planId);

  return (
    <Dialog open={props.open} onOpenChange={isOpen => props.setOpen(isOpen)}>
      <DialogContent className="sm:max-w-max sm:min-w-[940px]">
        <DialogHeader className="my-1">
          <ManagePlatformSubscriptionSteps step={step} selectedTier={form.values.tier} selectedPlan={selectedPlan} />
        </DialogHeader>

        {query.error ? (
          <MessageBoxGraphqlError error={query.error} />
        ) : (
          <PlatformSubscriptionForm
            availablePlans={query.data?.platformSubscriptionTiers ?? []}
            loading={query.loading}
            form={form}
            step={step}
            setStep={setStep}
            currentPlan={props.currentPlan}
            billing={props.billing}
            accountSlug={props.accountSlug}
            onSuccess={() => props.setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

type PlatformSubscriptionFormProps = {
  availablePlans: PlatformSubscriptionFormQuery['platformSubscriptionTiers'];
  loading?: boolean;
  form: ReturnType<typeof useFormik<{ planId: string; tier: string }>>;
  currentPlan?: PlatformSubscriptionFieldsFragment['plan'];
  billing?: PlatformBillingFieldsFragment;
  accountSlug: string;
  onSuccess: (plan: PlatformSubscriptionFieldsFragment['plan']) => void;
  step: Step;
  setStep: React.Dispatch<React.SetStateAction<Step>>;
};

function PlatformSubscriptionForm(props: PlatformSubscriptionFormProps) {
  const plans = React.useMemo(() => {
    if (props.availablePlans.length > 0) {
      return props.availablePlans.filter(plan => plan.type === props.form.values.tier);
    }

    return [];
  }, [props.availablePlans, props.form.values.tier]);

  const currentPlanMatch = React.useMemo(() => {
    if (props.currentPlan && props.availablePlans.length > 0) {
      return props.availablePlans.find(
        plan =>
          plan.type === props.currentPlan.type &&
          plan.pricing.pricePerMonth.valueInCents === props.currentPlan.pricing.pricePerMonth.valueInCents,
      );
    }
    return null;
  }, [props.availablePlans, props.currentPlan]);

  const { setFieldValue } = props.form;
  React.useEffect(() => {
    if (!props.form.values.planId && plans.length > 0) {
      if (currentPlanMatch && currentPlanMatch.type === props.form.values.tier) {
        setFieldValue('planId', currentPlanMatch.id);
        return;
      }

      setFieldValue('planId', plans[0].id);
    }

    if (props.form.values.planId && !plans.some(plan => plan.id === props.form.values.planId)) {
      setFieldValue('planId', '');
    }
  }, [plans, props.form.values.planId, props.form.values.tier, currentPlanMatch, setFieldValue]);

  const selectedPlan = plans?.find(plan => plan.id === props.form.values.planId);
  const isValidSelection =
    props.form.values.planId && currentPlanMatch?.id !== props.form.values.planId && selectedPlan;

  return (
    <React.Fragment>
      {props.step === Step.TIER && (
        <TierStep
          loading={props.loading}
          currentPlan={props.currentPlan}
          disabled={props.form.isSubmitting}
          tier={props.form.values.tier}
          onChange={tier => props.form.setFieldValue('tier', tier)}
        />
      )}

      {props.step === Step.PLAN && (
        <PlanStep
          onChange={planId => props.form.setFieldValue('planId', planId)}
          plans={plans}
          currentPlanId={currentPlanMatch?.id}
          currentPlan={props.currentPlan}
          disabled={props.form.isSubmitting}
          loading={props.loading}
          planId={props.form.values.planId}
          billing={props.billing}
        />
      )}

      {props.step === Step.SUMMARY && (
        <SummaryStep selectedPlan={selectedPlan} currentPlan={props.currentPlan} billing={props.billing} />
      )}

      <DialogFooter className="mt-9 flex flex-col border-t pt-4 sm:justify-between">
        <Button
          variant="outline"
          onClick={() => props.setStep(s => s - 1)}
          disabled={props.step === Step.TIER}
          loading={props.form.isSubmitting}
        >
          <ArrowLeft />
          <FormattedMessage defaultMessage="Back" id="Back" />
        </Button>
        {props.step < Step.SUMMARY && (
          <Button variant="outline" onClick={() => props.setStep(s => s + 1)} loading={props.form.isSubmitting}>
            <FormattedMessage defaultMessage="Next" id="Pagination.Next" />
            <ArrowRight />
          </Button>
        )}

        {props.step === Step.SUMMARY && (
          <Button
            onClick={() => props.form.handleSubmit()}
            disabled={!isValidSelection}
            loading={props.form.isSubmitting}
          >
            <FormattedMessage defaultMessage="Update Subscription" id="h8kExM" />
          </Button>
        )}
      </DialogFooter>
    </React.Fragment>
  );
}

type PlatformSubscriptionPlanCardProps = {
  plan: PlatformSubscriptionFormQuery['platformSubscriptionTiers'][number];
};

function PlatformSubscriptionPlanCard(props: PlatformSubscriptionPlanCardProps) {
  return (
    <div>
      <div className="flex gap-4">
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
  children?: React.ReactNode;
};

export function PlatformSubscriptionTierCard(props: PlatformSubscriptionTierCardProps) {
  const imgSrc = PlatformSubscriptionTierImage[props.tier];
  const titleMessage = PlatformSubscriptionTierTitles[props.tier];
  const tagLineMessage = PlatformSubscriptionTierTagLine[props.tier];
  const descriptionMessage = PlatformSubscriptionTierDescription[props.tier];
  const features = PlatformSubscriptionTierFeatures[props.tier];
  return (
    <div className="pt-0 pb-5">
      <div className={cn('relative mx-auto flex justify-center')}>
        <Image src={imgSrc} height={512} width={512} className="!size-40" alt="" aria-hidden />
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
      {props.children}
      <div className="flex grow flex-col justify-end">
        <PlatformSubscriptionFeatureList features={features} />
      </div>
      {props.isCurrent && (
        <div className="absolute top-4 right-0 rounded-l-md bg-oc-blue-tints-050 px-2 py-1 text-center font-semibold text-oc-blue-tints-700">
          Current
        </div>
      )}
    </div>
  );
}

type TierStepProps = {
  tier: string;
  onChange: (tier: PlatformSubscriptionTierType) => void;
  loading?: boolean;
  disabled?: boolean;
  currentPlan?: PlatformSubscriptionFieldsFragment['plan'];
};

function TierStep(props: TierStepProps) {
  return (
    <React.Fragment>
      {props.loading ? (
        <div className="flex gap-4">
          <Skeleton className="h-96 w-72" />
          <Skeleton className="h-96 w-72" />
          <Skeleton className="h-96 w-72" />
        </div>
      ) : (
        <RadioGroup
          disabled={props.disabled}
          className="flex grow flex-wrap gap-4"
          value={props.tier}
          onValueChange={value => props.onChange(value as PlatformSubscriptionTierType)}
        >
          {PlatformSubscriptionTiers.map(tier => (
            <RadioGroupCard
              key={tier}
              value={tier}
              className="flex w-min grow flex-col"
              indicatorClassName="self-start absolute top-4 left-4"
              contentClassName="flex-col"
            >
              <PlatformSubscriptionTierCard tier={tier} isCurrent={tier === props.currentPlan?.type} />
            </RadioGroupCard>
          ))}
        </RadioGroup>
      )}
    </React.Fragment>
  );
}

type PlanStepProps = {
  plans: PlatformSubscriptionFormQuery['platformSubscriptionTiers'];
  planId: string;
  onChange: (planId: string) => void;
  loading?: boolean;
  disabled?: boolean;
  currentPlanId?: string;
  currentPlan?: PlatformSubscriptionFieldsFragment['plan'];
  billing?: PlatformBillingFieldsFragment;
};

function PlanStep(props: PlanStepProps) {
  const hasAdditionalChargesInCurrentBillingPeriod =
    props.billing?.additional?.utilization?.activeCollectives > 0 ||
    props.billing?.additional?.utilization?.expensesPaid > 0;

  const selectedPlan = props.plans?.find(plan => plan.id === props.planId);

  return (
    <React.Fragment>
      {props.loading ? (
        <div>
          <Skeleton className="mb-4 h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div>
          {props.currentPlan && (
            <div className="mb-4 rounded-md border p-4">
              <div className="mb-4 font-bold text-slate-800">
                <FormattedMessage defaultMessage="Current Plan" id="Z3GpJF" />
              </div>
              <PlatformSubscriptionPlanCard plan={props.currentPlan} />
              <div className="mt-4">
                <MessageBox type="info" className="text-sm text-slate-900">
                  <FormattedMessage
                    defaultMessage="In the current billing period, you are using {activeCollectives} active {activeCollectives, plural, one {collective} other {collectives}} and {paidExpenses} paid {paidExpenses, plural, one {expense} other {expenses}}."
                    id="95UXnT"
                    values={{
                      activeCollectives: props.billing?.utilization?.activeCollectives ?? 0,
                      paidExpenses: props.billing?.utilization?.expensesPaid ?? 0,
                    }}
                  />
                  {hasAdditionalChargesInCurrentBillingPeriod && (
                    <React.Fragment>
                      <br />
                      <FormattedMessage
                        defaultMessage="The additional {additionalActiveCollectives} {additionalActiveCollectives, plural, one {collective} other {collectives}} and {additionalPaidExpenses} {additionalPaidExpenses, plural, one {expense} other {expenses}} are incurring additional charges."
                        id="IwAO8T"
                        values={{
                          additionalActiveCollectives: props.billing?.additional?.utilization?.activeCollectives ?? 0,
                          additionalPaidExpenses: props.billing?.additional?.utilization?.expensesPaid ?? 0,
                        }}
                      />
                    </React.Fragment>
                  )}
                </MessageBox>
              </div>
            </div>
          )}
          <div className="rounded-md border p-4">
            <div className="mb-2 font-bold text-slate-800">
              <FormattedMessage defaultMessage="Choose new plan" id="BQcSP9" />
            </div>
            <Select value={props.planId} onValueChange={props.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a plan based on your requirements." />
              </SelectTrigger>
              <SelectContent>
                {props.plans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    <FormattedMessage
                      defaultMessage="{includedCollectives} Active {includedCollectives, plural, one {collective} other {collectives}} / {includedExpensesPerMonth} paid {includedExpensesPerMonth, plural, one {expense} other {expenses}}"
                      id="aQEXoc"
                      values={{
                        includedCollectives: plan.pricing.includedCollectives,
                        includedExpensesPerMonth: plan.pricing.includedExpensesPerMonth,
                      }}
                    />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPlan && (
              <React.Fragment>
                <Separator className="my-4" />
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-bold text-slate-800">
                    <FormattedMessage defaultMessage="Selected Plan" id="Hk2ZEF" />
                  </div>
                  <div className="bg-oc-blue-tints-050 p-2 font-bold text-slate-800">
                    <FormattedMessage
                      defaultMessage="{perMonth} / month"
                      id="Dlu3sp"
                      values={{
                        perMonth: (
                          <FormattedMoneyAmount
                            amount={selectedPlan.pricing.pricePerMonth.valueInCents}
                            currency={selectedPlan.pricing.pricePerMonth.currency}
                          />
                        ),
                      }}
                    />
                  </div>
                </div>
                <PlatformSubscriptionPlanCard plan={selectedPlan} />
              </React.Fragment>
            )}
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

type SummaryStepProps = {
  currentPlan?: PlatformSubscriptionFieldsFragment['plan'];
  selectedPlan: PlatformSubscriptionFormQuery['platformSubscriptionTiers'][number];
  billing?: PlatformBillingFieldsFragment;
};

function SummaryStep(props: SummaryStepProps) {
  const featureDiff = React.useMemo(() => {
    return changedFeatures(props.selectedPlan, props.currentPlan);
  }, [props.currentPlan, props.selectedPlan]);

  return (
    <React.Fragment>
      {props.currentPlan && (
        <div className="rounded-md border p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-bold text-slate-800">
              <FormattedMessage
                defaultMessage="Current Plan: {planTitle}"
                id="ZV0wTF"
                values={{
                  planTitle: props.currentPlan.title,
                }}
              />
            </div>
            <div className="bg-oc-blue-tints-050 p-2 font-bold text-slate-800">
              <FormattedMessage
                defaultMessage="{perMonth} / month"
                id="Dlu3sp"
                values={{
                  perMonth: (
                    <FormattedMoneyAmount
                      amount={props.currentPlan.pricing.pricePerMonth.valueInCents}
                      currency={props.currentPlan.pricing.pricePerMonth.currency}
                    />
                  ),
                }}
              />
            </div>
          </div>
          <Separator className="my-4" />
          <PlatformSubscriptionPlanCard plan={props.currentPlan} />
        </div>
      )}

      <div className="rounded-md border p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="font-bold text-slate-800">
            <FormattedMessage
              defaultMessage="Selected Plan: {planTitle}"
              id="A3BR0d"
              values={{
                planTitle: props.selectedPlan.title,
              }}
            />
          </div>
          <div className="bg-oc-blue-tints-050 p-2 font-bold text-slate-800">
            <FormattedMessage
              defaultMessage="{perMonth} / month"
              id="Dlu3sp"
              values={{
                perMonth: (
                  <FormattedMoneyAmount
                    amount={props.selectedPlan.pricing.pricePerMonth.valueInCents}
                    currency={props.selectedPlan.pricing.pricePerMonth.currency}
                  />
                ),
              }}
            />
          </div>
        </div>
        <Separator className="my-4" />
        <PlatformSubscriptionPlanCard plan={props.selectedPlan} />

        {(featureDiff.added.length > 0 || featureDiff.removed.length > 0) && (
          <React.Fragment>
            <Separator className="my-4" />
            <FeatureDiff added={featureDiff.added} removed={featureDiff.removed} />
          </React.Fragment>
        )}
      </div>

      {props.billing && (
        <div className="rounded-md border p-4 text-sm">
          <div className="mb-4 font-bold text-slate-800">
            <FormattedMessage defaultMessage="Additional Information" id="laUK3e" />
          </div>
          <div className="max-w-[800px]">
            <FormattedMessage
              defaultMessage="Your newly selected plan starts effective immediately. You will be charged on {dueDate} on pro rata basis and the plan will renew automatically."
              id="iUuuNo"
              values={{
                dueDate: <FormattedDate dateStyle="medium" timeZone="UTC" value={props.billing.dueDate} />,
              }}
            />
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

enum Step {
  TIER = 0,
  PLAN = 1,
  SUMMARY = 2,
}

type ManagePlatformSubscriptionStepsProps = {
  step: Step;
  selectedTier: PlatformSubscriptionTierType;
  selectedPlan?: PlatformSubscriptionFormQuery['platformSubscriptionTiers'][number];
};

const StepTitles = defineMessages({
  [Step.TIER]: { defaultMessage: 'Choose Tier', id: 'smQ1pN' },
  [Step.PLAN]: { defaultMessage: 'Choose Plan', id: 'aEbRMo' },
  [Step.SUMMARY]: { defaultMessage: 'Summary', id: 'Summary' },
});

function ManagePlatformSubscriptionSteps(props: ManagePlatformSubscriptionStepsProps) {
  return (
    <div>
      <ol
        className={clsx(
          'flex w-full text-sm leading-4 font-medium tracking-wide uppercase [counter-reset:li]',
          '[&>li]:relative [&>li]:flex [&>li]:shrink [&>li]:grow [&>li]:basis-0 [&>li]:flex-col [&>li]:items-center [&>li]:gap-2',
          '[&>li]:[counter-increment:li] [&>li]:before:flex [&>li]:before:h-8 [&>li]:before:w-8 [&>li]:before:items-center [&>li]:before:justify-center [&>li]:before:self-center [&>li]:before:rounded-full [&>li]:before:border [&>li]:before:border-neutral-400 [&>li]:before:bg-white [&>li]:before:text-center [&>li]:before:text-neutral-500 [&>li]:before:content-[counter(li)]',
          "[&>li[data-state='active']]:text-oc-blue [&>li[data-state='active']]:before:border-2 [&>li[data-state='active']]:before:border-oc-blue [&>li[data-state='active']]:before:text-oc-blue [&>li[data-state='active']]:before:ring-4 [&>li[data-state='active']]:before:ring-oc-primary-100",
          "[&>li[data-state='complete']]:before:border-oc-blue [&>li[data-state='complete']]:before:bg-oc-blue [&>li[data-state='complete']]:before:text-lg [&>li[data-state='complete']]:before:text-white [&>li[data-state='complete']]:before:content-['✓']",
          '[&>li]:after:absolute [&>li]:after:top-4 [&>li]:after:left-1/2 [&>li]:after:-z-10 [&>li]:after:w-full [&>li]:after:border [&>li]:after:border-dashed [&>li]:last:after:hidden',
          "[&>li[data-state='complete']]:after:border-solid [&>li[data-state='complete']]:after:border-oc-blue",
        )}
      >
        {[Step.TIER, Step.PLAN, Step.SUMMARY].map(step => {
          const isComplete = props.step > step;
          const isActive = props.step === step;
          return (
            <li key={step} data-state={isComplete ? 'complete' : isActive ? 'active' : 'none'}>
              <div>
                <div className="text-center">
                  <FormattedMessage {...StepTitles[step]} />
                </div>
                <div className="mt-2 text-center text-base font-normal [text-transform:none]">
                  {step === Step.TIER && (
                    <span
                      className={clsx({
                        invisible: !isComplete || !props.selectedTier,
                      })}
                    >
                      {props.selectedTier}
                    </span>
                  )}
                  {step === Step.PLAN && (
                    <div
                      className={clsx({
                        invisible: !isComplete || !props.selectedPlan?.pricing,
                      })}
                    >
                      <div>
                        <FormattedMessage
                          defaultMessage="{includedCollectives} {includedCollectives, plural, one {active collective} other {active collectives}}"
                          id="G8bZFJ"
                          values={{
                            includedCollectives: props.selectedPlan?.pricing?.includedCollectives,
                          }}
                        />
                      </div>
                      <div>
                        <FormattedMessage
                          defaultMessage="{includedExpensesPerMonth} {includedExpensesPerMonth, plural, one {expense} other {expenses}}"
                          id="x/eaxJ"
                          values={{
                            includedExpensesPerMonth: props.selectedPlan?.pricing?.includedExpensesPerMonth,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function changedFeatures(
  newPlan: PlatformSubscriptionFormQuery['platformSubscriptionTiers'][number],
  oldPlan?: PlatformSubscriptionFieldsFragment['plan'],
): { added: typeof PlatformSubscriptionFeatures; removed: typeof PlatformSubscriptionFeatures } {
  const added = Object.entries(omit(newPlan.features, '__typename')).reduce((acc, [feature, included]) => {
    if (included && !oldPlan?.features?.[feature]) {
      return [...acc, feature];
    }

    return acc;
  }, []);

  const removed = Object.entries(omit(oldPlan?.features, '__typename')).reduce((acc, [feature, included]) => {
    if (included && !newPlan.features[feature]) {
      return [...acc, feature];
    }

    return acc;
  }, []);

  return { added, removed };
}

type FeatureDiffProps = {
  added: typeof PlatformSubscriptionFeatures;
  removed: typeof PlatformSubscriptionFeatures;
};

function FeatureDiff(props: FeatureDiffProps) {
  return (
    <div className="flex gap-4">
      {props.removed.length > 0 && (
        <div>
          <div className="mb-2 font-bold text-slate-800">
            <FormattedMessage defaultMessage="Removed Features:" id="DKAH7z" />
          </div>
          <ul className="flex flex-col gap-2 text-muted-foreground">
            {props.removed.map(feature => (
              <li className="flex gap-4" key={feature}>
                <div>
                  <Minus className="text-muted-foreground" />
                </div>
                {PlatformSubscriptionFeatureTitles[feature] ? (
                  <FormattedMessage {...PlatformSubscriptionFeatureTitles[feature]} />
                ) : (
                  feature
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {props.added.length > 0 && (
        <div>
          <div className="mb-2 font-bold text-slate-800">
            <FormattedMessage defaultMessage="Additional Features:" id="Px5Jio" />
          </div>
          <ul className="flex flex-col gap-2">
            {props.added.map(feature => (
              <li className="flex gap-4" key={feature}>
                <div>
                  <Check className="text-green-400" />
                </div>
                {PlatformSubscriptionFeatureTitles[feature] ? (
                  <FormattedMessage {...PlatformSubscriptionFeatureTitles[feature]} />
                ) : (
                  feature
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
