import React, { useCallback, useMemo } from 'react';
import { getEmojiByCountryCode } from 'country-currency-emoji-flags';
import { orderBy } from 'lodash';
import { useIntl } from 'react-intl';

import type { Location } from '../lib/graphql/types/v2/schema';
import { CountryIso } from '../lib/graphql/types/v2/schema';
import { getIntlDisplayNames } from '../lib/i18n';

import { ComboSelect } from './ComboSelect';
import { Span } from './Text';

type InputCountryProps = {
  value: Location['country'];
  onChange: (value: Location['country']) => void;
  disabled?: boolean;
};

const InputCountry = (props: InputCountryProps) => {
  const intl = useIntl();
  const countryNames = useMemo(() => getIntlDisplayNames(intl.locale, 'region'), [intl.locale]);

  const generateCountryLabel = useCallback(
    countryCode => {
      const countryName = countryNames.of(countryCode);
      const emoji = getEmojiByCountryCode(countryCode);
      return (
        <div title={countryName}>
          {emoji && <Span>{emoji}</Span>}
          &nbsp;&nbsp;
          <Span color="black.800">{countryName}</Span>
        </div>
      );
    },
    [countryNames],
  );

  const options = useMemo(() => {
    const options = Object.keys(CountryIso).map(code => {
      return {
        value: code,
        label: generateCountryLabel(code),
        country: countryNames.of(code),
        keywords: [code, countryNames.of(code)],
      };
    });
    return orderBy(options, 'country');
  }, [countryNames, generateCountryLabel]);

  const { onChange: onChangeCallback } = props;
  const onChange = React.useCallback(
    value => {
      onChangeCallback(value);
    },
    [onChangeCallback],
  );

  return (
    <ComboSelect
      inputPlaceholder={intl.formatMessage({ defaultMessage: 'Search countries...', id: '37zpJw' })}
      placeholder={intl.formatMessage({
        defaultMessage: 'Please select your country',
        id: 'InputTypeCountry.placeholder',
      })}
      value={props.value}
      disabled={props.disabled}
      onChange={onChange}
      isSearchable
      options={options}
    />
  );
};

export default InputCountry;
