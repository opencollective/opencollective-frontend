import React, { useCallback, useMemo, useRef, useState } from 'react';
import { getEmojiByCountryCode } from 'country-currency-emoji-flags';
import { isNil, orderBy } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import type { Location } from '../lib/graphql/types/v2/schema';
import { CountryIso } from '../lib/graphql/types/v2/schema';
import { getIntlDisplayNames } from '../lib/i18n';
import { cn } from '@/lib/utils';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/Command';
import { Select, SelectContent, SelectTrigger } from '@/components/ui/Select';

import { Span } from './Text';

type InputCountryProps = {
  value: Location['country'];
  onChange: (value: Location['country']) => void;
  disabled?: boolean;
};

const InputCountry = (props: InputCountryProps) => {
  const intl = useIntl();
  const inputRef = useRef<HTMLInputElement>(null);
  const [showSelect, setShowSelect] = useState(false);
  const openCurrencySelect = useCallback(
    open => {
      setShowSelect(open);
      if (open) {
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    },
    [inputRef],
  );

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
        country: countryNames.of(code),
        label: generateCountryLabel(code),
      };
    });
    return orderBy(options, 'country');
  }, [countryNames, generateCountryLabel]);

  return (
    <Select value={props.value} open={showSelect} onOpenChange={openCurrencySelect} disabled={props.disabled}>
      <SelectTrigger className={cn(isNil(props.value) && 'text-muted-foreground')} data-cy="country-trigger">
        {props.value ? (
          generateCountryLabel(props.value)
        ) : (
          <FormattedMessage id="InputTypeCountry.placeholder" defaultMessage="Please select your country" />
        )}
      </SelectTrigger>
      <SelectContent className="max-h-[50vh]">
        <Command>
          <CommandInput
            placeholder={intl.formatMessage({ defaultMessage: 'Search countries...', id: '37zpJw' })}
            data-cy="country-search"
            ref={inputRef}
          />
          <CommandList data-cy="country-list">
            <CommandEmpty>
              <FormattedMessage defaultMessage="No country found." id="OotY1c" />
            </CommandEmpty>
            <CommandGroup>
              {options.map(({ value, label, country }) => (
                <CommandItem
                  key={value}
                  data-cy={`country-${value}`}
                  value={value}
                  keywords={[value, country]}
                  onSelect={value => {
                    setShowSelect(false);
                    props.onChange(value);
                  }}
                >
                  <span>{label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </SelectContent>
    </Select>
  );
};

export default InputCountry;
