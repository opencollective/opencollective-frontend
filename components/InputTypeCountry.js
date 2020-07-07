import React, { Component } from 'react';
import PropTypes from 'prop-types';
import countries from 'i18n-iso-countries';
import countriesEN from 'i18n-iso-countries/langs/en.json';
import countriesFR from 'i18n-iso-countries/langs/fr.json';
import { isUndefined, orderBy, truncate } from 'lodash';
import memoizeOne from 'memoize-one';
import { FormattedMessage, injectIntl } from 'react-intl';

import StyledSelect from './StyledSelect';

countries.registerLocale(countriesEN);
countries.registerLocale(countriesFR);

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
    /** From injectIntl */
    intl: PropTypes.object.isRequired,
    /** Is this input required? */
    required: PropTypes.bool,
  };

  static defaultProps = { name: 'country' };

  getCountryLabel(code, locale) {
    const name = countries.getName(code, locale) || countries.getName(code, 'en');
    return `${truncate(name, { length: 30 })} - ${code}`;
  }

  getOptions = memoizeOne(locale => {
    const options = Object.keys(countries.getAlpha2Codes()).map(code => ({
      value: code,
      label: this.getCountryLabel(code, locale),
    }));

    return orderBy(options, 'label');
  });

  getSelectedOption = memoizeOne((locale, country) => {
    if (!country) {
      return null;
    }

    const code = country && country.toUpperCase();
    return {
      value: code,
      label: this.getCountryLabel(code, locale),
    };
  });

  render() {
    const { defaultValue, value, intl, onChange, locale, ...props } = this.props;
    return (
      <StyledSelect
        name={name}
        minWidth={150}
        options={this.getOptions(locale || intl.locale, defaultValue)}
        onChange={({ value }) => onChange(value)}
        value={!isUndefined(value) ? this.getSelectedOption(locale || intl.locale, value) : undefined}
        defaultValue={defaultValue ? this.getSelectedOption(locale || intl.locale, defaultValue) : undefined}
        placeholder={<FormattedMessage id="InputTypeCountry.placeholder" defaultMessage="Please select your country" />}
        {...props}
      />
    );
  }
}

export default injectIntl(InputTypeCountry);
