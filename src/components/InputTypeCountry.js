import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { orderBy, truncate } from 'lodash';
import { countries as countriesEN } from 'i18n-iso-countries/langs/en.json';
import { countries as countriesFR } from 'i18n-iso-countries/langs/fr.json';
import { FixedSizeList } from 'react-window';

import StyledSelect from './StyledSelect';
import withIntl from '../lib/withIntl';

class InputTypeCountry extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    name: PropTypes.string,
    defaultValue: PropTypes.string,
    labelBuilder: PropTypes.func,
    /** Switch between display modes */
    mode: PropTypes.oneOf(['select', 'underlined']),
    /** From withIntl */
    intl: PropTypes.object.isRequired,
  };

  static defaultProps = {
    name: 'country',
    labelBuilder: ({ code, name }) => `${name} - ${code}`,
  };

  static sortedCountryCodes = Object.keys(countriesEN).sort();

  state = {
    error: false,
    countries: this.prepareCountryList(countriesEN),
  };

  componentDidMount() {
    this.setLocale();
  }

  componentDidUpdate(oldProps) {
    if (this.props.intl.locale !== oldProps.intl.locale) {
      this.setLocale();
    }
  }

  setLocale() {
    if (this.props.intl.locale === 'fr') {
      this.setState({ countries: this.prepareCountryList(countriesFR) });
    } else if (this.state.countries !== countriesEN) {
      this.setState({ countries: this.prepareCountryList(countriesEN) });
    }
  }

  prepareCountry(countries, code) {
    const name = truncate(countries[code] || countriesEN[code], { length: 30 });
    return { code, name };
  }

  prepareCountryList(countries) {
    const countryList = Object.keys(countries).map(code => this.prepareCountry(countries, code));
    return orderBy(countryList, 'name');
  }

  handleChange = ({ value }) => {
    if (value === null) {
      this.setState({
        error: true,
      });
    } else {
      this.setState({
        error: false,
      });
      this.props.onChange(value);
    }
  };

  ItemsListRenderer({ StyledListItem, items, selectedItem, highlightedIndex, getItemProps, children }) {
    return (
      <FixedSizeList height={150} itemCount={items.length} itemSize={32} width={300}>
        {({ index, style }) => {
          const item = items[index];
          return (
            <div style={style} key={item.key}>
              <StyledListItem
                isSelected={selectedItem && selectedItem.key === item.key}
                isHighlighted={highlightedIndex === index}
                {...getItemProps({ index, item })}
              >
                {children(item)}
              </StyledListItem>
            </div>
          );
        }}
      </FixedSizeList>
    );
  }

  render() {
    const { error, countries } = this.state;
    const { name, defaultValue, mode } = this.props;
    const defaultCountry = defaultValue && defaultValue.toUpperCase();

    return (
      <StyledSelect
        name={name}
        options={countries}
        keyGetter={({ code }) => code}
        defaultValue={defaultCountry && this.prepareCountry(countries, defaultCountry)}
        onChange={this.handleChange}
        error={error}
        mode={mode}
        ItemsListRenderer={this.ItemsListRenderer}
      >
        {({ value }) => this.props.labelBuilder(value)}
      </StyledSelect>
    );
  }
}

export default withIntl(InputTypeCountry);
