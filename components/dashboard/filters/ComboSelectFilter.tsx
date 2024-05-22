import React from 'react';
import clsx from 'clsx';
import { isUndefined, uniqBy } from 'lodash';
import { CheckIcon, PlusIcon } from 'lucide-react';
import { FormattedMessage, IntlShape, MessageDescriptor, useIntl } from 'react-intl';
import { z } from 'zod';

import { FilterConfig } from '../../../lib/filters/filter-types';
import useDebouncedSearch from '../../../lib/hooks/useDebouncedSearch';
import { sortSelectOptions } from '../../../lib/utils';

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
} from '../../ui/Command';

const SelectItem = ({
  isSelected,
  value,
  label,
  onSelect,
  valueRenderer,
  keywords,
}: {
  isSelected: boolean;
  value: any;
  label?: React.ReactNode;
  onSelect: (value: any) => void;
  valueRenderer?: ({
    intl,
    value,
    meta,
  }: {
    intl: IntlShape;
    value: string;
    meta: Record<string, any>;
  }) => React.ReactNode | string;
  keywords?: string[];
}) => {
  const intl = useIntl();

  if (!label && valueRenderer) {
    label = valueRenderer({ intl, value, meta: { inOptionsList: true } });
  }

  if (typeof label === 'string' && !keywords) {
    keywords = [label];
  }
  return (
    <CommandItem
      onSelect={() => onSelect(value)}
      className="h-8 py-0"
      value={value}
      keywords={keywords}
      data-cy={'combo-select-option'}
    >
      <div
        className={clsx(
          'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
          isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible',
        )}
      >
        <CheckIcon className={'h-4 w-4'} />
      </div>

      <div className="truncate">{label ?? String(value)}</div>
    </CommandItem>
  );
};

function getSelectItems({ input, selected, options, creatable, isCreatableOrAsync }) {
  let items = [];

  // If creatable, add input unless it is already in options
  if (creatable && input) {
    items.push({
      value: input,
    });
  }

  // Handle selected fields (that are not in pre-loaded options)
  if (isCreatableOrAsync) {
    items = items.concat(
      selected
        .filter(v => !options.some(o => o.value === v)) // filter out selected values that are already in options
        .reverse() // show latest addition first to prevent jumping when adding an item
        .map(value => ({
          value: value,
        })),
    );
  }

  // Handle options not being currently input
  items = items.concat(options);

  return [{ label: undefined, options: uniqBy(items, 'value') }];
}

function ComboSelectFilter({
  value,
  isMulti = false,
  options = [],
  groupedOptions,
  onChange,
  labelMsg,
  loading,
  creatable,
  searchFunc,
  valueRenderer,
}: {
  value: any;
  isMulti?: boolean;
  selected?: string[];
  options?: { label: React.ReactNode; value: any; keywords?: string[] }[];
  groupedOptions?: { label: string; options: { label: React.ReactNode; value: any }[] }[];
  onChange: (value: any) => void;
  labelMsg?: MessageDescriptor;
  loading?: boolean;
  creatable?: boolean;
  searchFunc?: (term?: string) => void;
  valueRenderer?: ({ value }: { value: any }) => React.ReactNode;
}) {
  const intl = useIntl();
  const [input, setInput] = React.useState('');

  const selected = Array.isArray(value) ? value : !isUndefined(value) ? [value] : [];

  useDebouncedSearch(searchFunc, input, { delay: 500, noDelayEmpty: true });

  const onSelect = value => {
    const isSelected = selected.some(v => v === value);
    if (isMulti) {
      onChange(isSelected ? selected.filter(v => v !== value) : [...selected, value]);
    } else {
      onChange(isSelected ? undefined : value);
    }
  };

  const hasFilterOrSearch = Boolean(options?.length || groupedOptions?.length || searchFunc);
  const isCreatableOrAsync = creatable || Boolean(searchFunc);
  const shouldFilter = !isCreatableOrAsync;

  const selectItems = groupedOptions || getSelectItems({ options, input, selected, creatable, isCreatableOrAsync });

  return (
    <Command shouldFilter={shouldFilter}>
      <CommandInput
        autoFocus
        loading={loading}
        value={input}
        onValueChange={setInput}
        data-cy="combo-select-input"
        {...(!hasFilterOrSearch && {
          customIcon: PlusIcon,
        })}
        placeholder={
          hasFilterOrSearch
            ? labelMsg
              ? intl.formatMessage(
                  {
                    defaultMessage: 'Filter by {filterLabel}...',
                    id: 'sB/JCB',
                  },
                  { filterLabel: intl.formatMessage(labelMsg) },
                )
              : intl.formatMessage({ id: 'search.placeholder', defaultMessage: 'Search...' })
            : intl.formatMessage(labelMsg)
        }
      />

      <CommandList>
        {loading && !options.length ? (
          <CommandLoading />
        ) : (
          <CommandEmpty>
            {hasFilterOrSearch ? (
              <FormattedMessage defaultMessage="No results found." id="V5JQj+" />
            ) : (
              <FormattedMessage defaultMessage="No selection" id="Select.Placeholder" />
            )}
          </CommandEmpty>
        )}

        {selectItems
          ?.filter(group => group.options.length)
          .map((group, i) => (
            <CommandGroup key={group.label ?? i} heading={group.label}>
              {group.options.map(option => {
                const isSelected = selected.some(v => v === option.value);
                return (
                  <SelectItem
                    key={option.value}
                    isSelected={isSelected}
                    value={option.value}
                    label={option.label}
                    keywords={option.keywords}
                    valueRenderer={valueRenderer}
                    onSelect={onSelect}
                  />
                );
              })}
            </CommandGroup>
          ))}
      </CommandList>
    </Command>
  );
}

export default React.memo(ComboSelectFilter) as typeof ComboSelectFilter;

type ZodDefaultOrOptional<T extends z.ZodTypeAny> = z.ZodDefault<T> | z.ZodOptional<T>;

export function buildComboSelectFilter<
  Options extends [string, ...string[]],
  Schema extends ZodDefaultOrOptional<z.ZodEnum<Options> | z.ZodArray<z.ZodEnum<Options>>>,
>(
  schema: Schema,
  labelMsg: MessageDescriptor,
  i18nLabels: Record<z.infer<z.ZodEnum<Options>>, MessageDescriptor>,
): FilterConfig<z.infer<Schema>> {
  const schemaWithoutDefault = 'removeDefault' in schema ? schema.removeDefault() : schema.unwrap();

  const isMulti = 'element' in schemaWithoutDefault;
  const schemaEnum = isMulti ? schemaWithoutDefault.element : schemaWithoutDefault;

  return {
    schema: isMulti ? schema.or(schemaEnum.transform(val => [val])) : schema,
    filter: {
      labelMsg,
      Component: ({ intl, ...props }) => (
        <ComboSelectFilter
          isMulti={isMulti}
          options={schemaEnum.options
            .map(value => {
              const label = intl.formatMessage(i18nLabels[value]);
              return {
                value,
                label,
                keywords: [label],
              };
            })
            .sort(sortSelectOptions)}
          {...props}
        />
      ),
      valueRenderer: ({ value, intl }) => intl.formatMessage(i18nLabels[value]),
    },
  };
}
