import React from 'react';
import { checkVATNumberFormat, GST_RATE_PERCENT, TaxType } from '@opencollective/taxes';
import type { FormikProps } from 'formik';
import { get, isNil, round } from 'lodash';
import type { IntlShape } from 'react-intl';
import { useIntl } from 'react-intl';

import type { OCError } from '../../lib/errors';
import { createError, ERROR } from '../../lib/errors';
import { verifyValueInRange } from '../../lib/form-utils';
import type { ExpenseTaxInput, TaxInput } from '../../lib/graphql/types/v2/graphql';
import { i18nTaxType } from '../../lib/i18n/taxes';

import { Flex } from '../Grid';
import StyledInput from '../StyledInput';
import StyledInputFormikField from '../StyledInputFormikField';
import StyledInputGroup from '../StyledInputGroup';
import StyledSelect from '../StyledSelect';

type TaxesFormikFieldsProps = {
  taxType: TaxType;
  formik: FormikProps<any>;
  formikValuePath: string;
  isOptional?: boolean;
  dispatchDefaultValueOnMount?: boolean;
  labelProps?: Record<string, any>;
  idNumberLabelRenderer?: (shortLabel: string) => string;
};

type TaxSpecificValues = {
  idNumberPlaceholder: string;
  requireIdNumber: boolean;
  forcedRate?: number;
  possibleRates?: number[];
};

const validateVATTaxInput = (intl, tax: TaxInput, options) => {
  const errors: Partial<Record<keyof ExpenseTaxInput, OCError>> = {};
  if (tax.type !== TaxType.VAT) {
    return errors;
  } else if (isNaN(tax.rate) || isNil(tax.rate)) {
    errors.rate = createError(ERROR.FORM_FIELD_REQUIRED);
  } else {
    verifyValueInRange(intl, errors, tax, 'rate', 0, 1, 100);
  }

  // ID number is required if there's a tax rate
  if (tax.rate) {
    if (!tax.idNumber && options.requireTaxIdNumber) {
      errors.idNumber = createError(ERROR.FORM_FIELD_REQUIRED);
    } else if (tax.idNumber && !checkVATNumberFormat(tax.idNumber).isValid) {
      errors.idNumber = createError(ERROR.FORM_FIELD_PATTERN);
    }
  }

  return errors;
};

const validateGSTTaxInput = (intl, tax: TaxInput, options) => {
  const errors: Partial<Record<keyof ExpenseTaxInput, OCError>> = {};
  if (tax.type !== TaxType.GST) {
    return errors;
  }

  // Not validating rate since it can't be customized
  // ID number is required if there's a tax rate
  if (tax.rate && !tax.idNumber && options.requireTaxIdNumber) {
    errors.idNumber = createError(ERROR.FORM_FIELD_REQUIRED);
  } else if (![0, 0.15].includes(tax.rate)) {
    errors.rate = createError(ERROR.FORM_FIELD_INVALID_VALUE);
  }

  return errors;
};

export const validateTaxInput = (intl: IntlShape, tax: TaxInput, options = { requireTaxIdNumber: true }) => {
  switch (tax?.type) {
    case TaxType.GST:
      return validateGSTTaxInput(intl, tax, options);
    case TaxType.VAT:
      return validateVATTaxInput(intl, tax, options);
    default:
      return {};
  }
};

const getTaxSpecificValues = (intl: IntlShape, taxType: TaxType, currentTaxValue): TaxSpecificValues => {
  switch (taxType) {
    case TaxType.VAT:
      return {
        idNumberPlaceholder: 'EU000011111',
        requireIdNumber: Boolean(currentTaxValue?.rate),
      };
    case TaxType.GST:
      return {
        idNumberPlaceholder: '123456789',
        requireIdNumber: false,
        forcedRate: GST_RATE_PERCENT / 100,
        possibleRates: [0, GST_RATE_PERCENT / 100],
      };
    default:
      return null;
  }
};

const i18nTaxRate = (intl: IntlShape, taxType: TaxType, rate: number) => {
  if (rate) {
    return `${rate * 100}%`;
  } else {
    return intl.formatMessage({ defaultMessage: 'No {taxName}' }, { taxName: i18nTaxType(intl, taxType, 'short') });
  }
};

/**
 * Automatically renders the correct tax fields based on the tax type, or nothing if the tax type is null.
 */
export const TaxesFormikFields = ({
  taxType,
  formik,
  formikValuePath,
  labelProps,
  isOptional,
  idNumberLabelRenderer,
  dispatchDefaultValueOnMount = true,
}: TaxesFormikFieldsProps) => {
  const intl = useIntl();
  const currentTaxValue = get(formik.values, formikValuePath);
  const taxSpecificValues = getTaxSpecificValues(intl, taxType, currentTaxValue);

  const dispatchChange = (rate: number) =>
    formik.setFieldValue(formikValuePath, { ...currentTaxValue, type: taxType, rate: rate });

  // If mounted, it means that the form is subject to taxType. Let's make sure we initialize taxes field accordingly
  React.useEffect(() => {
    const isForcedRate = !isOptional && !isNil(taxSpecificValues.forcedRate);
    if (
      dispatchDefaultValueOnMount &&
      taxType &&
      (currentTaxValue?.type !== taxType || (isForcedRate && taxSpecificValues.forcedRate !== currentTaxValue?.rate))
    ) {
      dispatchChange(taxSpecificValues.forcedRate);
    }
  }, []);

  if (!taxType) {
    return null;
  }

  const shortTaxTypeLabel = i18nTaxType(intl, taxType, 'short');
  const isForcedRate = !isOptional && !isNil(taxSpecificValues.forcedRate);
  return (
    <Flex gap="8px">
      <StyledInputFormikField
        name={`${formikValuePath}.rate`}
        htmlFor={`input-${taxType}-rate`}
        label={intl.formatMessage({ defaultMessage: '{taxName} rate' }, { taxName: shortTaxTypeLabel })}
        labelProps={{ whiteSpace: 'nowrap', ...labelProps }}
        inputType="number"
        required={!isOptional}
      >
        {({ field }) =>
          isForcedRate || !taxSpecificValues.possibleRates ? (
            <StyledInputGroup
              {...field}
              value={round(field.value * 100, 2)}
              onChange={e => dispatchChange(round(e.target.value / 100, 4))}
              minWidth={65}
              append="%"
              min={0}
              max={100}
              step="0.01"
              disabled={isForcedRate}
            />
          ) : (
            <StyledSelect
              inputId={`input-${taxType}-rate`}
              value={{ value: round(field.value * 100, 2), label: i18nTaxRate(intl, taxType, field.value) }}
              onChange={({ value }) => dispatchChange(value)}
              options={taxSpecificValues.possibleRates.map(rate => ({
                value: rate,
                label: i18nTaxRate(intl, taxType, rate),
              }))}
            />
          )
        }
      </StyledInputFormikField>
      <StyledInputFormikField
        name={`${formikValuePath}.idNumber`}
        htmlFor={`input-${taxType}-id-number`}
        label={
          idNumberLabelRenderer
            ? idNumberLabelRenderer(shortTaxTypeLabel)
            : intl.formatMessage({ defaultMessage: '{taxName} identifier' }, { taxName: shortTaxTypeLabel })
        }
        labelProps={{ whiteSpace: 'nowrap', ...labelProps }}
        required={!isOptional && taxSpecificValues.requireIdNumber}
        flexGrow={1}
        mr={2}
      >
        {({ field }) => (
          <StyledInput
            {...field}
            placeholder={intl.formatMessage(
              { id: 'examples', defaultMessage: 'e.g., {examples}' },
              { examples: taxSpecificValues.idNumberPlaceholder },
            )}
          />
        )}
      </StyledInputFormikField>
    </Flex>
  );
};
