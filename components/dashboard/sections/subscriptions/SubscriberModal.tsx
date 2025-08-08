import React from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { Form } from 'formik';
import { compact, flatten, get, isPlainObject } from 'lodash';
import { FormattedMessage } from 'react-intl';
import { z } from 'zod';

import { API_V2_CONTEXT, gql } from '@/lib/graphql/helpers';
import type { SubscriberFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import Avatar from '@/components/Avatar';
import { FormField } from '@/components/FormField';
import { FormikZod } from '@/components/FormikZod';
import InputAmount from '@/components/InputAmount';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { DefaultSelect } from '@/components/ui/Select';

import { updateAccountPlaformSubscriptionMutation } from './queries';

type SubscriberFormProps = {
  account: SubscriberFieldsFragment;
  isLegacy?: boolean;
  onUpdate?: () => void;
};

const schema = z.object({
  account: z.object({
    id: z.string(),
  }),
  plan: z.object({
    basePlanId: z.string().optional(),
    title: z.string(),
    type: z.string(),
    pricing: z.object({
      pricePerMonth: z.object({ valueInCents: z.number().min(0) }),
      pricePerAdditionalCollective: z.object({ valueInCents: z.number().min(0) }),
      pricePerAdditionalExpense: z.object({ valueInCents: z.number().min(0) }),
      includedCollectives: z.number().min(0),
      includedExpensesPerMonth: z.number().min(0),
    }),
    features: z.array(z.string()).optional(),
  }),
});

const plansQuery = gql`
  query Plans {
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
`;
type FormValuesSchema = z.infer<typeof schema>;

const keysDeep = (obj: object, prefix?: string, omit?: string[]) =>
  compact(
    flatten(
      Object.keys(obj).map(key => {
        const path = [prefix, key].filter(x => x !== undefined).join('.');
        if (omit?.includes(key)) {
          return null;
        } else if (isPlainObject(get(obj, key))) {
          return flatten(keysDeep(obj[key], path, omit));
        } else {
          return path;
        }
      }),
    ),
  );

const SubscriberForm = (props: SubscriberFormProps) => {
  const { data, loading } = useQuery(plansQuery, { context: API_V2_CONTEXT });
  const [updateSubscription, { loading: updating }] = useMutation(updateAccountPlaformSubscriptionMutation, {
    context: API_V2_CONTEXT,
  });
  const planOptions = data?.platformSubscriptionTiers.map(plan => ({
    value: plan.id,
    label: plan.title,
    data: plan,
  }));

  if (loading || !data) {
    return <div>Loading...</div>;
  }

  const handleSubmit = async (values: FormValuesSchema) => {
    await updateSubscription({
      variables: {
        account: values.account,
        subscription: { plan: values.plan },
      },
    });
  };

  return (
    <FormikZod<FormValuesSchema>
      schema={schema}
      onSubmit={handleSubmit}
      initialValues={{
        account: { id: props.account.id },
      }}
    >
      {({ setFieldValue, submitForm }) => (
        <Form className="flex flex-col gap-2" onSubmit={submitForm}>
          <div className="flex flex-col gap-1">
            <label className="text-sm leading-normal font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Account
            </label>
            <div className="flex h-10 w-full flex-1 flex-row items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background outline-hidden">
              <Avatar collective={props.account} radius={20} />
              {props.account.name}
            </div>
          </div>
          <FormField name="basePlanId" label={<FormattedMessage id="BaseTier" defaultMessage="Base Tier" />}>
            {({ field }) => (
              <DefaultSelect
                name={field.name}
                placeholder="Select Plan"
                options={planOptions || []}
                value={field.value}
                setValue={value => {
                  const plan = planOptions.find(option => option.value === value);
                  setFieldValue(field.name, plan.value);
                  const fields = keysDeep(plan.data, undefined, ['__typename', 'id']);
                  fields.forEach(f => {
                    const value = get(plan.data, f);
                    setFieldValue(`plan.${f}`, value);
                  });
                }}
              />
            )}
          </FormField>
          <FormField
            name="plan.title"
            label={<FormattedMessage id="CustomTierName" defaultMessage="Custom Tier Name" />}
          />
          <FormField
            name="plan.pricing.pricePerMonth.valueInCents"
            label={<FormattedMessage id="PricePerMonth" defaultMessage="Base Monthly Price" />}
          >
            {({ field }) => (
              <InputAmount
                name={field.name}
                currency="USD"
                value={field.value}
                onChange={value => setFieldValue(field.name, value)}
              />
            )}
          </FormField>
          <FormField
            name="plan.pricing.includedCollectives"
            label={<FormattedMessage id="IncludedCollectives" defaultMessage="Included Active Collectives" />}
            type="number"
          />
          <FormField
            name="plan.pricing.pricePerAdditionalCollective.valueInCents"
            label={
              <FormattedMessage
                id="PricePerAdditionalActiveCollective"
                defaultMessage="Price per additional active collective"
              />
            }
            placeholder="Enter price"
          >
            {({ field }) => (
              <InputAmount
                name={field.name}
                currency="USD"
                value={field.value}
                onChange={value => setFieldValue(field.name, value)}
              />
            )}
          </FormField>
          <FormField
            name="plan.pricing.includedExpensesPerMonth"
            label={<FormattedMessage id="IncludedExpenses" defaultMessage="Included Expenses" />}
            type="number"
            placeholder="Enter limit"
          />
          <FormField
            name="plan.pricing.pricePerAdditionalExpense.valueInCents"
            label={
              <FormattedMessage id="PricePerAdditionalActiveExpense" defaultMessage="Price per additional Expense" />
            }
            placeholder="Enter price"
          >
            {({ field }) => (
              <InputAmount
                name={field.name}
                currency="USD"
                value={field.value}
                onChange={value => setFieldValue(field.name, value)}
              />
            )}
          </FormField>

          <div className="mt-2 flex w-full flex-col justify-stretch gap-2">
            {props.isLegacy && (
              <Alert
                className="relative flex flex-col items-center gap-2 bg-destructive/5 fade-in"
                variant="destructive"
              >
                <AlertDescription>
                  This account is currently subscribed to a legacy plan, upgrading it to a new subscription plan is
                  irreversible.
                </AlertDescription>
              </Alert>
            )}
            <Button type="button" onClick={submitForm} className="grow" loading={updating}>
              {props.isLegacy ? (
                <FormattedMessage id="UpgradeSubscription" defaultMessage="Upgrade Subscription" />
              ) : (
                <FormattedMessage id="save" defaultMessage="Save" />
              )}
            </Button>
          </div>
        </Form>
      )}
    </FormikZod>
  );
};

export default function SubscriberModal({
  open,
  setOpen,
  ...formProps
}: { open: boolean; setOpen: (open: boolean) => void } & SubscriberFormProps) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FormattedMessage id="EditSubscription" defaultMessage="Edit Subscription" />
          </DialogTitle>
        </DialogHeader>
        <SubscriberForm {...formProps} onUpdate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
