import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import timezones from '@/lib/constants/timezones';

import { ComboSelect } from './ComboSelect';

type TimezonePickerProps = {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  ['data-cy']?: string;
};

export function TimezonePicker(props: TimezonePickerProps) {
  const intl = useIntl();
  const timezoneOptions = React.useMemo(
    () =>
      timezones.map(tz => ({
        label: tz.replace('_', ' '),
        value: tz,
      })),
    [],
  );

  const noOptions = React.useMemo(() => <FormattedMessage defaultMessage="No timezone found." id="GTBZLL" />, []);

  return (
    <ComboSelect
      data-cy={props['data-cy']}
      inputPlaceholder={intl.formatMessage({ defaultMessage: 'Search timezones...', id: 'VzPJtr' })}
      placeholder={intl.formatMessage({
        defaultMessage: 'Select timezone',
        id: 'collective.timezone.placeholder',
      })}
      value={props.value}
      disabled={props.disabled}
      onChange={props.onChange}
      isSearchable
      noOptions={noOptions}
      options={timezoneOptions}
    />
  );
}
