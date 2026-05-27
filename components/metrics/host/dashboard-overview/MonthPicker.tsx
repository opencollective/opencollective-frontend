import React from 'react';
import { useIntl } from 'react-intl';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../ui/Select';

import { type MonthPeriod, recentMonths } from './helpers';

type MonthPickerProps = {
  value: MonthPeriod;
  onChange: (period: MonthPeriod) => void;
  count?: number;
};

export function MonthPicker({ value, onChange, count = 12 }: MonthPickerProps) {
  const intl = useIntl();
  const options = React.useMemo(() => recentMonths(intl, count), [intl, count]);

  return (
    <Select
      value={value.from}
      onValueChange={iso => {
        const picked = options.find(o => o.from === iso);
        if (picked) {
          onChange(picked);
        }
      }}
    >
      <SelectTrigger className="w-44">
        <SelectValue>{value.label}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map(o => (
          <SelectItem key={o.from} value={o.from}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
