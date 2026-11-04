import React, { Component } from 'react';
import { getEmojiByCountryCode } from 'country-currency-emoji-flags';
import { isUndefined, orderBy } from 'lodash-es';
import memoizeOne from 'memoize-one';
import type { IntlShape } from 'react-intl';
import { FormattedMessage } from 'react-intl';

import fetchGeoLocation from '../lib/geolocation_api';
import { CountryIso } from '../lib/graphql/types/v2/graphql';
import { getIntlDisplayNames } from '../lib/i18n';
import injectIntl from '@/lib/injectIntl';

import { Flex } from './Grid';
import StyledSelect from './StyledSelect';
import { Span } from './Text';

type CountryOption = {
  label?: React.ReactNode;
  value?: string;
};

type InputTypeCountryProps = {
  /** The id of the search input */
  inputId: string;
  onChange: (country: string) => void;
  name?: string;
  /** To force a specific locale */
  locale?: string;
  fontSize?: string;
  defaultValue?: string;
  /** Use this to control the component state */
  value?: string;
  /** Switch between display modes */
  mode?: 'select' | 'underlined';
  /** If true, we'll try to autodetect country form the IP */
  autoDetect?: boolean;
  /** From injectIntl */
  intl?: IntlShape;
  /** Is this input required? */
  required?: boolean;
  /** Custom options **/
  customOptions?: CountryOption[];
};

/**
 * @deprecated Use InputCountry instead
 */
class InputTypeCountry extends Component<InputTypeCountryProps> {
  static defaultProps = { name: 'country', customOptions: [], fontSize: '14px' };

  constructor(props: InputTypeCountryProps) {
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

  countryNames: ReturnType<typeof getIntlDisplayNames>;

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
    // `getOptions` only takes the locale; the `defaultValue` argument it used to receive was ignored
    return (
      <StyledSelect
        name={name}
        inputId={inputId}
        minWidth={150}
        options={this.getOptions(locale || intl.locale)}
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

// `injectIntl` only types the injected `intl` prop; the class' own props (and `defaultProps`) are kept as-is
export default injectIntl(InputTypeCountry as React.ComponentType<{ intl?: IntlShape }>);
