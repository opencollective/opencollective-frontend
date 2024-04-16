import React from 'react';
import PropTypes from 'prop-types';
import { pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatFormErrorMessage } from '../lib/form-utils';

import I18nAddressFields, { SimpleLocationFieldRenderer } from './I18nAddressFields';
import I18nFormatters from './I18nFormatters';
import InputTypeCountry from './InputTypeCountry';
import MessageBox from './MessageBox';
import StyledInputField from './StyledInputField';
import StyledTextarea from './StyledTextarea';

const DEFAULT_LOCATION = {
  country: null,
  address: null,
  structured: null,
};

/**
 * A component to input a location. It tries to use the structured address if available,
 * and fallbacks on the raw address if not.
 */
const StyledInputLocation = ({
  name,
  location,
  autoDetectCountry,
  labelFontSize,
  labelFontWeight,
  onChange,
  errors,
  prefix,
  required,
  disableCountryChange,
  onLoadSuccess,
  useStructuredForFallback,
}) => {
  const [useFallback, setUseFallback] = React.useState(false);
  const intl = useIntl();
  const forceLegacyFormat = Boolean(!location?.structured && location?.address);
  const hasCountry = Boolean(location?.country);
  return (
    <div>
      <StyledInputField
        name={`${prefix}country`}
        htmlFor={`${prefix}country`}
        label={<FormattedMessage id="ExpenseForm.ChooseCountry" defaultMessage="Choose country" />}
        labelFontSize={labelFontSize}
        labelFontWeight={labelFontWeight}
        error={formatFormErrorMessage(intl, errors?.country)}
        required={required}
      >
        {({ id, ...inputProps }) => (
          <InputTypeCountry
            {...inputProps}
            inputId={id}
            disabled={disableCountryChange}
            value={location?.country}
            autoDetect={autoDetectCountry}
            onChange={country => {
              onChange({ ...(location || DEFAULT_LOCATION), country });
              if (setUseFallback) {
                setUseFallback(false);
              }
            }}
          />
        )}
      </StyledInputField>
      {hasCountry && !useFallback && !forceLegacyFormat ? (
        <I18nAddressFields
          selectedCountry={location?.country}
          value={location?.structured || {}}
          onLoadError={() => setUseFallback(true)} // TODO convert from structured to raw
          onLoadSuccess={onLoadSuccess}
          Component={SimpleLocationFieldRenderer}
          fieldProps={{ labelFontSize, labelFontWeight }}
          required={required}
          errors={errors?.structured}
          onCountryChange={structured =>
            onChange(pick({ ...(location || DEFAULT_LOCATION), structured }, ['country', 'structured']))
          }
        />
      ) : useFallback ? (
        <MessageBox type="error" withIcon mt={2}>
          <FormattedMessage
            defaultMessage="Failed to load the structured address fields. Please reload the page or <SupportLink>contact support</SupportLink>."
            id="5A4zUi"
            values={I18nFormatters}
          />
        </MessageBox>
      ) : (
        <StyledInputField
          name={`${prefix}${name}`}
          label={intl.formatMessage({ id: 'collective.address.label', defaultMessage: 'Address' })}
          required
          mt={3}
          labelFontSize={labelFontSize}
          labelFontWeight={labelFontWeight}
        >
          {inputProps => (
            <StyledTextarea
              {...inputProps}
              disabled={!hasCountry}
              data-cy={`${prefix}address`}
              minHeight={100}
              placeholder="P. Sherman 42&#10;Wallaby Way&#10;Sydney"
              defaultValue={location?.address || ''}
              onChange={e => {
                const address = e.target.value;
                if (!useStructuredForFallback) {
                  onChange(pick({ ...(location || DEFAULT_LOCATION), address }, ['country', 'address']));
                } else {
                  onChange(
                    pick({ ...(location || DEFAULT_LOCATION), structured: { address1: address } }, [
                      'country',
                      'structured',
                    ]),
                  );
                }
              }}
            />
          )}
        </StyledInputField>
      )}
    </div>
  );
};

StyledInputLocation.propTypes = {
  name: PropTypes.string,
  prefix: PropTypes.string,
  onChange: PropTypes.func,
  onLoadSuccess: PropTypes.func,
  autoDetectCountry: PropTypes.bool,
  disableCountryChange: PropTypes.bool,
  required: PropTypes.bool,
  labelFontWeight: PropTypes.any,
  labelFontSize: PropTypes.any,
  useStructuredForFallback: PropTypes.bool,
  location: PropTypes.shape({
    structured: PropTypes.object,
    address: PropTypes.string,
    country: PropTypes.string,
  }),
  errors: PropTypes.object,
};

StyledInputLocation.defaultProps = {
  required: true,
  prefix: '',
};

export default StyledInputLocation;
