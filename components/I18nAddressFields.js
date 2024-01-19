import React from 'react';
import PropTypes from 'prop-types';
import AddressFormatter from '@shopify/address';
import { Field } from 'formik';
import { cloneDeep, get, isEmpty, isNil, orderBy, pick, set, truncate } from 'lodash';
import { useIntl } from 'react-intl';

import LoadingPlaceholder from './LoadingPlaceholder';
import StyledInput from './StyledInput';
import StyledInputField from './StyledInputField';
import StyledSelect from './StyledSelect';

/** Constants */

/** Countries present in InputTypeCountry dropdown but not Shopify's API.
 * All except Antarctica (AQ) are U.S. territories and use that address format.
 * The Shopify default address format is also U.S. format therefore for all
 * of these we use the U.S. default.
 * All language codes in locales.js are supported by the Shopify API 👍
 */
const missingCountries = ['AS', 'AQ', 'GU', 'MH', 'FM', 'MP', 'PW', 'PR', 'VI'];
const addressFormatter = new AddressFormatter('EN');

const wrangleAddressData = addressInfo => {
  if (typeof addressInfo !== 'object') {
    return addressInfo;
  }
  const formLayout = addressInfo.formatting.edit;
  const necessaryFields = ['address1', 'address2', 'city', 'zip', 'province'];

  // Get form fields in correct order for the chosen country
  const matches = formLayout.match(/([A-Za-z])\w+/g).filter(match => necessaryFields.includes(match));

  // Change field names to match https://github.com/Shopify/quilt/blob/master/packages/address/src/utilities.ts
  const mappedMatches = matches.map(match => {
    if (match === 'zip') {
      return 'postalCode';
    } else if (match === 'province') {
      return 'zone';
    } else {
      return match;
    }
  });

  const addressFormFields = Object.entries(addressInfo.labels)
    .filter(entry => mappedMatches.includes(entry[0]))
    .sort((a, b) => {
      return mappedMatches.indexOf(a[0]) - mappedMatches.indexOf(b[0]);
    });

  // Check if we need to render drop-down list of "zones" (i.e. provinces, states, etc.)
  const zones = get(addressInfo, 'zones', []);
  if (mappedMatches.includes('zone') && !isEmpty(zones)) {
    const zoneIndex = addressFormFields.find(idx => idx[0] === 'zone');
    zoneIndex.push(addressInfo.zones);
  }

  return addressFormFields;
};

export const serializeAddress = address => {
  return Object.keys(address)
    .sort()
    .map(k => address[k])
    .join('\n');
};

/** Upon changing selectedCountry, if previous address fields are no longer needed,
 * it clears them i.e. changing from Canada to Germany in the Expense form we no
 * longer need 'zone' in our payeeLocation.address object.
 */
const getAddressFieldDifferences = (formAddressValues, addressFields) => {
  const addressFieldsArray = addressFields.map(field => field[0]);
  const differenceInAddressFields = !isEmpty(
    Object.keys(formAddressValues).filter(key => !addressFieldsArray.includes(key)),
  );
  if (differenceInAddressFields) {
    return pick(formAddressValues, addressFieldsArray);
  } else {
    return formAddressValues;
  }
};

const buildZoneOption = zone => {
  return { value: zone.name, label: `${truncate(zone.name, { length: 30 })} - ${zone.code}` };
};

const ZoneSelect = ({ info, required, value, name, label, onChange, id, error, ...props }) => {
  const zones = info || [];
  const zoneOptions = React.useMemo(() => orderBy(zones.map(buildZoneOption), 'label'), [zones]);

  // Reset zone if not supported
  React.useEffect(() => {
    if (zoneOptions) {
      const formValueZone = value;
      if (formValueZone && !zoneOptions.find(option => option.value === formValueZone)) {
        onChange({ target: { name: name, value: null } });
      }
    }
  }, [zoneOptions]);

  return (
    <StyledSelect
      {...{ name, required, ...props }}
      inputId={id}
      minWidth={150}
      options={zoneOptions}
      error={error}
      placeholder={`Please select your ${label}`} // TODO i18n
      data-cy={`address-${name}`} // TODO: Should not be locked on payee-address
      value={zoneOptions.find(option => option?.value === value) || null}
      onChange={v => {
        onChange({ target: { name: name, value: v.value } });
      }}
    />
  );
};

ZoneSelect.propTypes = {
  info: PropTypes.array,
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  error: PropTypes.any,
  required: PropTypes.bool,
  id: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

export const FormikLocationFieldRenderer = ({ name, label, required, prefix, info }) => {
  const validate = required ? value => (value ? undefined : `${label} is required`) : undefined;
  return (
    <Field key={name} name={`${prefix}.${name}`} validate={validate}>
      {({ field, meta }) => (
        <StyledInputField name={field.name} label={label} labelFontSize="13px" mt={3} error={meta.error}>
          {inputProps => {
            switch (name) {
              case 'zone':
                return (
                  <ZoneSelect
                    id={inputProps.id}
                    name={inputProps.name}
                    required={required}
                    label={label}
                    info={info}
                    {...field}
                  />
                );
              default:
                return <StyledInput {...inputProps} {...field} error={meta.error} data-cy={`address-${name}`} />;
            }
          }}
        </StyledInputField>
      )}
    </Field>
  );
};

export const SimpleLocationFieldRenderer = ({ name, label, required, prefix, value, info, onChange, fieldProps }) => {
  const [isTouched, setIsTouched] = React.useState(false);
  const error = required && isTouched && isNil(value) ? `${label} is required` : undefined;
  const inputName = prefix ? `${prefix}.${name}` : name;
  const dispatchOnChange = e => {
    onChange(e);
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
      {inputProps => {
        switch (name) {
          case 'zone':
            return (
              <ZoneSelect
                id={inputProps.id}
                name={inputProps.name}
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
                value={value}
                error={error}
                onChange={dispatchOnChange}
                data-cy={`address-${name}`}
              />
            );
        }
      }}
    </StyledInputField>
  );
};

const fieldRenderPropTypes = {
  info: PropTypes.array,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  prefix: PropTypes.string,
  required: PropTypes.bool,
  fieldProps: PropTypes.object,
};

FormikLocationFieldRenderer.propTypes = fieldRenderPropTypes;
SimpleLocationFieldRenderer.propTypes = fieldRenderPropTypes;

/**
 * This component aims to create a responsive address form based on the user's country that they select.
 * Shopify has a good article about internationalizing address forms: https://ux.shopify.com/designing-address-forms-for-everyone-everywhere-f481f6baf513
 * And they also have an API and npm package to tell you what address fields a country uses, and in what order https://github.com/Shopify/quilt/tree/master/packages/address
 * Additional material:
 * Shopify API country codes ("ISO 3166-1 alpha-2 country codes with some differences"): https://shopify.dev/docs/admin-api/graphql/reference/common-objects/countrycode
 * Shopify locale code uses ISO locale codes: https://shopify.dev/docs/admin-api/graphql/reference/translations/locale
 * How Etsy Localizes addresses https://codeascraft.com/2018/09/26/how-etsy-localizes-addresses/
 * Form i18n techniques https://medium.com/flexport-design/form-internationalization-techniques-3e4d394cd7e5
 */
const I18nAddressFields = ({
  selectedCountry,
  value,
  onCountryChange,
  required,
  prefix,
  onLoadError,
  Component,
  fieldProps,
}) => {
  const intl = useIntl();
  /** If country chosen from InputTypeCountry is one of missingCountries, use 'US' instead */
  const country = missingCountries.includes(selectedCountry) ? 'US' : selectedCountry;

  /** Prepare the address form data */
  const [data, setData] = React.useState(null);
  const [fields, setFields] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  /** Pass user's chosen locale to AddressFormatter if present. */
  React.useEffect(() => {
    if (intl.locale) {
      addressFormatter.updateLocale(intl.locale);
    }
  }, [intl.locale]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await addressFormatter.getCountry(country);
        setData(pick(response, ['formatting', 'labels', 'optionalLabels', 'zones']));
        const countryInfo = pick(response, ['formatting', 'labels', 'optionalLabels', 'zones']);
        const addressFields = wrangleAddressData(countryInfo);
        setFields(addressFields);
        onCountryChange(getAddressFieldDifferences(value, addressFields));
      } catch (e) {
        onLoadError?.();
        // eslint-disable-next-line no-console
        console.warn('Call to Shopify API failed. Falling back to plain address form. Error: ', e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCountry]);

  if (!selectedCountry) {
    return null;
  }

  if (loading || !fields) {
    return <LoadingPlaceholder width="100%" height={163} mt={3} />;
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
          value={value?.[fieldName]}
          required={required === false ? false : !Object.keys(data?.optionalLabels || {}).includes(fieldName)}
          fieldProps={fieldProps}
          onChange={({ target: { name, value: fieldValue } }) =>
            onCountryChange(set(cloneDeep(value || {}), name, fieldValue))
          }
        />
      ))}
    </React.Fragment>
  );
};

I18nAddressFields.propTypes = {
  /** ISO country code passed down from ExpenseFormPayeeStep. */
  selectedCountry: PropTypes.string,
  name: PropTypes.string,
  prefix: PropTypes.string,
  required: PropTypes.bool,
  /** String if using old address textarea; object if using new address fields. */
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  onCountryChange: PropTypes.func.isRequired, // TODO Rename this prop, it's not doing what the name implies
  /** Called when the call to the Shopify API fails */
  onLoadError: PropTypes.func,
  /** A function used to render the field */
  Component: PropTypes.func,
  /** Additional props to be passed to `Component` */
  fieldProps: PropTypes.object,
};

I18nAddressFields.defaultProps = {
  Component: FormikLocationFieldRenderer, // For legacy compatibility
};

export default I18nAddressFields;
