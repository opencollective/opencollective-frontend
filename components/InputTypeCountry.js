import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { countries as countriesEN } from 'i18n-iso-countries/langs/en.json';
import { countries as countriesFR } from 'i18n-iso-countries/langs/fr.json';
import { orderBy, truncate } from 'lodash';
import memoizeOne from 'memoize-one';
import { FormattedMessage, injectIntl } from 'react-intl';

import StyledSelect from './StyledSelect';

const CountriesI18n = {
  fr: countriesFR,
  en: countriesEN,
};

class InputTypeCountry extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string,
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

  getOptions = memoizeOne(locale => {
    const countries = CountriesI18n[locale] || CountriesI18n.en;

    const options = Object.keys(countries).map(code => ({
      value: code,
      label: `${truncate(countries[code] || countriesEN[code], { length: 30 })} - ${code}`,
    }));

    return orderBy(options, 'label');
  });

  getSelectedOption = memoizeOne((locale, country) => {
    const code = country && country.toUpperCase();
    const countries = CountriesI18n[locale] || CountriesI18n.en;
    return {
      value: code,
      label: `${truncate(countries[code] || countriesEN[code], { length: 30 })} - ${code}`,
    };
  });

  render() {
    const { defaultValue, value, intl, onChange, ...props } = this.props;
    return (
      <StyledSelect
        name={name}
        minWidth={150}
        options={this.getOptions(intl.locale, defaultValue)}
        onChange={({ value }) => onChange(value)}
        value={value ? this.getSelectedOption(intl.locale, value) : undefined}
        defaultValue={defaultValue ? this.getSelectedOption(intl.locale, defaultValue) : undefined}
        placeholder={<FormattedMessage id="InputTypeCountry.placeholder" defaultMessage="Please select your country" />}
        {...props}
      />
    );
  }
}

export default injectIntl(InputTypeCountry);
