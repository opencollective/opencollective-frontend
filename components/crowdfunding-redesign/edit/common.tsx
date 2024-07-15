import React, { useContext } from 'react';
import { gql } from '@apollo/client';
import clsx from 'clsx';
import type { FormikProps } from 'formik';
import { Field, Form } from 'formik';
import { pickBy } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import type { z } from 'zod';

import { isOCError } from '../../../lib/errors';
import { formatFormErrorMessage, RICH_ERROR_MESSAGES } from '../../../lib/form-utils';

import { FormikZod, FormikZodContext, getInputAttributesFromZodSchema } from '../../FormikZod';
import RichTextEditor from '../../RichTextEditor';
import { Button } from '../../ui/Button';
import { Input, InputGroup } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/Popover';

export function FormField({
  label,
  showError = true,
  name,
  hint,
  placeholder,
  children,
  ...props
}: {
  label?: string;
  showError?: boolean;
  name: string;
  hint?: string;
  placeholder?: string;
  children?: (props: { form: FormikProps<any>; meta: any; field: any }) => JSX.Element;
  required?: boolean;
  min?: number;
  max?: number;
  inputType?: string;
  disabled?: boolean;
  htmlFor?: string;
}) {
  const intl = useIntl();
  const htmlFor = props.htmlFor || `input-${name}`;
  const { schema } = useContext(FormikZodContext);

  return (
    <Field name={name}>
      {({ field, form, meta }) => {
        const hasError = Boolean(meta.error && (meta.touched || form.submitCount));
        const fieldAttributes = {
          ...(schema ? getInputAttributesFromZodSchema(schema, name) : null),
          ...pickBy(
            {
              ...field,
              name: name || htmlFor,
              id: htmlFor,
              type: props.inputType,
              disabled: props.disabled,
              min: props.min,
              max: props.max,
              required: props.required,
              error: hasError,
              placeholder,
            },
            value => value !== undefined,
          ),
        };
        if (
          'required' in fieldAttributes &&
          !fieldAttributes.required &&
          meta.error &&
          meta.error === intl.formatMessage(RICH_ERROR_MESSAGES.requiredValue)
        ) {
          fieldAttributes.required = true;
        }
        return (
          <div className="flex w-full flex-col gap-1">
            {label && <Label className="text-base leading-normal">{label}</Label>}
            {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
            {children ? children({ form, meta, field: fieldAttributes }) : <Input {...fieldAttributes} />}
            {hasError && showError && (
              <p className="text-xs text-red-500">
                {isOCError(meta.error) ? formatFormErrorMessage(intl, meta.error) : meta.error}
              </p>
            )}
          </div>
        );
      }}
    </Field>
  );
}

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
        <PopoverTrigger>
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
                  '[&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none',
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
