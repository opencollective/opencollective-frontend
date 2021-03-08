import React, { Component } from 'react';
import PropTypes from 'prop-types';
import countriesEN from 'i18n-iso-countries/langs/en.json';
import countriesFR from 'i18n-iso-countries/langs/fr.json';
import countriesPT from 'i18n-iso-countries/langs/pt.json';
import { isUndefined, orderBy, truncate } from 'lodash';
import memoizeOne from 'memoize-one';
import { FormattedMessage, injectIntl } from 'react-intl';

import fetchGeoLocation from '../lib/geolocation_api';

import StyledSelect from './StyledSelect';

const COUNTRY_NAMES = {
  en: countriesEN.countries,
  fr: countriesFR.countries,
  pt: countriesPT.countries,
};

const getCountryName = (locale, country) => {
  const names = COUNTRY_NAMES[locale]?.[country] ?? COUNTRY_NAMES.en[country];
  if (Array.isArray(names)) {
    return names[0];
  } else {
    return names;
  }
};

class InputTypeCountry extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string,
    /** To force a specific locale */
    locale: PropTypes.string,
    defaultValue: PropTypes.string,
    /** Use this to control the component state */
    value: PropTypes.string,
    /** Switch between display modes */
    mode: PropTypes.oneOf(['select', 'underlined']),
    /** If true, we'll try to autodetect country form the IP */
    autoDetect: PropTypes.bool,
    /** From injectIntl */
    intl: PropTypes.object.isRequired,
    /** Is this input required? */
    required: PropTypes.bool,
  };

  static defaultProps = { name: 'country' };

  async componentDidMount() {
    if (this.props.autoDetect && !this.props.value && !this.props.defaultValue) {
      const country = await fetchGeoLocation();

      // Country may have been changed by the user by the time geolocation API respond
      if (country && !this.props.value && !this.props.defaultValue) {
        this.props.onChange(country);
      }
    }
  }

  getCountryLabel(code, locale) {
    const name = getCountryName(locale, code);
    return `${truncate(name, { length: 30 })} - ${code}`;
  }

  getOptions = memoizeOne(locale => {
    const options = Object.keys(COUNTRY_NAMES.en).map(code => ({
      value: code,
      label: this.getCountryLabel(code, locale),
    }));

    return orderBy(options, 'label');
  });

  getSelectedOption = memoizeOne((locale, country) => {
    if (!country) {
      return null;
    }

    const code = country.toUpperCase();
    return {
      value: code,
      label: this.getCountryLabel(code, locale),
    };
  });

  render() {
    const { defaultValue, value, intl, onChange, locale, name, ...props } = this.props;
    return (
      <StyledSelect
        name={name}
        inputId="country-input"
        minWidth={150}
        options={this.getOptions(locale || intl.locale, defaultValue)}
        onChange={({ value }) => onChange(value)}
        value={!isUndefined(value) ? this.getSelectedOption(locale || intl.locale, value) : undefined}
        defaultValue={defaultValue ? this.getSelectedOption(locale || intl.locale, defaultValue) : undefined}
        placeholder={<FormattedMessage id="InputTypeCountry.placeholder" defaultMessage="Please select your country" />}
        data-cy="country-select"
        {...props}
      />
    );
  }
}

export default injectIntl(InputTypeCountry);
