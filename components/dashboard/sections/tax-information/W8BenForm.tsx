import React from 'react';
import { FormikProps } from 'formik';
import { merge } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { splitName } from '../../../../lib/collective';
import { LoggedInUser } from '../../../../lib/custom_typings/LoggedInUser';
import dayjs from '../../../../lib/dayjs';
import { CountryIso } from '../../../../lib/graphql/types/v2/graphql';
import { i18nCountryName } from '../../../../lib/i18n';
import { cn } from '../../../../lib/utils';

import { generateInitialValuesFromSchema } from '../../../FormikZod';
import InputTypeCountry from '../../../InputTypeCountry';
import StyledInput from '../../../StyledInput';
import StyledInputFormikField from '../../../StyledInputFormikField';
import StyledInputLocation from '../../../StyledInputLocation';
import StyledInputPercentage from '../../../StyledInputPercentage';
import { ButtonSet } from '../../../ui/ButtonSet';
import { Checkbox } from '../../../ui/Checkbox';

import { BaseFormSchema, TaxFormLocationFields, TaxFormNameFields } from './common';
import { HintText } from './HintText';
import { AccountFromTaxInformationQuery } from './queries';

export const W8BenTaxFormValuesSchema = BaseFormSchema.merge(
  z.object({
    beneficialOwner: TaxFormNameFields,
    taxpayerIdentificationNumberTypeUS: z.enum(['SSN', 'ITIN']).nullable(),
    taxpayerIdentificationNumberUS: z.string().optional(),
    taxpayerIdentificationNumberForeign: z.string().max(255),
    dateOfBirth: z.string().length(10),
    countryOfCitizenship: z.string(),
    residenceAddress: TaxFormLocationFields,
    mailingAddress: TaxFormLocationFields.optional(),
    hasConfirmedTOS: z.literal<boolean>(true),
    claimsSpecialRatesAndConditions: z.boolean(),
    isSignerTheBeneficialOwner: z.boolean(),
    // Conditional fields (see discriminators below)
    certifiesResidentCountry: z.boolean().nullable().optional(),
    hasTaxTreatySpecialRatesAndConditions: z.boolean().nullable().optional(),
    claimsArticleAndParagraph: z.string().nullable().optional(),
    claimsRate: z.number().min(0).max(100).nullable().optional(),
    claimsIncomeType: z.string().nullable().optional(),
    claimsExplanation: z.string().nullable().optional(),
    signerCapacity: z.string().nullable().optional(),
  }),
)
  .and(
    z
      .discriminatedUnion('claimsSpecialRatesAndConditions', [
        z.object({ claimsSpecialRatesAndConditions: z.literal(false) }),
        z.object({
          claimsSpecialRatesAndConditions: z.literal(true),
          hasTaxTreatySpecialRatesAndConditions: z.boolean(),
          certifiesResidentCountry: z.literal<boolean>(true),
        }),
      ])
      .and(
        z.discriminatedUnion('hasTaxTreatySpecialRatesAndConditions', [
          z.object({ hasTaxTreatySpecialRatesAndConditions: z.literal(false) }),
          z.object({
            hasTaxTreatySpecialRatesAndConditions: z.literal(true),
            claimsArticleAndParagraph: z.string(),
            claimsRate: z.number().min(0).max(100),
            claimsIncomeType: z.string(),
            claimsExplanation: z.string(),
          }),
        ]),
      ),
  )
  .and(
    z.discriminatedUnion('isSignerTheBeneficialOwner', [
      z.object({ isSignerTheBeneficialOwner: z.literal(true) }),
      z.object({
        isSignerTheBeneficialOwner: z.literal(false),
        signerCapacity: z.string(),
      }),
    ]),
  );

type W8BenTaxFormValues = z.infer<typeof W8BenTaxFormValuesSchema>;

export const getInitialValuesForW8Ben = (
  schema,
  user: LoggedInUser,
  account: AccountFromTaxInformationQuery,
): W8BenTaxFormValues => {
  const nameParts = splitName(account.legalName || account.name);
  return merge(generateInitialValuesFromSchema(schema), {
    signer: nameParts,
    beneficialOwner: nameParts,
    residenceAddress: account.location,
  });
};

export const W8BenTaxFormFields = ({ formik }: { formik: FormikProps<W8BenTaxFormValues> }) => {
  const intl = useIntl();
  const { values, setFieldValue } = formik;
  return (
    <div className="flex flex-col gap-y-4">
      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Full name of the beneficial owner" id="5Ti6KA" />
        </p>
        <HintText>
          <FormattedMessage
            defaultMessage="The beneficial owner is the person ultimately paid, not an intermediary."
            id="vkl1Ej"
          />
        </HintText>
      </div>
      <StyledInputFormikField
        name="beneficialOwner.firstName"
        label={intl.formatMessage({ defaultMessage: 'First Name', id: 'Q6wcZ5' })}
      />
      <StyledInputFormikField
        name="beneficialOwner.middleName"
        label={intl.formatMessage({ defaultMessage: 'Middle Name', id: '9BrST0' })}
      />
      <StyledInputFormikField
        name="beneficialOwner.lastName"
        label={intl.formatMessage({ defaultMessage: 'Last Name', id: 'aheQdn' })}
      />
      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage id="collective.address.label" defaultMessage="Address" />
        </p>
      </div>
      <StyledInputFormikField
        name="countryOfCitizenship"
        label={<FormattedMessage defaultMessage="Country of citizenship" id="DufF8V" />}
      >
        {({ field }) => (
          <InputTypeCountry
            inputId={field.id}
            name={field.name}
            onChange={value => setFieldValue(field.name, value as CountryIso)}
            value={field.value}
            error={field.error}
            required={field.required}
          />
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        name="residenceAddress"
        label={<FormattedMessage defaultMessage="Permanent residence address" id="kPE2n3" />}
        showError={false}
      >
        {({ field, meta }) => (
          <StyledInputLocation
            name={field.name}
            location={field.value}
            onChange={value => setFieldValue(field.name, value)}
            labelFontWeight="normal"
            errors={meta.error}
            noFallback={true}
            required={field.required}
          />
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        name="mailingAddress"
        label={<FormattedMessage defaultMessage="Mailing address (if different from above)" id="9UGIQz" />}
        showError={false}
      >
        {({ field, meta }) => (
          <StyledInputLocation
            name={field.name}
            location={field.value}
            onChange={value => setFieldValue(field.name, value)}
            labelFontWeight="normal"
            errors={meta.error}
            noFallback={true}
            required={field.required}
          />
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        inputType="date"
        name="dateOfBirth"
        label={<FormattedMessage defaultMessage="Date of birth" id="GFTdXw" />}
        max={dayjs().format('YYYY-MM-DD')}
      />
      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Taxpayer Identification Number (TIN)" id="UKedhg" />
        </p>
      </div>

      <StyledInputFormikField
        name="taxpayerIdentificationNumberForeign"
        label={<FormattedMessage defaultMessage="Non-U.S. tax ID number" id="edVE6y" />}
        placeholder={intl.formatMessage({ defaultMessage: 'The one you use in your country', id: 'hP6sfR' })}
      />
      <StyledInputFormikField
        name="taxpayerIdentificationNumberTypeUS"
        label={<FormattedMessage defaultMessage="US Tax ID number type" id="bX2VYs" />}
      >
        {({ field }) => (
          <ButtonSet
            selected={field.value}
            error={field.error}
            onChange={value => {
              setFieldValue(field.name, value);
              setFieldValue('taxpayerIdentificationNumberUS', '');
            }}
            options={[
              { label: 'SSN', value: 'SSN' },
              { label: 'EIN', value: 'EIN' },
            ]}
          />
        )}
      </StyledInputFormikField>
      {values.taxpayerIdentificationNumberTypeUS && (
        <StyledInputFormikField
          name="taxpayerIdentificationNumberUS"
          label={
            <FormattedMessage
              defaultMessage="{tax} ID number"
              id="eZpz5v"
              values={{ tax: values.taxpayerIdentificationNumberTypeUS }}
            />
          }
        >
          {({ field }) => (
            <StyledInput
              placeholder={values.taxpayerIdentificationNumberTypeUS === 'SSN' ? '123-45-6789' : '12-3456789'}
              disabled={!values.taxpayerIdentificationNumberTypeUS}
              {...field}
              maxLength={values.taxpayerIdentificationNumberTypeUS === 'SSN' ? 11 : 10}
              pattern={
                values.taxpayerIdentificationNumberTypeUS === 'SSN' ? '[0-9]{3}-[0-9]{2}-[0-9]{4}' : '[0-9]{2}-[0-9]{7}'
              }
              onChange={e => {
                const { value } = e.target;
                if (values.taxpayerIdentificationNumberTypeUS === 'SSN') {
                  const formattedValue = value.replace(/[^0-9]/g, '').replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3');
                  setFieldValue(field.name, formattedValue);
                } else {
                  const formattedValue = value.replace(/[^0-9]/g, '').replace(/(\d{2})(\d{7})/, '$1-$2');
                  setFieldValue(field.name, formattedValue);
                }
              }}
            />
          )}
        </StyledInputFormikField>
      )}
      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Tax treaty benefits" id="ezCCHB" />
        </p>
      </div>
      <StyledInputFormikField
        name="claimsSpecialRatesAndConditions"
        label={
          <FormattedMessage defaultMessage="Do you claim tax treaty benefits for chapter 3 purposes?" id="c0Nerg" />
        }
      >
        {({ field }) => (
          <ButtonSet
            selected={values.claimsSpecialRatesAndConditions}
            error={field.error}
            onChange={value => {
              setFieldValue(field.name, value);
              if (!value) {
                setFieldValue('hasTaxTreatySpecialRatesAndConditions', null);
              }
            }}
            options={[
              { label: <FormattedMessage defaultMessage="Yes" id="a5msuh" />, value: true },
              { label: <FormattedMessage defaultMessage="No" id="oUWADl" />, value: false },
            ]}
          />
        )}
      </StyledInputFormikField>
      {Boolean(values.claimsSpecialRatesAndConditions) && (
        <React.Fragment>
          <StyledInputFormikField name="certifiesResidentCountry">
            {({ field }) => (
              <label className="cursor-pointer text-sm font-normal leading-normal">
                <Checkbox
                  className={cn('mr-2', { 'border-red-500': field.error })}
                  name={field.name}
                  checked={field.value}
                  onCheckedChange={checked => formik.setFieldValue(field.name, checked === true)}
                  disabled={!values.countryOfCitizenship}
                />
                <div className="inline align-text-bottom">
                  <FormattedMessage
                    defaultMessage="Within the meaning of the income tax treaty between the United States and this country, I certify that the beneficial owner is a resident of the country defined above"
                    id="6F8a3v"
                  />
                  <span className="italic">
                    {' ('}
                    {values.countryOfCitizenship
                      ? i18nCountryName(intl, values.countryOfCitizenship)
                      : intl.formatMessage({ defaultMessage: 'please select one', id: 'FVfO+d' })}
                    {').'}
                  </span>
                </div>
              </label>
            )}
          </StyledInputFormikField>
          <StyledInputFormikField
            name="hasTaxTreatySpecialRatesAndConditions"
            label={
              <FormattedMessage
                defaultMessage="For tax treaty benefits (chapter 3), do special rates and conditions apply?"
                id="1rVRaB"
              />
            }
          >
            {({ field }) => (
              <ButtonSet
                selected={values.hasTaxTreatySpecialRatesAndConditions}
                error={field.error}
                onChange={value => setFieldValue(field.name, value)}
                options={[
                  { label: <FormattedMessage defaultMessage="Yes" id="a5msuh" />, value: true },
                  { label: <FormattedMessage defaultMessage="No" id="oUWADl" />, value: false },
                ]}
              />
            )}
          </StyledInputFormikField>
          {values.hasTaxTreatySpecialRatesAndConditions && (
            <React.Fragment>
              <StyledInputFormikField
                name="claimsArticleAndParagraph"
                label={<FormattedMessage defaultMessage="Article and paragraph" id="g5m2pl" />}
              />
              <StyledInputFormikField
                inputType="number"
                name="claimsRate"
                label={<FormattedMessage defaultMessage="Rate" id="c0b5XV" />}
              >
                {({ field }) => (
                  <StyledInputPercentage
                    {...field}
                    clamp={false}
                    onChange={value => setFieldValue(field.name, value)}
                  />
                )}
              </StyledInputFormikField>
              <StyledInputFormikField
                name="claimsIncomeType"
                label={<FormattedMessage defaultMessage="Type of income" id="1T23UJ" />}
              />
              <StyledInputFormikField
                name="claimsExplanation"
                label={<FormattedMessage defaultMessage="Explanation" id="E1bF/X" />}
              />
            </React.Fragment>
          )}
        </React.Fragment>
      )}

      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Signature" id="nQkv1D" />
        </p>
      </div>
      <StyledInputFormikField
        name="isSignerTheBeneficialOwner"
        label={<FormattedMessage defaultMessage="Is signer the beneficial owner?" id="C0z1ZX" />}
      >
        {({ field }) => (
          <ButtonSet
            selected={values.isSignerTheBeneficialOwner}
            error={field.error}
            onChange={value => setFieldValue(field.name, value)}
            options={[
              { label: <FormattedMessage defaultMessage="Yes" id="a5msuh" />, value: true },
              { label: <FormattedMessage defaultMessage="No" id="oUWADl" />, value: false },
            ]}
          />
        )}
      </StyledInputFormikField>
      {values.isSignerTheBeneficialOwner === false && (
        <React.Fragment>
          <StyledInputFormikField
            name="signerCapacity"
            label={
              <FormattedMessage
                defaultMessage="If the signer is not the beneficial owner, in what capacity are they acting?"
                id="LCINly"
              />
            }
          />
          <StyledInputFormikField
            name="signer.firstName"
            label={intl.formatMessage({ defaultMessage: 'First Name', id: 'Q6wcZ5' })}
          />
          <StyledInputFormikField
            name="signer.middleName"
            label={intl.formatMessage({ defaultMessage: 'Middle Name', id: '9BrST0' })}
          />
          <StyledInputFormikField
            name="signer.lastName"
            label={intl.formatMessage({ defaultMessage: 'Last Name', id: 'aheQdn' })}
          />
        </React.Fragment>
      )}

      <StyledInputFormikField name="hasConfirmedTOS">
        {({ field }) => (
          <label className="cursor-pointer text-sm font-normal leading-normal">
            <Checkbox
              className={cn('mr-2', { 'border-red-500': field.error })}
              name={field.name}
              checked={field.value}
              onCheckedChange={checked => formik.setFieldValue(field.name, checked === true)}
            />
            <div className="inline align-text-bottom">
              <FormattedMessage
                defaultMessage="Under penalties of perjury, I declare that I have examined the information on this form and to the best of my knowledge and belief it is true, correct, and complete. I further certify under penalties of perjury that: I am the individual that is the beneficial owner (or am authorized to sign for the individual that is the beneficial owner) of all the income to which this form relates or am using this form to document myself for chapter 4 purposes; The person named on this form is not a U.S. person; The income to which this form relates is: (a) not effectively connected with the conduct of a trade or business in the United States, (b) effectively connected but is not subject to tax under an applicable income tax treaty, or (c) the partner’s share of a partnership's effectively connected income; The person named on this form is a resident of the treaty country listed (if any) within the meaning of the income tax treaty between the United States and that country; and for broker transactions or barter exchanges, the beneficial owner is an exempt foreign person as defined in the instructions. Furthermore, I authorize this form to be provided to any withholding agent that has control, receipt, or custody of the income of which I am the beneficial owner or any withholding agent that can disburse or make payments of the income of which I am the beneficial owner. I agree that I will submit a new form within 30 days if any certification made on this form becomes incorrect."
                id="TpH5rD"
              />
            </div>
          </label>
        )}
      </StyledInputFormikField>
    </div>
  );
};
