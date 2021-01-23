import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { themeGet } from '@styled-system/theme-get';
import { get } from 'lodash';
import Geosuggest from 'react-geosuggest';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Location from './Location';
import MessageBox from './MessageBox';

const GeoSuggestItem = styled(Geosuggest)`
  .geosuggest {
    font-size: 18px;
    font-size: 1rem;
    position: relative;
    text-align: left;
  }
  .geosuggest__input {
    min-height: 36px;
    border: 1px solid #dcdee0;
    border-color: #dcdee0;
    border-radius: 4px;
    color: #313233;
    overflow: scroll;
    max-height: 100%;
    min-width: 0;
    width: 100%;
    flex: 1 1 auto;
    font-size: 14px;
    line-height: 1.5;
    overflow: scroll;
    padding-top: 0;
    padding-bottom: 0;
    padding-left: 8px;
    padding-right: 8px;
    box-sizing: border-box;
    outline: none;
    background-color: #ffffff;
    border-color: ${themeGet('colors.black.300')};
    box-sizing: border-box;
    &:disabled {
      background-color: ${themeGet('colors.black.50')};
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      border-color: ${themeGet('colors.primary.300')};
    }

    &:focus:not(:disabled) {
      border-color: ${themeGet('colors.primary.500')};
    }

    &::placeholder {
      color: ${themeGet('colors.black.400')};
    }
  }
  .geosuggest__suggests {
    top: 100%;
    left: 0;
    right: 0;
    max-height: 25em;
    padding: 0;
    margin-top: -2px;
    background: #fff;
    border: 1px solid #267dc0;
    border-top-width: 0;
    overflow-x: hidden;
    overflow-y: auto;
    list-style: none;
    z-index: 5;
    -webkit-transition: max-height 0.2s, border 0.2s;
    transition: max-height 0.2s, border 0.2s;
  }
  .geosuggest__suggests--hidden {
    max-height: 0;
    overflow: hidden;
    border-width: 0;
  }

  /**
  * A geosuggest item
  */
  .geosuggest__item {
    font-size: 18px;
    font-size: 1rem;
    padding: 0.5em 0.65em;
    cursor: pointer;
  }
  .geosuggest__item:hover,
  .geosuggest__item:focus {
    background: #f5f5f5;
  }
  .geosuggest__item--active {
    background: #267dc0;
    color: #fff;
  }
  .geosuggest__item--active:hover,
  .geosuggest__item--active:focus {
    background: #ccc;
  }
`;

class InputTypeLocation extends React.Component {
  static propTypes = {
    value: PropTypes.object,
    className: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    options: PropTypes.object,
    placeholder: PropTypes.string,
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.state = { value: props.value || {} };
  }

  componentDidUpdate(prevProps) {
    if (this.props.value !== prevProps.value) {
      this.setState({ value: this.props.value });
    }
  }

  removeCountryFromAddress(address) {
    return address.split(', ').slice(0, -1).join(', ');
  }

  handleChange(value) {
    if (!value) {
      this.setState({ value: {} });
      return this.props.onChange({});
    }

    const countryComponent = value.gmaps['address_components'].find(c => c.types.includes('country'));
    const location = {
      // Remove country from address
      address: this.removeCountryFromAddress(value.gmaps.formatted_address),
      // Keep only the first part for location name
      name: value.label && value.label.replace(/,.+/, ''),
      // Normally returned addresses always have a country, this is just defensive
      country: countryComponent ? countryComponent['short_name'] : null,
      lat: value.location.lat,
      long: value.location.lng,
    };

    this.setState({ value: location });
    return this.props.onChange(location);
  }

  isAutocompleteServiceAvailable() {
    return window && Boolean(get(window, 'google.maps.places.AutocompleteService'));
  }

  render() {
    const options = this.props.options || {};
    const autoCompleteNotAvailable = !this.isAutocompleteServiceAvailable();

    return (
      <div>
        {autoCompleteNotAvailable ? (
          <MessageBox withIcon type="warning">
            <FormattedMessage
              id="location.googleAutocompleteService.unavailable"
              values={{ service: 'Google Autocomplete Service', domain: 'maps.googleapis.com' }}
              defaultMessage={'Location field requires "{service}" to function.\n Make sure "{domain}" is not blocked.'}
            />
          </MessageBox>
        ) : (
          <Fragment>
            <GeoSuggestItem
              onSuggestSelect={event => this.handleChange(event)}
              placeholder={this.props.placeholder}
              {...options}
            />
            <Location location={this.state.value} showTitle={false} />
          </Fragment>
        )}
      </div>
    );
  }
}

export default InputTypeLocation;
