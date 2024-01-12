import React from 'react';
import { FormikProps } from 'formik';
import { merge } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import { z } from 'zod';

import { splitName } from '../../../../lib/collective';
import { LoggedInUser } from '../../../../lib/custom_typings/LoggedInUser';
import { CountryIso } from '../../../../lib/graphql/types/v2/graphql';
import { cn } from '../../../../lib/utils';

import { generateInitialValuesFromSchema } from '../../../FormikZod';
import I18nFormatters from '../../../I18nFormatters';
import InputTypeCountry from '../../../InputTypeCountry';
import StyledInputFormikField from '../../../StyledInputFormikField';
import StyledInputLocation from '../../../StyledInputLocation';
import StyledInputPercentage from '../../../StyledInputPercentage';
import { ButtonSet } from '../../../ui/ButtonSet';
import { Checkbox } from '../../../ui/Checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';

import {
  BaseFormSchema,
  Chapter3Status,
  NFFEStatus,
  TaxFormLocationFields,
  TypeOfLimitationOnBenefitsProvisions,
} from './common';
import { I18nChapter3Status, I18nNFFEStatus, I18nTypeOfLimitationOnBenefitsProvisions } from './i18n';
import { AccountFromTaxInformationQuery } from './queries';

const Chapter3StatusThatCanBeHybrid = [
  Chapter3Status.DisregardedEntity,
  Chapter3Status.Partnership,
  Chapter3Status.SimpleTrust,
  Chapter3Status.GrantorTrust,
] as const;

export const W8BenETaxFormValuesSchema = BaseFormSchema.merge(
  z.object({
    businessName: z.string().min(1).max(255),
    businessCountryOfIncorporationOrOrganization: z.string(),
    businessAddress: TaxFormLocationFields,
    businessMailingAddress: TaxFormLocationFields.optional(),
    disregardedBusinessName: z.string().min(0).max(255).optional(),
    chapter3Status: z.nativeEnum(Chapter3Status),
    hasCapacityToSign: z.literal<boolean>(true),
    certifyStatus: z.literal<boolean>(true),
    taxpayerIdentificationNumberForeign: z.string(),
    taxpayerIdentificationNumberUS: z.string().max(11).optional(),
    giin: z.string().optional(),
    reference: z.string().optional(),
    hasConfirmedTOS: z.literal<boolean>(true),
    isHybridEntity: z.boolean().nullable(),
    claimsSpecialRatesAndConditions: z.boolean().nullable(),
  }),
)
  .and(
    z.discriminatedUnion('nffeStatus', [
      z.object({ nffeStatus: z.literal(NFFEStatus.ActiveNFFE) }),
      z.object({ nffeStatus: z.literal(NFFEStatus.NonProfitOrganization) }),
      z.object({
        nffeStatus: z.literal(NFFEStatus.PassiveNFFE),
        entityHasNoUSOwners: z.boolean().optional(),
        usOwners: z
          .array(
            z.object({
              name: z.string().min(1).max(255),
              address: TaxFormLocationFields,
              tin: z.string().max(11),
            }),
          )
          .optional(),
      }),
    ]),
  )
  .and(
    z.discriminatedUnion('isHybridEntity', [
      z.object({ isHybridEntity: z.literal<boolean>(false) }),
      z.object({
        isHybridEntity: z.literal<boolean>(true),
        certifyBeneficialOwnerCountry: z.boolean().nullable(),
        certifyDerivesIncome: z.boolean().nullable(),
        certifyForeignCorporation: z.boolean().nullable(),
        typeOfLimitationOnBenefitsProvisions: z.nativeEnum(TypeOfLimitationOnBenefitsProvisions),
        typeOfLimitationOnBenefitsProvisionsOther: z.string(),
      }),
    ]),
  )
  .and(
    z.discriminatedUnion('claimsSpecialRatesAndConditions', [
      z.object({ claimsSpecialRatesAndConditions: z.literal<boolean>(null) }),
      z.object({ claimsSpecialRatesAndConditions: z.literal<boolean>(false) }),
      z.object({
        claimsSpecialRatesAndConditions: z.literal<boolean>(true),
        claimsArticleAndParagraph: z.string(),
        claimsRate: z.number().min(0).max(100),
        claimsIncomeType: z.string(),
        claimsExplanation: z.string(),
      }),
    ]),
  );

type W8BenETaxFormValues = z.infer<typeof W8BenETaxFormValuesSchema>;

export const getInitialValuesForW8BenE = (
  schema,
  user: LoggedInUser,
  account: AccountFromTaxInformationQuery,
): W8BenETaxFormValues => {
  const nameParts = splitName(user.collective.legalName || user.collective.name);
  return merge(generateInitialValuesFromSchema(schema), {
    signer: nameParts,
    businessName: account.legalName || account.name,
    businessCountryOfIncorporationOrOrganization: account.location?.country,
    businessAddress: account.location,
  });
};

export const W8BenETaxFormFields = ({ formik }: { formik: FormikProps<W8BenETaxFormValues> }) => {
  const intl = useIntl();
  const { values, setFieldValue } = formik;
  return (
    <div className="flex flex-col gap-y-4">
      <div>
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Signer Full name" />
        </p>
      </div>
      <StyledInputFormikField name="signer.firstName" label={intl.formatMessage({ defaultMessage: 'First Name' })} />
      <StyledInputFormikField name="signer.middleName" label={intl.formatMessage({ defaultMessage: 'Middle Name' })} />
      <StyledInputFormikField name="signer.lastName" label={intl.formatMessage({ defaultMessage: 'Last Name' })} />
      <div>
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Organization that is the beneficial owner" />
        </p>
      </div>
      <StyledInputFormikField
        name="businessName"
        label={<FormattedMessage defaultMessage="Name of organization that is the beneficial owner" />}
      />
      <StyledInputFormikField
        name="disregardedBusinessName"
        label={<FormattedMessage defaultMessage="Name of disregarded entity" />}
        hint={
          <FormattedMessage defaultMessage="If you: have registered with the IRS and been assigned a GIIN associated with the legal name of the disregarded entity; or are reporting Model 2 FFI; and are not an hybrid entity using this form to claim treaty benefits" />
        }
      />
      <StyledInputFormikField
        name="nffeStatus"
        label={<FormattedMessage defaultMessage="Non-financial foreign entity (NFFE) status" />}
        hint={
          <FormattedMessage
            defaultMessage="This form may only be completed online if you are a non-financial foreign entity (NFFE) with a FATCA classification listed below. If your entity is a financial institution, government, in liquidation, publicly traded, or any classification not listed here, do not fill out this form and <SupportLink>contact us</SupportLink>."
            values={I18nFormatters}
          />
        }
      >
        {({ field }) => (
          <Select name={field.name} value={values.nffeStatus} onValueChange={value => setFieldValue(field.name, value)}>
            <SelectTrigger id={field.name} className={cn('truncate', { 'border-red-500': field.error })}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(NFFEStatus).map(nffeStatus => (
                <SelectItem key={nffeStatus} value={nffeStatus}>
                  {intl.formatMessage(I18nNFFEStatus[nffeStatus])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </StyledInputFormikField>
      {values.nffeStatus === NFFEStatus.PassiveNFFE && (
        <React.Fragment>
          <StyledInputFormikField
            name="entityHasNoUSOwners"
            label={
              <FormattedMessage defaultMessage="I further certify that the entity identified has no substantial U.S. owners (or, if applicable, no controlling U.S. persons)" />
            }
          >
            {({ field }) => (
              <ButtonSet
                selected={values.entityHasNoUSOwners}
                onChange={value => setFieldValue(field.name, value)}
                error={field.error}
                options={[
                  { label: <FormattedMessage defaultMessage="Yes" />, value: true },
                  { label: <FormattedMessage defaultMessage="No" />, value: false },
                ]}
              />
            )}
          </StyledInputFormikField>
          {values.entityHasNoUSOwners === false && (
            <StyledInputFormikField
              name="usOwners"
              label={
                <FormattedMessage defaultMessage="Provide the name, address, and TIN of each substantial U.S. owner (or, if applicable, controlling U.S. person) of the NFFE" />
              }
            />
          )}
        </React.Fragment>
      )}

      <StyledInputFormikField
        name="chapter3Status"
        label={<FormattedMessage defaultMessage="Chapter 3 status (entity type)" />}
      >
        {({ field }) => (
          <Select
            name={field.name}
            value={values.chapter3Status}
            onValueChange={(value: Chapter3Status) => {
              setFieldValue(field.name, value);
              if (!(Chapter3StatusThatCanBeHybrid as readonly string[]).includes(value)) {
                setFieldValue('isHybridEntity', false);
                setFieldValue('claimsSpecialRatesAndConditions', false);
              }
            }}
          >
            <SelectTrigger id={field.name} className={cn('truncate', { 'border-red-500': field.error })}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(Chapter3Status).map(chapter3Status => (
                <SelectItem key={chapter3Status} value={chapter3Status}>
                  {intl.formatMessage(I18nChapter3Status[chapter3Status])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </StyledInputFormikField>

      {(Chapter3StatusThatCanBeHybrid as readonly string[]).includes(values.chapter3Status) && (
        <React.Fragment>
          <StyledInputFormikField
            name="isHybridEntity"
            label={<FormattedMessage defaultMessage="Is this a hybrid entity making a treaty claim?" />}
          >
            {({ field }) => (
              <ButtonSet
                selected={values.isHybridEntity}
                onChange={value => setFieldValue(field.name, value)}
                error={field.error}
                options={[
                  { label: <FormattedMessage defaultMessage="Yes" />, value: true },
                  { label: <FormattedMessage defaultMessage="No" />, value: false },
                ]}
              />
            )}
          </StyledInputFormikField>
          {values.isHybridEntity === true && (
            <React.Fragment>
              <p className="mb-2 text-sm font-bold text-neutral-800">
                <FormattedMessage defaultMessage="I certify that (select all that apply):" />
              </p>
              <StyledInputFormikField name="certifyBeneficialOwnerCountry">
                {({ field }) => (
                  <label className="cursor-pointer text-sm font-normal leading-normal">
                    <Checkbox
                      className={cn('mr-2', { 'border-red-500': field.error })}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={checked => formik.setFieldValue(field.name, checked === true)}
                    />
                    <div className="inline align-text-bottom">
                      <FormattedMessage defaultMessage="The beneficial owner is a resident of the country listed in the residence address on this form, within the meaning of the income tax treaty between the United States and that country" />
                    </div>
                  </label>
                )}
              </StyledInputFormikField>
              <StyledInputFormikField name="certifyDerivesIncome">
                {({ field }) => (
                  <label className="cursor-pointer text-sm font-normal leading-normal">
                    <Checkbox
                      className={cn('mr-2', { 'border-red-500': field.error })}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={checked => formik.setFieldValue(field.name, checked === true)}
                    />
                    <div className="inline align-text-bottom">
                      <FormattedMessage defaultMessage="The beneficial owner derives the item (or items) of income for which the treaty benefits are claimed, and, if applicable, meets the requirements of the treaty provision dealing with limitation on benefits." />
                    </div>
                  </label>
                )}
              </StyledInputFormikField>
              <StyledInputFormikField name="certifyForeignCorporation">
                {({ field }) => (
                  <label className="cursor-pointer text-sm font-normal leading-normal">
                    <Checkbox
                      className={cn('mr-2', { 'border-red-500': field.error })}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={checked => formik.setFieldValue(field.name, checked === true)}
                    />
                    <div className="inline align-text-bottom">
                      <FormattedMessage defaultMessage="The beneficial owner is claiming treaty benefits for U.S. source dividends received from a foreign corporation or interest from a U.S. trade or business of a foreign corporation and meets qualified resident status." />
                    </div>
                  </label>
                )}
              </StyledInputFormikField>
              {values['certifyDerivesIncome'] && (
                <StyledInputFormikField
                  name="typeOfLimitationOnBenefitsProvisions"
                  label={<FormattedMessage defaultMessage="Type of limitation on benefits provisions" />}
                >
                  {({ field }) => (
                    <Select
                      name={field.name}
                      value={field.value}
                      onValueChange={(value: TypeOfLimitationOnBenefitsProvisions) => setFieldValue(field.name, value)}
                    >
                      <SelectTrigger
                        id={field.name}
                        className={cn('truncate', {
                          'border-red-500': field.error,
                        })}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TypeOfLimitationOnBenefitsProvisions).map(chapter3Status => (
                          <SelectItem key={chapter3Status} value={chapter3Status}>
                            {intl.formatMessage(I18nTypeOfLimitationOnBenefitsProvisions[chapter3Status])}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </StyledInputFormikField>
              )}
              {values['typeOfLimitationOnBenefitsProvisions'] === TypeOfLimitationOnBenefitsProvisions.Other && (
                <StyledInputFormikField
                  name="typeOfLimitationOnBenefitsProvisionsOther"
                  label={
                    <FormattedMessage defaultMessage="Specify article and paragraph of 'other' type of limitation on benefits provisions" />
                  }
                />
              )}
              <StyledInputFormikField
                name="claimsSpecialRatesAndConditions"
                label={<FormattedMessage defaultMessage="Are you claiming special rates and conditions?" />}
              >
                {({ field }) => (
                  <ButtonSet
                    selected={values.claimsSpecialRatesAndConditions}
                    onChange={value => setFieldValue(field.name, value)}
                    error={field.error}
                    options={[
                      { label: <FormattedMessage defaultMessage="Yes" />, value: true },
                      { label: <FormattedMessage defaultMessage="No" />, value: false },
                    ]}
                  />
                )}
              </StyledInputFormikField>
              {values.claimsSpecialRatesAndConditions === true && (
                <React.Fragment>
                  <StyledInputFormikField
                    name="claimsArticleAndParagraph"
                    label={<FormattedMessage defaultMessage="Article and paragraph" />}
                  />
                  <StyledInputFormikField
                    inputType="number"
                    name="claimsRate"
                    label={<FormattedMessage defaultMessage="Rate" />}
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
                    label={<FormattedMessage defaultMessage="Type of income" />}
                  />
                  <StyledInputFormikField
                    name="claimsExplanation"
                    label={<FormattedMessage defaultMessage="Explanation" />}
                  />
                </React.Fragment>
              )}
            </React.Fragment>
          )}
        </React.Fragment>
      )}

      <StyledInputFormikField
        name="businessCountryOfIncorporationOrOrganization"
        label={<FormattedMessage defaultMessage="Country of incorporation or organization" />}
      >
        {({ field }) => (
          <InputTypeCountry
            inputId={field.id}
            name={field.name}
            onChange={value => setFieldValue(field.name, value as CountryIso)}
            value={field.value}
          />
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        name="businessAddress"
        label={<FormattedMessage defaultMessage="Company residence address" />}
        showError={false}
      >
        {({ field, meta, form }) => (
          <StyledInputLocation
            name={field.name}
            location={field.value}
            onChange={value => setFieldValue(field.name, value)}
            labelFontWeight="normal"
            errors={meta.touched || form.submitCount ? meta.error : null}
            noFallback={true}
            required={field.required}
          />
        )}
      </StyledInputFormikField>
      <StyledInputFormikField
        name="businessMailingAddress"
        label={<FormattedMessage defaultMessage="Mailing address (if different from above)" />}
        showError={false}
      >
        {({ field, meta, form }) => (
          <StyledInputLocation
            name={field.name}
            location={field.value}
            onChange={value => setFieldValue(field.name, value)}
            labelFontWeight="normal"
            errors={meta.touched || form.submitCount ? meta.error : null}
            noFallback={true}
            required={field.required}
          />
        )}
      </StyledInputFormikField>

      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Taxpayer Identification Number (TIN)" />
        </p>
      </div>

      <StyledInputFormikField
        name="taxpayerIdentificationNumberForeign"
        label={<FormattedMessage defaultMessage="Foreign Taxpayer ID Number" />}
        placeholder={intl.formatMessage({ defaultMessage: 'The one you use in your country' })}
      />
      <StyledInputFormikField
        name="taxpayerIdentificationNumberUS"
        label={<FormattedMessage defaultMessage="U.S. taxpayer identification number (TIN), if required" />}
      />
      <StyledInputFormikField name="giin" label={<FormattedMessage defaultMessage="GIIN" />} />
      <StyledInputFormikField name="reference" label={<FormattedMessage defaultMessage="Reference" />} />

      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Tax treaty benefits" />
        </p>
      </div>

      <div className="mt-2">
        <p className="text-lg font-bold">
          <FormattedMessage defaultMessage="Signature" />
        </p>
      </div>

      <StyledInputFormikField name="hasCapacityToSign">
        {({ field }) => (
          <label className="cursor-pointer text-sm font-normal leading-normal">
            <Checkbox
              className={cn('mr-2', { 'border-red-500': field.error })}
              name={field.name}
              checked={field.value}
              onCheckedChange={checked => formik.setFieldValue(field.name, checked === true)}
            />
            <div className="inline align-text-bottom">
              <FormattedMessage defaultMessage="I certify that I have the capacity to sign for the entity identified on this form." />
            </div>
          </label>
        )}
      </StyledInputFormikField>

      <StyledInputFormikField name="certifyStatus">
        {({ field }) => (
          <label className="cursor-pointer text-sm font-normal leading-normal">
            <Checkbox
              className={cn('mr-2', { 'border-red-500': field.error })}
              name={field.name}
              checked={field.value}
              onCheckedChange={checked => formik.setFieldValue(field.name, checked === true)}
            />
            <div className="inline align-text-bottom">
              {values.nffeStatus === NFFEStatus.ActiveNFFE ? (
                <FormattedMessage defaultMessage="[A-NFFE] I certify that the entity is a foreign (non-US) entity that is not a financial institution, that less than 50% of its gross income for the preceding calendar year is passive, and that less than 50% of assets produce passive income" />
              ) : values.nffeStatus === NFFEStatus.PassiveNFFE ? (
                <FormattedMessage defaultMessage="[P-NFFE] I certify that the entity is a foreign entity that is not a financial institution (other than an investment entity organized in a possession of the United States) and is not certifying its status as a publicly traded NFFE (or affiliate), excepted territory NFFE, active NFFE, direct reporting NFFE, or sponsored direct reporting NFFE." />
              ) : (
                <FormattedMessage defaultMessage="I certify that the entity is a nonprofit organization the meets the following requirements: The entity is established and maintained in its country of residence exclusively for religious, charitable, scientific, artistic, cultural or educational purposes; exempt from income tax in its country of residence; and has no shareholders or members who have a proprietary or beneficial interest in its income or assets. Neither the applicable laws of the entity's country of residence nor the entity's formation documents permit any income or assets of the entity to be distributed to, or applied for the benefit of, a private person or noncharitable entity other than pursuant to the conduct of the entity's charitable activities or as payment of reasonable compensation for services rendered or payment representing the fair market value of property which the entity has purchased; and upon the entity's liquidation or dissolution, all of its assets must be distributed to an entity that is a foreign government, an integral part of a foreign government, a controlled entity of a foreign government, or another organization that is described in this part or escheats to the government of the entity's country of residence or any political subdivision thereof." />
              )}
            </div>
          </label>
        )}
      </StyledInputFormikField>

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
              <FormattedMessage defaultMessage="Under penalties of perjury, I declare that I have examined the information on this form and to the best of my knowledge and belief it is true, correct, and complete. I further certify under penalties of perjury that: The entity identified on this form is the beneficial owner of all the income to which this form relates, is using this form to certify its status for chapter 4 purposes, or is a merchant submitting this form for purposes of section 6050W; The entity identified on this form is not a U.S. person; The income to which this form relates is: (a) not effectively connected with the conduct of a trade or business in the United States, (b) effectively connected but is not subject to tax under an income tax treaty, or (c) the partner's share of a partnership's effectively connected income; and for broker transactions or barter exchanges, the beneficial owner is an exempt foreign person as defined in the instructions. Furthermore, I authorize this form to be provided to any withholding agent that has control, receipt, or custody of the income of which the entity on line 1 is the beneficial owner or any withholding agent that can disburse or make payments of the income of which the entity on line 1 is the beneficial owner. I agree that I will submit a new form within 30 days if any certification on this form becomes incorrect." />
            </div>
          </label>
        )}
      </StyledInputFormikField>
    </div>
  );
};
