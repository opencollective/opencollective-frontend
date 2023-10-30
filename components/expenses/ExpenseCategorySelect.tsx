import React from 'react';
import { isUndefined } from 'lodash';
import { IntlShape, useIntl } from 'react-intl';

import { AccountingCategory, Host } from '../../lib/graphql/types/v2/graphql';
import { cn } from '../../lib/utils';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';

type ExpenseCategorySelectProps = {
  host: Host;
  selectedCategory: AccountingCategory | undefined | null;
  onChange: (category: AccountingCategory) => void;
  allowNone?: boolean;
  required?: boolean;
  id?: string;
};

const getOptions = (intl: IntlShape, host: Host, allowNone: boolean) => {
  const options =
    host?.accountingCategories?.nodes?.map(category => ({
      value: category.id,
      label: category.friendlyName || category.name,
      category,
    })) || [];

  if (allowNone) {
    options.push({
      value: null,
      label: intl.formatMessage({ id: 'AccountingCategory.DoNotKnow', defaultMessage: "I don't know" }),
      category: null,
    });
  }

  return options;
};

const ExpenseCategorySelect = ({
  host,
  selectedCategory,
  onChange,
  id,
  required,
  allowNone = false,
}: ExpenseCategorySelectProps) => {
  const intl = useIntl();
  const options = React.useMemo(() => getOptions(intl, host, allowNone), [host, allowNone]);
  const value = isUndefined(selectedCategory) ? undefined : selectedCategory?.id || null;
  return (
    <Select
      disabled={!options.length}
      required={required && isUndefined(selectedCategory)}
      value={value}
      onValueChange={categoryId => onChange(options.find(option => option.value === categoryId)?.category || null)}
    >
      <SelectTrigger id={id}>
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={cn('truncate', { 'text-gray-400': isUndefined(selectedCategory) })}>
            <SelectValue
              aria-label={selectedCategory?.friendlyName || selectedCategory?.name}
              placeholder={intl.formatMessage({ defaultMessage: 'Select category' })}
            />
          </span>
        </div>
      </SelectTrigger>
      <SelectContent className="relative max-h-80 max-w-full">
        {options.map(option => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex max-w-[--radix-popper-anchor-width]  items-center gap-1">
              <span className="truncate">{option.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ExpenseCategorySelect;
