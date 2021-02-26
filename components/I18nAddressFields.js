/** This component aims to create a responsive address form based on the user's country that they select.
 * Shopify has a good article about internationalising address forms: https://ux.shopify.com/designing-address-forms-for-everyone-everywhere-f481f6baf513
 * And they also have an API and npm package to tell you what address fields a country uses, and in what order https://github.com/Shopify/quilt/tree/master/packages/address
 * Additional material:
 * Shopify API country codes ("ISO 3166-1 alpha-2 country codes with some differences"): https://shopify.dev/docs/admin-api/graphql/reference/common-objects/countrycode
 * Shopify locale code uses ISO locale codes: https://shopify.dev/docs/admin-api/graphql/reference/translations/locale
 * How Etsy Localizes addresses https://codeascraft.com/2018/09/26/how-etsy-localizes-addresses/
 * Form i18n techniques https://medium.com/flexport-design/form-internationalization-techniques-3e4d394cd7e5 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import AddressFormatter from '@shopify/address';
import { Field } from 'formik';
import { get, isEmpty, isUndefined, orderBy, pick, truncate } from 'lodash';
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

/** Generates zone/province/state options for select */
const getZoneLabel = zone => {
  return `${truncate(zone.name, { length: 30 })} - ${zone.code}`;
};

const getZoneSelectOptions = zonesInfo => {
  if (!zonesInfo) {
    return null;
  }
  const zonesArray = zonesInfo[2];
  const options = zonesArray.map(zone => ({
    value: zone.name,
    label: getZoneLabel(zone),
  }));

  return orderBy(options, 'label');
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
    return null;
  }
};

const I18nAddressFields = ({ selectedCountry, value, onChange, onCountryChange, required, prefix }) => {
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
        console.warn('Call to Shopify API failed. Falling back to plain address form. Error: ', e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCountry]);

  const zoneOptions = React.useMemo(() => {
    if (!fields) {
      return null;
    }
    const zoneFields = fields.find(field => field[0] === 'zone');
    // If there are no zone fields for the country, return
    if (isUndefined(zoneFields)) {
      return null;
    }
    return getZoneSelectOptions(zoneFields);
  }, [fields]);

  const isFieldRequired = fieldName => {
    return isUndefined(required) ? !Object.keys(data?.optionalLabels).includes(fieldName) : required;
  };

  React.useEffect(() => {
    if (zoneOptions) {
      const formValueZone = get(value, 'zone', undefined);
      if (formValueZone && !zoneOptions.find(option => option.value === formValueZone)) {
        onChange({ name: 'zone', value: null });
      }
    }
  }, [zoneOptions]);

  if (!selectedCountry) {
    return null;
  }

  if (loading || !fields) {
    return <LoadingPlaceholder width="100%" height={163} mt={3} />;
  }

  return (
    <Fragment>
      {fields.map(([name, label]) => {
        const required = isFieldRequired(name);
        const validate = required ? value => (value ? undefined : `${label} is required`) : undefined;
        return (
          <Field key={name} name={`${prefix}.${name}`} validate={validate}>
            {({ field, meta }) => (
              <StyledInputField name={field.name} label={label} labelFontSize="13px" mt={3} error={meta.error}>
                {name === 'zone'
                  ? ({ id, name, required }) => (
                      <StyledSelect
                        {...{ name, required, ...field }}
                        inputId={id}
                        minWidth={150}
                        options={zoneOptions}
                        error={meta.error}
                        placeholder={`Please select your ${label}`}
                        data-cy={`payee-address-${name}`}
                        onChange={v => {
                          field.onChange({ target: { name: field.name, value: v.value } });
                        }}
                        value={zoneOptions.find(option => option?.value == field.value) || null}
                      />
                    )
                  : inputProps => (
                      <StyledInput {...inputProps} {...field} error={meta.error} data-cy={`payee-address-${name}`} />
                    )}
              </StyledInputField>
            )}
          </Field>
        );
      })}
    </Fragment>
  );
};

I18nAddressFields.propTypes = {
  /** ISO country code passed down from ExpenseFormPayeeStep. */
  selectedCountry: PropTypes.string.isRequired,
  name: PropTypes.string,
  prefix: PropTypes.string,
  required: PropTypes.bool,
  /** String if using old address textarea; object if using new address fields. */
  value: PropTypes.oneOfType([PropTypes.object, PropTypes.string]).isRequired,
  onChange: PropTypes.func.isRequired,
  onCountryChange: PropTypes.func.isRequired,
};

export default I18nAddressFields;
