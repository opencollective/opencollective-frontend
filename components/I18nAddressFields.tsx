import React from 'react';
import type { FieldProps } from 'formik';
import { Field } from 'formik';
import { cloneDeep, isEmpty, isNil, orderBy, pick, pickBy, set, truncate } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import type { AddressFieldConfig, StructuredAddress, Zone } from '@/lib/address';
import { getAddressFormFields } from '@/lib/address';
import { isOCError } from '@/lib/errors';
import { formatFormErrorMessage } from '@/lib/form-utils';

import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import StyledSelect from './StyledSelect';

type LegacyFieldTuple = [string, string, Zone[]?];

type AddressFormFieldsResult = {
  fields: AddressFieldConfig[];
  optionalFields: string[];
};

/**
 * Convert address form fields from lib-address format to the legacy tuple format
 * used by this component: [[fieldName, label, zones?], ...]
 */
const convertToLegacyFormat = (addressFormFields: AddressFormFieldsResult): LegacyFieldTuple[] => {
  return addressFormFields.fields.map(field => {
    const tuple: LegacyFieldTuple = [field.name, field.label];
    if (field.zones && field.zones.length > 0) {
      tuple.push(field.zones);
    }
    return tuple;
  });
};

/**
 * Serialize an address object to a string
 */
export const serializeAddress = (address: Record<string, string | undefined>): string => {
  return Object.keys(address)
    .sort()
    .map(k => address[k])
    .join('\n');
};

/**
 * Upon changing selectedCountry, if previous address fields are no longer needed,
 * it clears them i.e. changing from Canada to Germany in the Expense form we no
 * longer need 'zone' in our payeeLocation.address object.
 */
const getAddressFieldDifferences = (
  formAddressValues: StructuredAddress | undefined,
  addressFields: LegacyFieldTuple[],
): StructuredAddress => {
  if (!formAddressValues) {
    return {};
  }
  const addressFieldsArray = addressFields.map(field => field[0]);
  const differenceInAddressFields = !isEmpty(
    Object.keys(formAddressValues).filter(key => !addressFieldsArray.includes(key)),
  );
  if (differenceInAddressFields) {
    return pick(formAddressValues, addressFieldsArray) as StructuredAddress;
  } else {
    return formAddressValues;
  }
};

type ZoneOption = {
  value: string;
  label: string;
};

const buildZoneOption = (zone: Zone): ZoneOption => {
  return { value: zone.name, label: `${truncate(zone.name, { length: 30 })} - ${zone.code}` };
};

type ChangeEvent = {
  target: {
    name: string;
    value: string | null;
  };
};

type ZoneSelectProps = {
  info?: Zone[];
  required?: boolean;
  value?: string | null;
  name: string;
  label: string;
  onChange: (e: ChangeEvent) => void;
  id?: string;
  error?: string;
  useLegacyComponent?: boolean;
};

const ZoneSelect: React.FC<ZoneSelectProps> = ({
  info,
  required,
  value,
  name,
  label,
  onChange,
  id,
  error,
  useLegacyComponent = true,
  ...props
}) => {
  const intl = useIntl();
  const zoneOptions = React.useMemo(() => orderBy((info || []).map(buildZoneOption), 'label'), [info]);

  // Reset zone if not supported
  React.useEffect(() => {
    if (zoneOptions) {
      const formValueZone = value;
      if (formValueZone && !zoneOptions.find(option => option.value === formValueZone)) {
        onChange({ target: { name: name, value: null } });
      }
    }
  }, [zoneOptions, name, onChange, value]);

  const placeholder = intl.formatMessage({ defaultMessage: 'Please select your {label}', id: 'WOyn1N' }, { label });
  if (useLegacyComponent) {
    return (
      <StyledSelect
        {...{ name, required, ...props }}
        inputId={id}
        minWidth={150}
        options={zoneOptions}
        error={Boolean(error)}
        placeholder={placeholder}
        data-cy={`address-${name}`}
        value={zoneOptions.find(option => option?.value === value) || null}
        onChange={(v: ZoneOption) => {
          onChange({ target: { name: name, value: v.value } });
        }}
      />
    );
  } else {
    return (
      <Select
        onValueChange={v => {
          onChange({ target: { name: name, value: v } });
        }}
        value={value || undefined}
      >
        <SelectTrigger data-cy={`address-${name}`}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="relative max-h-80 max-w-full">
          {zoneOptions.map(option => (
            <SelectItem key={option.value} value={option.value} className="cursor-pointer">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
};

type FieldRendererProps = {
  name: string;
  label: string;
  required?: boolean;
  prefix?: string;
  info?: Zone[];
  value?: string;
  error?: string;
  onChange?: (e: ChangeEvent) => void;
  fieldProps?: Record<string, unknown>;
};

const FormikLocationFieldRenderer: React.FC<FieldRendererProps> = ({ name, label, required, prefix, info }) => {
  const validate = required ? (value: string) => (value ? undefined : `${label} is required`) : undefined;
  return (
    <Field key={name} name={`${prefix}.${name}`} validate={validate}>
      {({ field, meta }: FieldProps) => (
        <StyledInputField name={field.name} label={label} labelFontSize="13px" mt={3} error={meta.error}>
          {(inputProps: { id?: string; name?: string }) => {
            switch (name) {
              case 'zone':
                return (
                  <ZoneSelect
                    id={inputProps.id}
                    name={inputProps.name || name}
                    required={required}
                    label={label}
                    info={info}
                    value={field.value}
                    onChange={field.onChange}
                  />
                );
              default:
                return (
                  <StyledInput {...inputProps} {...field} error={Boolean(meta.error)} data-cy={`address-${name}`} />
                );
            }
          }}
        </StyledInputField>
      )}
    </Field>
  );
};

/**
 * A simple location field renderer that uses the StyledInputField component.
 * @deprecated Use NewSimpleLocationFieldRenderer instead.
 */
export const SimpleLocationFieldRenderer: React.FC<FieldRendererProps> = ({
  name,
  label,
  error: errorProp,
  required,
  prefix,
  value,
  info,
  onChange,
  fieldProps,
}) => {
  const [isTouched, setIsTouched] = React.useState(false);
  const inputName = prefix ? `${prefix}.${name}` : name;
  const error = errorProp || (required && isTouched && isNil(value) ? `${label} is required` : undefined);
  const dispatchOnChange = (e: ChangeEvent) => {
    onChange?.(e);
    if (!isTouched) {
      setIsTouched(true);
    }
  };

  return (
    <StyledInputField
      key={name}
      name={inputName}
      label={label}
      labelFontSize="13px"
      mt={3}
      error={error}
      required={required}
      {...fieldProps}
    >
      {(inputProps: { id?: string; name?: string }) => {
        switch (name) {
          case 'zone':
            return (
              <ZoneSelect
                id={inputProps.id}
                name={inputProps.name || name}
                required={required}
                label={label}
                onChange={dispatchOnChange}
                error={error}
                info={info}
                value={value}
              />
            );
          default:
            return (
              <StyledInput
                {...inputProps}
                value={value || ''}
                error={Boolean(error)}
                onChange={dispatchOnChange}
                data-cy={`address-${name}`}
              />
            );
        }
      }}
    </StyledInputField>
  );
};

/**
 * A simple location field renderer that uses the Input component.
 */
export const NewSimpleLocationFieldRenderer: React.FC<FieldRendererProps> = ({
  name,
  label,
  error: errorProp,
  required,
  prefix,
  value,
  info,
  onChange,
  fieldProps,
}) => {
  const [isTouched, setIsTouched] = React.useState(false);
  const intl = useIntl();
  const htmlFor = prefix ? `${prefix}.${name}` : name;
  const error = errorProp || (required && isTouched && isNil(value) ? `${label} is required` : undefined);
  const dispatchOnChange = (e: ChangeEvent) => {
    onChange?.(e);
    if (!isTouched) {
      setIsTouched(true);
    }
  };
  const fieldAttributes = {
    ...pickBy(
      {
        ...fieldProps,
        value: value,
        name: name || htmlFor,
        id: htmlFor,
        required,
        error,
        info,
        label,
        onChange: dispatchOnChange,
      },
      val => val !== undefined,
    ),
  };

  return (
    <div className={'flex w-full flex-col gap-1'}>
      {label && (
        <Label className="leading-normal">
          {label}{' '}
          {!required && (
            <span className="font-normal text-muted-foreground">
              (<FormattedMessage defaultMessage="optional" id="FormField.optional" />)
            </span>
          )}
        </Label>
      )}
      {name === 'zone' ? (
        <ZoneSelect {...(fieldAttributes as ZoneSelectProps)} useLegacyComponent={false} />
      ) : (
        <Input {...fieldAttributes} />
      )}
      {error && (
        <p className="text-sm text-red-600">{isOCError(error) ? formatFormErrorMessage(intl, error) : error}</p>
      )}
    </div>
  );
};

export type I18nAddressFieldsProps = {
  /** The selected country code (ISO 3166-1 alpha-2) */
  selectedCountry: string;
  /** The current address values */
  value?: StructuredAddress;
  /** Callback when address values change */
  onCountryChange: (address: StructuredAddress) => void;
  /** Whether all fields are required */
  required?: boolean;
  /** Prefix for field names (e.g., 'payeeLocation.structured') */
  prefix?: string;
  /** Callback when country data fails to load */
  onLoadError?: () => void;
  /** Callback when country data loads successfully */
  onLoadSuccess?: (data: { countryInfo: AddressFormFieldsResult; addressFields: LegacyFieldTuple[] }) => void;
  /** Custom field renderer component */
  Component?: React.ComponentType<FieldRendererProps>;
  /** Additional props to pass to field components */
  fieldProps?: Record<string, unknown>;
  /** Field-specific errors */
  errors?: Record<string, string>;
};

/**
 * This component aims to create a responsive address form based on the user's country that they select.
 * Uses lib-address for country-specific address formatting.
 */
const I18nAddressFields: React.FC<I18nAddressFieldsProps> = ({
  selectedCountry,
  value,
  onCountryChange,
  required,
  prefix,
  onLoadError,
  onLoadSuccess,
  Component = FormikLocationFieldRenderer,
  fieldProps,
  errors,
}) => {
  const intl = useIntl();

  // Compute address fields synchronously (lib-address/lite has all data bundled)
  const addressFormFields = React.useMemo(() => {
    if (!selectedCountry) {
      return null;
    }
    try {
      return getAddressFormFields(selectedCountry, intl);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to get address form fields. Error: ', (e as Error).message);
      onLoadError?.();
      return null;
    }
  }, [selectedCountry, intl, onLoadError]);

  const fields = React.useMemo(() => {
    if (!addressFormFields) {
      return null;
    }
    return convertToLegacyFormat(addressFormFields);
  }, [addressFormFields]);

  // Notify parent when country changes and fields are updated
  React.useEffect(() => {
    if (fields && addressFormFields) {
      onCountryChange(getAddressFieldDifferences(value, fields));
      try {
        onLoadSuccess?.({ countryInfo: addressFormFields, addressFields: fields });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Error calling onLoadSuccess: ', (e as Error).message);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCountry]);

  if (!selectedCountry || !fields || !addressFormFields) {
    return null;
  }

  return (
    <React.Fragment>
      {fields.map(([fieldName, fieldLabel, fieldInfo]) => (
        <Component
          key={fieldName}
          prefix={prefix}
          name={fieldName}
          label={fieldLabel}
          info={fieldInfo}
          value={value?.[fieldName as keyof StructuredAddress]}
          required={required === false ? false : !addressFormFields.optionalFields.includes(fieldName)}
          error={errors?.[fieldName]}
          fieldProps={fieldProps}
          onChange={({ target: { name, value: fieldValue } }) =>
            onCountryChange(set(cloneDeep(value || {}), name, fieldValue) as StructuredAddress)
          }
        />
      ))}
    </React.Fragment>
  );
};

export default I18nAddressFields;
