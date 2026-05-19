import React from 'react';
import { useMutation } from '@apollo/client';
import type { FormikHelpers } from 'formik';
import { useFormikContext } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { suggestSlug } from '@/lib/collective';
import { getCurrencyForCountry } from '@/lib/currency-utils';
import { formatErrorMessage, getErrorFromGraphqlException } from '@/lib/errors';
import {
  CountryIso,
  type CreateOrganizationFromExpenseFlowMutation,
  type CreateOrganizationFromExpenseFlowMutationVariables,
  Currency,
} from '@/lib/graphql/types/v2/graphql';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getCountryCodeFromLocalBrowserLanguage } from '@/lib/i18n/countries';

import { FormField } from '@/components/FormField';
import { FormikZod } from '@/components/FormikZod';
import InputCountry from '@/components/InputCountry';
import { Checkbox } from '@/components/ui/Checkbox';
import { InputGroup } from '@/components/ui/Input';
import { useToast } from '@/components/ui/useToast';

import { Button } from '../../ui/Button';
import { type ExpenseForm } from '../useExpenseForm';

import { createOrganizationFromExpenseFlowMutation } from './mutations';

type CreateLegalEntityPayeeFormProps = {
  isSubmitting: ExpenseForm['isSubmitting'];
  refresh: ExpenseForm['refresh'];
  setFieldValue: ExpenseForm['setFieldValue'];
  setFieldTouched: ExpenseForm['setFieldTouched'];
};

const getCreateLegalEntitySchema = (requiredMessage: string) =>
  z.object({
    countryISO: z.nativeEnum(CountryIso, { errorMap: () => ({ message: requiredMessage }) }),
    currency: z.nativeEnum(Currency, { errorMap: () => ({ message: requiredMessage }) }),
    name: z.string().trim().min(1, requiredMessage).max(255),
    legalName: z.string().trim().min(1, requiredMessage).max(255),
    slug: z.string().trim().min(5, requiredMessage).max(255),
    isAuthorizedRepresentative: z.boolean().refine(v => v === true, { message: requiredMessage }),
  });

type LegalEntityFormValues = z.infer<ReturnType<typeof getCreateLegalEntitySchema>>;

// `countryISO` and `currency` start unset; they are required by the schema but optional
// in the initial form state until the user (or the browser-locale effect) picks a country.
const initialFormValues = {
  name: '',
  legalName: '',
  slug: '',
  isAuthorizedRepresentative: false,
} as LegalEntityFormValues;

export function CreateLegalEntityPayeeForm(props: CreateLegalEntityPayeeFormProps) {
  const intl = useIntl();
  const { toast } = useToast();
  const { refetchLoggedInUser } = useLoggedInUser();
  const [createOrganization, { loading }] = useMutation<
    CreateOrganizationFromExpenseFlowMutation,
    CreateOrganizationFromExpenseFlowMutationVariables
  >(createOrganizationFromExpenseFlowMutation);

  const requiredMessage = intl.formatMessage({ defaultMessage: 'Required', id: 'Seanpx' });
  const schema = React.useMemo(() => getCreateLegalEntitySchema(requiredMessage), [requiredMessage]);

  const { refresh, setFieldValue, setFieldTouched } = props;
  const onSubmit = React.useCallback(
    async (values: LegalEntityFormValues, helpers: FormikHelpers<LegalEntityFormValues>) => {
      try {
        const result = await createOrganization({
          variables: {
            organization: {
              name: values.name,
              legalName: values.legalName,
              slug: values.slug,
              countryISO: values.countryISO,
              currency: values.currency,
            },
          },
        });
        const newOrganization = result.data?.createOrganization;
        if (newOrganization?.slug) {
          await refetchLoggedInUser();
          await refresh();
          setFieldValue('payeeSlug', newOrganization.slug);
          setFieldTouched('payeeSlug', true);
          toast({
            variant: 'success',
            message: intl.formatMessage({
              defaultMessage: 'Organization account created',
              id: '94zozl',
            }),
          });
        }
      } catch (error) {
        const gqlError = getErrorFromGraphqlException(error);
        if (gqlError?.payload?.code?.includes('SLUG')) {
          helpers.setFieldError('slug', formatErrorMessage(intl, gqlError));
        }
        toast({ variant: 'error', message: formatErrorMessage(intl, gqlError) });
      }
    },
    [createOrganization, intl, refetchLoggedInUser, refresh, setFieldValue, setFieldTouched, toast],
  );

  return (
    <FormikZod<LegalEntityFormValues> schema={schema} initialValues={initialFormValues} onSubmit={onSubmit}>
      <CreateLegalEntityFormFields isDisabled={props.isSubmitting || loading} mutationLoading={loading} />
    </FormikZod>
  );
}

function CreateLegalEntityFormFields(props: { isDisabled: boolean; mutationLoading: boolean }) {
  const intl = useIntl();
  const form = useFormikContext<LegalEntityFormValues>();
  const { isDisabled } = props;

  const { setFieldValue } = form;
  React.useEffect(() => {
    if (!form.values.countryISO) {
      const countryCode = getCountryCodeFromLocalBrowserLanguage();
      const countryISO = countryCode && CountryIso[countryCode];
      if (countryISO) {
        setFieldValue('countryISO', countryISO);
        setFieldValue('currency', getCurrencyForCountry(countryISO));
      }
    }
    // Only default the country once on mount; subsequent changes are driven by the user.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // We render a div (not <form>) because this component is mounted inside the parent
    // expense `<form>` element in `SubmitExpenseFlow`, and nested HTML forms break the
    // `beforeunload` warning set up by `useNavigationWarning`.
    <div className="flex flex-col gap-4">
      <FormField
        name="countryISO"
        disabled={isDisabled}
        label={<FormattedMessage defaultMessage="Country of Incorporation" id="createCollective.form.country" />}
      >
        {({ field }) => (
          <InputCountry
            disabled={isDisabled}
            value={field.value}
            onChange={value => {
              const countryISO = value as CountryIso;
              setFieldValue('countryISO', countryISO);
              setFieldValue('currency', getCurrencyForCountry(countryISO));
            }}
          />
        )}
      </FormField>

      <FormField
        name="legalName"
        disabled={isDisabled}
        hint={intl.formatMessage({
          defaultMessage: 'Official name as registered with legal authorities.',
          id: 'jQOxmT',
        })}
        label={intl.formatMessage({ defaultMessage: 'Legal name', id: 'OozR1Y' })}
        placeholder="e.g. Green Horizon Foundation, Inc."
      />

      <FormField
        name="name"
        disabled={isDisabled}
        hint={intl.formatMessage({
          defaultMessage: 'Displayed publicly. Can be different from legal name.',
          id: 'publicName.hint',
        })}
        label={intl.formatMessage({ defaultMessage: 'Public name', id: 'PublicName' })}
        placeholder="e.g. Green Horizon"
        onChange={e => {
          const value = e.target.value;
          setFieldValue('name', value);
          if (!form.touched.slug) {
            setFieldValue('slug', suggestSlug(value));
          }
        }}
      />

      <FormField
        name="slug"
        disabled={isDisabled}
        label={intl.formatMessage({ defaultMessage: 'createCollective.form.slugLabel', id: '9sukjk' })}
      >
        {({ field }) => <InputGroup className="w-full" prepend="opencollective.com/" {...field} />}
      </FormField>

      <FormField name="isAuthorizedRepresentative">
        {({ field }) => (
          <label className="flex cursor-pointer items-start gap-2 text-sm leading-normal">
            <Checkbox
              name={field.name}
              checked={Boolean(field.value)}
              disabled={isDisabled}
              onCheckedChange={checked => setFieldValue('isAuthorizedRepresentative', checked === true)}
            />
            <span>
              <FormattedMessage
                defaultMessage="I am legally registered as an administrator of {entityName} and can represent it on the platform."
                id="rlswHG"
                values={{
                  entityName:
                    form.values.legalName || intl.formatMessage({ defaultMessage: 'this entity', id: 'xYG/tI' }),
                }}
              />
            </span>
          </label>
        )}
      </FormField>

      <Button
        type="button"
        disabled={isDisabled || !form.isValid}
        loading={props.mutationLoading}
        onClick={() => form.submitForm()}
      >
        <FormattedMessage defaultMessage="Create Organization Account" id="jwJ8fG" />
      </Button>
    </div>
  );
}
