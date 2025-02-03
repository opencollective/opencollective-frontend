import React from 'react';
import { gql } from '@apollo/client';
import clsx from 'clsx';
import type { FormikProps } from 'formik';
import { Form } from 'formik';
import { FormattedMessage } from 'react-intl';
import type { z } from 'zod';

import { FormField } from '../../FormField';
import { FormikZod } from '../../FormikZod';
import RichTextEditor from '../../RichTextEditor';
import { Button } from '../../ui/Button';
import { ButtonSet } from '../../ui/ButtonSet';
import { Collapsible, CollapsibleContent } from '../../ui/Collapsible';
import { InputGroup } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/Popover';
import { Separator } from '../../ui/Separator';
import { Switch } from '../../ui/Switch';
import { GoalProgress } from '../GoalProgress';

export function ColumnSection({ title, description, children }) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-full md:col-span-4">
        <div className="text-lg font-medium">{title}</div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="col-span-full md:col-span-8 md:col-start-6">
        <div className="flex flex-col gap-4">{children}</div>
      </div>
    </div>
  );
}

function ColorPicker({ value, onChange }) {
  // Selected colors from tailwind palette
  const options = [
    '#f97316', // orange-500
    '#f59e0b', // amber-500
    '#16a34a', // green-500
    '#14b8a6', // teal-500
    '#0284c7', // sky-600
    '#1d4ed8', // blue-700
    '#4f46e5', // indigo-600
    '#c026d3', // fuchsia-600
    '#db2777', // pink-600
    '#475569', // slate-600
    '#020617', // slate-950
  ];
  return (
    <div>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <div className="size-4 rounded bg-primary" style={{ backgroundColor: value }} />
            {value}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-1.5">
              {options.map(color => (
                <button
                  onClick={() => onChange(color)}
                  key={color}
                  className="size-6 rounded-md"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={value}
                onChange={({ target }) => onChange(target.value)}
                className={clsx(
                  'size-10 cursor-pointer appearance-none overflow-hidden rounded-md border bg-transparent p-2.5',
                  '[&::-moz-color-swatch]:rounded [&::-moz-color-swatch]:border-none [&::-moz-focus-inner]:p-0',
                  '[&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0',
                )}
              />
              <InputGroup prepend="#" value={value?.replace('#', '')} onChange={e => onChange(`#${e.target.value}`)} />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export const editCrowdfundingSettingsMutation = gql`
  mutation EditCrowdfundingRedesignSettings($account: AccountReferenceInput!, $value: JSON!) {
    editAccountSetting(account: $account, key: "crowdfundingRedesign", value: $value) {
      id
      settings
    }
  }
`;

export const MainDetailsForm = ({ initialValues, schema, onSubmit }) => {
  return (
    <FormikZod schema={schema} initialValues={initialValues} onSubmit={values => onSubmit(schema.parse(values))}>
      {(formik: FormikProps<z.infer<typeof schema>>) => {
        return (
          <Form>
            <div className="flex flex-col items-start gap-4">
              <FormField name="name" label="Title" />
              <FormField
                name="description"
                label="Subtitle"
                hint="Large, bold text that appears at the top of your page."
              />
              <FormField name="primaryColor" label="Theme color">
                {({ field }) => {
                  return <ColorPicker {...field} onChange={color => formik.setFieldValue('primaryColor', color)} />;
                }}
              </FormField>
              <Button type="submit" loading={formik.isSubmitting}>
                <FormattedMessage defaultMessage="Save" id="save" />
              </Button>
            </div>
          </Form>
        );
      }}
    </FormikZod>
  );
};

export const GoalsForm = ({ initialValues, schema, onSubmit, account }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  return (
    <FormikZod
      schema={schema}
      initialValues={{ goal: { amount: 0, recurrence: null, continuous: false, ...initialValues.goal } }}
      onSubmit={async values => {
        await onSubmit(schema.parse(values));
        setIsEditing(false);
      }}
    >
      {(formik: FormikProps<z.infer<typeof schema>>) => {
        if (!isEditing) {
          if (initialValues.goal) {
            return (
              <div className="space-y-3 rounded-lg border p-4">
                <GoalProgress
                  accountSlug={account.slug}
                  goal={initialValues.goal}
                  editButton={
                    <Button size="sm" onClick={() => setIsEditing(true)} className="" variant="outline">
                      Edit
                    </Button>
                  }
                />
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
              <div className="space-y-6 px-6 pt-6 pb-2">
                <FormField name="goal.amount" label={"Amount you're aiming for"}>
                  {({ field }) => {
                    return (
                      <div className="flex items-center gap-2">
                        <InputGroup
                          {...field}
                          onChange={e => {
                            formik.setFieldValue(field.name, Number(e.target.value));
                          }}
                          prepend={'$'}
                        />
                        <span className="text-muted-foreground">
                          {currentType === 'MONTHLY' ? '/month' : currentType === 'YEARLY' ? '/year' : null}
                        </span>
                      </div>
                    );
                  }}
                </FormField>
                <FormField name="goal.recurrence" label="Is it recurring?">
                  {({ field }) => {
                    return (
                      <ButtonSet
                        getKey={value => (value ? value.toString() : 'null')}
                        options={[
                          { value: null, label: 'No' },
                          { value: 'MONTHLY', label: 'Monthly' },
                          { value: 'YEARLY', label: 'Yearly' },
                        ]}
                        selected={field.value}
                        onChange={value => {
                          formik.setFieldValue(field.name, value);
                        }}
                      />
                    );
                  }}
                </FormField>
                <Collapsible open={Boolean(formik.values.goal?.recurrence)}>
                  <CollapsibleContent>
                    <FormField name="goal.continuous">
                      {({ field }) => {
                        return (
                          <div className="mt-4 flex flex-row items-center justify-between gap-4 rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <Label className="text-base">Continuous calculation</Label>
                              <div className="space-y-3">
                                <p className="text-sm text-muted-foreground">
                                  Default goal progress calculation for recurring goals is based on calendar periods.
                                  For recurring monthly goals, goal progress is based on contributions made in a given
                                  calendar month (eg: May). For recurring yearly goals, goal progress is based on
                                  contributions made in the given year (eg: 2024).
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Continuous calculation is an alternative calculation algorithm that is based on time
                                  relative to the present moment. For recurring monthly goals, goal progress is based on
                                  contribution made during the last 30 days. For recurring yearly goals, goal progress
                                  is based on contributions made during the last 365 days.
                                </p>
                              </div>
                            </div>
                            <Switch
                              checked={field.value}
                              onCheckedChange={val => {
                                formik.setFieldValue('goal.continuous', val);
                              }}
                            />
                          </div>
                        );
                      }}
                    </FormField>
                  </CollapsibleContent>
                </Collapsible>
              </div>
              <Separator />
              <div className="w-full space-y-4 px-6 py-2">
                <span className="text-sm text-muted-foreground">
                  <span className="font-semibold">Goal progress preview</span> (based on existing contributions)
                </span>
                <GoalProgress accountSlug={account.slug} goal={formik.values.goal} />
              </div>
              <Separator />
              <div className="flex w-full items-center justify-between gap-4 px-6 pt-2 pb-6">
                <div className="flex items-center gap-2">
                  <Button type="submit" loading={formik.isSubmitting}>
                    <FormattedMessage defaultMessage="Save" id="save" />
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    <FormattedMessage defaultMessage="Cancel" id="actions.cancel" />
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="text-red-700"
                  onClick={async () => {
                    await onSubmit(schema.parse({ ...initialValues, goal: undefined }));

                    setIsEditing(false);
                  }}
                >
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

export const LongDescriptionForm = ({ initialValues, schema, onSubmit }) => {
  return (
    <FormikZod schema={schema} initialValues={initialValues} onSubmit={values => onSubmit(schema.parse(values))}>
      {(formik: FormikProps<z.infer<typeof schema>>) => (
        <Form>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-4">
              <div>
                <div className="text-lg font-medium">
                  <FormattedMessage defaultMessage="About" id="collective.about.title" />
                </div>
                <p className="text-sm text-muted-foreground">
                  <FormattedMessage defaultMessage="Tell your story and explain your purpose." id="SectionAbout.Why" />
                </p>
              </div>
              <Button type="submit" loading={formik.isSubmitting}>
                <FormattedMessage defaultMessage="Save" id="save" />
              </Button>
            </div>
            <FormField name="longDescription">
              {({ field }) => {
                return (
                  <RichTextEditor
                    kind="ACCOUNT_LONG_DESCRIPTION"
                    {...field}
                    withStickyToolbar
                    toolbarOffsetY={0}
                    toolbarTop={[0, -80]}
                    defaultValue={field.value}
                    onChange={e => formik.setFieldValue('longDescription', e.target.value)}
                    placeholder="Tell your story..."
                    toolbarBackgroundColor="#F7F8FA"
                    videoEmbedEnabled
                    withBorders
                  />
                );
              }}
            </FormField>
          </div>
        </Form>
      )}
    </FormikZod>
  );
};
