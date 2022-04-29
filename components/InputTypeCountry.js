import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { countryData, getEmojiByCountryCode } from 'country-currency-emoji-flags';
import { isUndefined, orderBy } from 'lodash';
import memoizeOne from 'memoize-one';
import { FormattedMessage, injectIntl } from 'react-intl';

import fetchGeoLocation from '../lib/geolocation_api';
import { getIntlDisplayNames } from '../lib/i18n';

import { Flex } from './Grid';
import StyledSelect from './StyledSelect';
import { Span } from './Text';

class InputTypeCountry extends Component {
  static propTypes = {
    /** The id of the search input */
    inputId: PropTypes.string.isRequired,
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
    /** Custom options **/
    customOptions: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.node,
        value: PropTypes.any,
      }),
    ),
  };

  static defaultProps = { name: 'country', customOptions: [] };

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
      <Flex fontSize="14px" lineHeight="20px" fontWeight="500" title={countryName}>
        {emoji && <Span>{emoji}</Span>}
        &nbsp;&nbsp;
        <Span color="black.800">{countryName}</Span>
      </Flex>
    );
  }

  getCountryParts = countryString => {
    if (!countryString) {
      return null;
    } else if (countryString === 'ALL') {
      return 'ALL';
    } else {
      return countryString.split('-');
    }
  };

  getOptions = memoizeOne(locale => {
    const options = Object.keys(countryData).map(code => {
      const countryName = this.countryNames.of(code);
      return {
        value: `${countryName}-${code}`,
        label: this.generateCountryLabel(locale, code),
      };
    });

    return [...this.props.customOptions, ...orderBy(options, 'label')];
  });

  getSelectedOption = memoizeOne((locale, countryString) => {
    const countryParts = this.getCountryParts(countryString);
    if (!countryParts) {
      return null;
    }

    const customOption = this.props.customOptions.find(customOption => customOption.value === countryParts[0]);
    return (
      customOption || {
        value: `${countryParts[0]}-${countryParts[1]}`,
        label: this.generateCountryLabel(locale, countryParts[1]),
      }
    );
  });

  render() {
    const { defaultValue, value, intl, onChange, locale, name, inputId, ...props } = this.props;
    return (
      <StyledSelect
        name={name}
        inputId={inputId}
        minWidth={150}
        options={this.getOptions(locale || intl.locale)}
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
