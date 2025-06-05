import React, { Component } from 'react';
import { getEmojiByCountryCode } from 'country-currency-emoji-flags';
import { isUndefined, orderBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { FormattedMessage, injectIntl } from 'react-intl';

import fetchGeoLocation from '../lib/geolocation_api';
import { CountryIso } from '../lib/graphql/types/v2/schema';
import { getIntlDisplayNames } from '../lib/i18n';

import { Flex } from './Grid';
import StyledSelect from './StyledSelect';
import { Span } from './Text';

class InputTypeCountry extends Component {
  static defaultProps = { name: 'country', customOptions: [], fontSize: '14px' };

  constructor(props) {
    super(props);
    this.countryNames = getIntlDisplayNames(props.intl.locale, 'region');
  }

  async componentDidMount() {
    if (this.props.autoDetect && !this.props.value && !this.props.defaultValue) {
      const country = await fetchGeoLocation();

      // Country may have been changed by the user by the time geolocation API respond
      if (country && !this.props.value && !this.props.defaultValue) {
        this.props.onChange(country);
      }
    }
  }

  generateCountryLabel(locale, countryCode) {
    const countryName = this.countryNames.of(countryCode);
    const emoji = getEmojiByCountryCode(countryCode);
    return (
      <Flex fontSize={this.props.fontSize} lineHeight="20px" fontWeight="500" title={countryName}>
        {emoji && <Span>{emoji}</Span>}
        &nbsp;&nbsp;
        <Span color="black.800">{countryName}</Span>
      </Flex>
    );
  }

  getOptions = memoizeOne(locale => {
    const options = Object.keys(CountryIso).map(code => {
      return {
        value: code,
        country: this.countryNames.of(code),
        label: this.generateCountryLabel(locale, code),
      };
    });

    return [...this.props.customOptions, ...orderBy(options, 'country')];
  });

  getSelectedOption = memoizeOne((locale, country) => {
    if (!country) {
      return null;
    }

    const code = country.toUpperCase();
    const customOption = this.props.customOptions.find(customOption => customOption.value === code);
    return (
      customOption || {
        value: code,
        label: this.generateCountryLabel(locale, code),
      }
    );
  });

  filterOptions(candidate, input) {
    if (input) {
      return (
        candidate.data.country?.toLowerCase()?.includes(input.toLowerCase()) ||
        candidate.data.value?.toLowerCase() === input.toLowerCase()
      );
    }
    return true;
  }

  render() {
    const { defaultValue, value, intl, onChange, locale, name, inputId, ...props } = this.props;
    return (
      <StyledSelect
        name={name}
        inputId={inputId}
        minWidth={150}
        options={this.getOptions(locale || intl.locale, defaultValue)}
        filterOption={this.filterOptions}
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
