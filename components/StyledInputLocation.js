import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import I18nAddressFields, { SimpleLocationFieldRenderer } from './I18nAddressFields';
import InputTypeCountry from './InputTypeCountry';
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
const StyledInputLocation = ({ name, location, autoDetectCountry, labelFontSize, labelFontWeight, onChange }) => {
  const [useFallback, setUseFallback] = React.useState(false);
  const forceLegacyFormat = Boolean(!location?.structured && location?.address);
  const hasCountry = Boolean(location?.country);
  return (
    <div>
      <StyledInputField
        name="country"
        htmlFor="country"
        label={<FormattedMessage id="ExpenseForm.ChooseCountry" defaultMessage="Choose country" />}
        labelFontSize={labelFontSize}
        labelFontWeight={labelFontWeight}
        required
      >
        {({ id, ...inputProps }) => (
          <InputTypeCountry
            {...inputProps}
            inputId={id}
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
          selectedCountry={location.country}
          value={location.structured || {}}
          onLoadError={() => setUseFallback(true)} // TODO convert from structured to raw
          Component={SimpleLocationFieldRenderer}
          onCountryChange={structured => onChange({ ...(location || DEFAULT_LOCATION), structured })}
          fieldProps={{ labelFontSize, labelFontWeight }}
          required
        />
      ) : (
        <StyledInputField
          name={name}
          label="Address"
          required
          mt={3}
          labelFontSize={labelFontSize}
          labelFontWeight={labelFontWeight}
        >
          {inputProps => (
            <StyledTextarea
              {...inputProps}
              disabled={!hasCountry}
              data-cy="payee-address"
              minHeight={100}
              placeholder="P. Sherman 42&#10;Wallaby Way&#10;Sydney"
            />
          )}
        </StyledInputField>
      )}
    </div>
  );
};

StyledInputLocation.propTypes = {
  name: PropTypes.string,
  onChange: PropTypes.func,
  autoDetectCountry: PropTypes.bool,
  labelFontWeight: PropTypes.any,
  labelFontSize: PropTypes.any,
  location: PropTypes.shape({
    structured: PropTypes.object,
    address: PropTypes.string,
    country: PropTypes.string,
  }),
};

export default StyledInputLocation;
