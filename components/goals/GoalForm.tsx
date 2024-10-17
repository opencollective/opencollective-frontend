import React from 'react';
import { FormikZod } from '../FormikZod';
import { FormikProps } from 'formik';
import { z } from 'zod';
import { GoalType } from '../../lib/graphql/types/v2/graphql';
import { gql, useMutation } from '@apollo/client';
import { GoalContributors, GoalProgressBar, GoalProgressLabel } from './GoalProgress';
import { Button } from '../ui/Button';

const schema = z.object({
  type: z.nativeEnum(GoalType).default(GoalType.ALL_TIME),
  amount: z.number().min(0).default(0),
});

const setGoalMutation = gql`
  mutation SetGoal($account: AccountReferenceInput!, $goal: GoalInput) {
    setGoal(account: $account, goal: $goal) {
      type
      amount {
        valueInCents
        currency
      }
      progress
    }
  }
`;
export const GoalsForm = ({ onSubmit, account }) => {
  const initialValues = account.goal || { type: GoalType.ALL_TIME, amount: 0 };
  const [setGoal] = useMutation(setGoalMutation, { variables: { account: { slug: account.slug } } });
  const [isEditing, setIsEditing] = React.useState(false);
  return (
    <FormikZod
      schema={schema}
      initialValues={initialValues}
      onSubmit={async values => {
        setGoal({ variables: { goal: { ...values, amount: values.amount * 100 } } });
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
                  <GoalProgressLabel account={account} goal={account.goal} className="text-base" />
                  <Button size="sm" onClick={() => setIsEditing(true)} className="" variant="outline">
                    Edit
                  </Button>
                </div>
                <div className="space-y-4">
                  <GoalProgressBar account={account} goal={goal} />
                  <GoalContributors account={account} />
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
        const currentType = formik.values.goal?.type || initialValues.goal?.type;
        return (
          <Form>
            <div className="flex flex-col items-start gap-4 rounded-lg border">
              <div className="px-6 pb-2 pt-6">
                <FormField name="goal.type" label="What is your goal based on?">
                  {({ field }) => {
                    console.log({ field });
                    return (
                      <RadioGroup {...field} onValueChange={v => formik.setFieldValue(field.name, v)} className="mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="MONTHLY" id="MONTHLY" />
                          <Label htmlFor="MONTHLY">Contributions per month</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="YEARLY" id="YEARLY" />
                          <Label htmlFor="YEARLY">Contributions per year</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="FIXED" id="FIXED" />
                          <Label htmlFor="FIXED">Total contributions</Label>
                        </div>
                      </RadioGroup>
                    );
                  }}
                </FormField>
              </div>
              <Separator />
              <div className="w-full space-y-4 px-6 py-2">
                <FormField
                  name="goal.amount"
                  label={
                    currentType === 'MONTHLY'
                      ? "Monthly amount you're aiming for"
                      : currentType === 'YEARLY'
                        ? "Yearly amount you're aiming for"
                        : "Total amount you're aiming for"
                  }
                >
                  {({ field }) => {
                    return (
                      <div className="flex items-center gap-2">
                        <InputGroup {...field} prepend={'$'} />
                        <span className="text-muted-foreground">
                          {currentType === 'MONTHLY' ? '/month' : currentType === 'YEARLY' ? '/year' : null}
                        </span>
                      </div>
                    );
                  }}
                </FormField>

                <FormField name="goal.description" label="Describe your goal">
                  {({ field }) => {
                    return (
                      <Textarea
                        {...field}
                        // onChange={e => field.onChange(e.target.value)}
                        placeholder="Reaching this goal will..."
                      />
                    );
                  }}
                </FormField>
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
                  Retire goal
                </Button>
              </div>
            </div>
          </Form>
        );
      }}
    </FormikZod>
  );
};
