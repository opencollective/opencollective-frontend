import React from 'react';
import { gql, useMutation } from '@apollo/client';
import { Form, FormikProps } from 'formik';
import { z } from 'zod';

import { GoalType } from '../../lib/graphql/types/v2/graphql';

import { FormikZod } from '../FormikZod';
import { Button } from '../ui/Button';

import { GoalContributors, GoalPreview, GoalProgress, GoalProgressBar, GoalProgressLabel } from './GoalProgress';
import { FormField } from '../FormField';
import { InputGroup } from '../ui/Input';
import { Separator } from '../ui/Separator';
import { FormattedMessage } from 'react-intl';
import { ButtonSet } from '../ui/ButtonSet';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { RadioGroup, RadioGroupItem } from '../ui/RadioGroup';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { Switch } from '../ui/Switch';

const schema = z.object({
  type: z.nativeEnum(GoalType).default(GoalType.ALL_TIME),
  amount: z.coerce.number().min(0).default(0),

  recurring: z.enum(['no', 'monthly', 'yearly']).default('no'),
  continuous: z.boolean().default(false),
});

const setGoalMutation = gql`
  mutation SetGoal($accountSlug: String!, $goal: GoalInput) {
    setGoal(account: { slug: $accountSlug }, goal: $goal) {
      type
      amount {
        valueInCents
        currency
      }
      progress
    }
  }
`;
export const GoalsForm = ({ account }) => {
  console.log({ account });
  const initialValues = account?.goal
    ? { type: account.goal.type, amount: account.goal.amount.valueInCents / 100, recurring: 'no', continuous: false }
    : { type: GoalType.ALL_TIME, amount: 0, recurring: 'no', continuous: false };
  const [setGoal, { loading }] = useMutation(setGoalMutation, {
    context: API_V2_CONTEXT,
  });
  const [isEditing, setIsEditing] = React.useState(false);
  if (!account) return null;

  return (
    <FormikZod
      schema={schema}
      initialValues={initialValues}
      onSubmit={async values => {
        console.log({ values });
        await setGoal({
          variables: { accountSlug: account.slug, goal: { ...values, amount: values.amount * 100 } },
        });
        setIsEditing(false);
      }}
    >
      {(formik: FormikProps<z.infer<typeof schema>>) => {
        console.log({ formik });

        if (!isEditing) {
          if (account.goal) {
            return (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between gap-3">
                  <GoalProgressLabel goal={account.goal} className="text-base" />
                  <Button size="sm" onClick={() => setIsEditing(true)} className="" variant="outline">
                    Edit
                  </Button>
                </div>
                <div className="space-y-4">
                  <GoalProgressBar goal={account.goal} />
                  <GoalContributors goal={account.goal} />
                </div>
              </div>
            );
          }
          return (
            <div className="space-y-4">
              <Button onClick={() => setIsEditing(true)} className="" variant="outline">
                Set a goal
              </Button>{' '}
              <div className="text-sm text-muted-foreground">{`You can set 1 goal at a time. If you reach your goal, you'll be able to set a new one.`}</div>
            </div>
          );
        }
        const currentType = formik.values.type || initialValues.type;
        return (
          <Form>
            <div className="flex flex-col items-start gap-4 rounded-lg border">
              <div className="space-y-6 px-6 pb-2 pt-6">
                <FormField name="amount" label={"Amount you're aiming for"}>
                  {({ field }) => {
                    return (
                      <div className="flex items-center gap-2">
                        <InputGroup
                          {...field}
                          onChange={e => formik.setFieldValue(field.name, e.target.value)}
                          prepend={'$'}
                        />
                        <span className="text-muted-foreground">
                          {[GoalType.MONTHLY_BUDGET, GoalType.CALENDAR_MONTH].includes(currentType)
                            ? '/month'
                            : [GoalType.YEARLY_BUDGET, GoalType.CALENDAR_YEAR].includes(currentType)
                              ? '/year'
                              : null}
                        </span>
                      </div>
                    );
                  }}
                </FormField>
                <FormField name="reccuring" label="Is it recurring?">
                  {({ field }) => {
                    return (
                      <ButtonSet
                        options={[
                          { value: 'no', label: 'No' },
                          { value: 'monthly', label: 'Monthly' },
                          { value: 'yearly', label: 'Yearly' },
                        ]}
                        selected={field.value}
                        onChange={value => {
                          switch (value) {
                            case 'monthly':
                              if (formik.values.continuous) {
                                formik.setFieldValue('type', GoalType.MONTHLY_BUDGET);
                              } else {
                                formik.setFieldValue('type', GoalType.CALENDAR_MONTH);
                              }
                              break;
                            case 'yearly':
                              if (formik.values.continuous) {
                                formik.setFieldValue('type', GoalType.YEARLY_BUDGET);
                              } else {
                                formik.setFieldValue('type', GoalType.CALENDAR_YEAR);
                              }
                              formik.setFieldValue('continuous', value);
                              break;
                            case 'no':
                              formik.setFieldValue('type', GoalType.ALL_TIME);
                              formik.setFieldValue('continuous', value);
                          }
                          formik.setFieldValue(field.name, value);
                        }}
                      />
                    );
                  }}
                </FormField>
                <FormField name="continuous">
                  {({ field }) => {
                    return (
                      <div className="mt-4 flex flex-row items-center justify-between gap-4 rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <Label className="text-base">Continuous calculation</Label>
                          <p className="text-sm text-muted-foreground">
                            Default goal progress calculation for recurring goals is based on calendar periods. For
                            recurring monthly goals, goal progress is based on contributions made in a given calendar
                            month (eg: May). For recurring yearly goals, goal progress is based on contributions made in
                            the given year (eg: 2024).
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Continuous calculation is an alternative calculation algorithm that is based on time
                            relative to the present moment. For recurring monthly goals, goal progress is based on
                            contribution made during the last 30 days. For recurring yearly goals, goal progress is
                            based on contributions made during the last 365 days.
                          </p>
                        </div>
                        <Switch
                          checked={field.value}
                          onCheckedChange={val => {
                            formik.setFieldValue('continuous', val);
                            if (val) {
                              switch (formik.values.recurring) {
                                case 'no':
                                  break;
                                case 'monthly':
                                  formik.setFieldValue('type', GoalType.MONTHLY_BUDGET);
                                  break;
                                case 'yearly':
                                  formik.setFieldValue('type', GoalType.YEARLY_BUDGET);
                                  break;
                              }
                            } else {
                              switch (formik.values.recurring) {
                                case 'no':
                                  break;
                                case 'monthly':
                                  formik.setFieldValue('type', GoalType.CALENDAR_MONTH);
                                  break;
                                case 'yearly':
                                  formik.setFieldValue('type', GoalType.CALENDAR_YEAR);
                                  break;
                              }
                            }
                          }}
                        />
                      </div>
                    );
                  }}
                </FormField>
              </div>
              <Separator />
              <div className="w-full space-y-4 px-6 py-2">
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold">Goal progress preview</span> (based on existing contributions)
                </span>
                <GoalPreview account={account} goalInput={formik.values} />
              </div>
              <Separator />
              <div className="flex w-full items-center justify-between gap-4 px-6 pb-6 pt-2">
                <div className="flex items-center gap-2">
                  <Button type="submit" loading={formik.isSubmitting}>
                    <FormattedMessage defaultMessage="Save" id="save" />
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <FormattedMessage defaultMessage="Cancel" id="cancel" />
                  </Button>
                </div>
                <Button variant="ghost" className="text-red-700" onClick={() => setIsEditing(false)}>
                  Remove goal
                </Button>
              </div>
            </div>
          </Form>
        );
      }}
    </FormikZod>
  );
};
