import React from 'react';
import { get, isUndefined, pick, size } from 'lodash';
import { ChevronDown } from 'lucide-react';
import { FormattedMessage, IntlShape, useIntl } from 'react-intl';

import { AccountingCategory, Host } from '../../lib/graphql/types/v2/graphql';
import { cn } from '../../lib/utils';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';
import { Separator } from '../ui/Separator';

type ExpenseCategorySelectProps = {
  host: Host;
  selectedCategory: AccountingCategory | undefined | null;
  onChange: (category: AccountingCategory) => void;
  allowNone?: boolean;
  id?: string;
  error?: boolean;
  children?: React.ReactNode;
};

const VALUE_NONE = '__none__';

type OptionsMap = {
  [key in string | typeof VALUE_NONE]?: {
    value: AccountingCategory | null;
    searchText: string;
    label: string;
  };
};

const getSearchTextFromCategory = (category: AccountingCategory) => {
  return Object.values(pick(category, ['name', 'friendlyName', 'code']))
    .join(' ')
    .toLocaleLowerCase();
};

const getCategoryLabel = (intl: IntlShape, category: AccountingCategory) => {
  if (category === null) {
    return intl.formatMessage({ defaultMessage: "I don't know" });
  } else if (category) {
    return category.friendlyName || category.name;
  }
};

const getOptions = (intl: IntlShape, host: Host, allowNone: boolean) => {
  const hostCategories = get(host, 'accountingCategories.nodes', []);
  const categoriesById: OptionsMap = {};

  hostCategories.forEach(category => {
    categoriesById[category.id] = {
      value: category,
      label: getCategoryLabel(intl, category),
      searchText: getSearchTextFromCategory(category),
    };
  });

  if (allowNone) {
    const label = getCategoryLabel(intl, null);
    categoriesById[VALUE_NONE] = {
      value: null,
      label,
      searchText: label.toLocaleLowerCase(),
    };
  }

  return categoriesById;
};

const ExpenseCategorySelect = ({
  host,
  selectedCategory,
  onChange,
  id,
  error,
  allowNone = false,
  children,
}: ExpenseCategorySelectProps) => {
  const intl = useIntl();
  const options = React.useMemo(() => getOptions(intl, host, allowNone), [host, allowNone]);
  const [isOpen, setOpen] = React.useState(false);
  return (
    <div>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {children || (
            <button
              id={id}
              className={cn('flex w-full items-center justify-between rounded-lg border px-3 py-2', {
                'border-red-500': error,
                'border-gray-300': !error,
              })}
            >
              <span className={cn('mr-3 max-w-[328px]  truncate', { 'text-gray-400': isUndefined(selectedCategory) })}>
                {getCategoryLabel(intl, selectedCategory) || intl.formatMessage({ defaultMessage: 'Select category' })}
              </span>
              <ChevronDown size="1em" />
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent className="z-[5000] w-[320px] p-0">
          <Command filter={(categoryId, search) => (options[categoryId].searchText.includes(search) ? 1 : 0)}>
            {size(options) > 10 && <CommandInput placeholder="Filter by name" />}
            <CommandEmpty>
              <FormattedMessage defaultMessage="No category found" />
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {Object.entries(options).map(([categoryId, { label }], idx) => (
                <React.Fragment key={categoryId}>
                  <CommandItem
                    value={categoryId}
                    className={cn('p-3 text-sm', { 'font-semibold': selectedCategory?.id === categoryId })}
                    onSelect={categoryId => {
                      onChange(options[categoryId].value);
                      setOpen(false);
                    }}
                  >
                    {label}
                  </CommandItem>
                  {idx < size(options) - 1 && <Separator className="mx-2 my-1 bg-neutral-100" />}
                </React.Fragment>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default ExpenseCategorySelect;
