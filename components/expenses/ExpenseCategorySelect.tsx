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
  submitterCategory?: AccountingCategory;
  accountAdminCategory?: AccountingCategory;
  onChange: (category: AccountingCategory) => void;
  allowNone?: boolean;
  showCode?: boolean;
  id?: string;
  error?: boolean;
  children?: React.ReactNode;
};

const VALUE_NONE = '__none__';

type OptionsMap = {
  [key in string | typeof VALUE_NONE]?: {
    value: AccountingCategory | null;
    searchText: string;
    label: React.ReactNode;
  };
};

const getSearchTextFromCategory = (category: AccountingCategory) => {
  return Object.values(pick(category, ['name', 'friendlyName', 'code']))
    .join(' ')
    .toLocaleLowerCase();
};

/**
 * Returns true if two categories are equal, which means:
 * - They are the same object (or both are null)
 * - Or they have the same id
 * - Or they have the same code
 */
const isSameCategory = (category1: AccountingCategory | null, category2: AccountingCategory | null): boolean => {
  return category1 === category2 || category1?.id === category2?.id || category1?.code === category2?.code;
};

/**
 * Returns a message to display next to the category label to show which role selected which category.
 */
const getSelectionInfoForLabel = (
  category: AccountingCategory | null,
  submitterCategory: AccountingCategory | undefined | null,
  accountAdminCategory: AccountingCategory | undefined | null,
): React.ReactNode | null => {
  if (!submitterCategory && !accountAdminCategory) {
    return null;
  }

  const isSelectedBySubmitter = isSameCategory(category, submitterCategory);
  const isSelectedByAccountAdmin = isSameCategory(category, accountAdminCategory);
  if (isSelectedBySubmitter || isSelectedByAccountAdmin) {
    return (
      <span className="ml-1 text-xs font-normal italic text-gray-700">
        {'• '}
        <FormattedMessage
          id="accountingCategory.selectedBy"
          defaultMessage="Selected by {isSelectedBySubmitter, select, true {submitter} other {}}{hasBoth, select, true { and } other {}}{isSelectedByAccountAdmin, select, true {collective admin} other {}}"
          values={{
            isSelectedBySubmitter,
            isSelectedByAccountAdmin,
            hasBoth: isSelectedBySubmitter && isSelectedByAccountAdmin,
          }}
        />
      </span>
    );
  } else {
    return null;
  }
};

const getCategoryLabel = (
  intl: IntlShape,
  category: AccountingCategory,
  showCode: boolean,
  submitterCategory: AccountingCategory | null,
  accountAdminCategory: AccountingCategory | null,
): React.ReactNode => {
  // Get category label
  let categoryStr;
  if (category === null) {
    categoryStr = intl.formatMessage({ defaultMessage: "I don't know" });
  } else if (category) {
    categoryStr =
      category.friendlyName ||
      category.name ||
      intl.formatMessage({ id: 'accountingCategory.doNotKnow', defaultMessage: 'Unknown category' });
  }

  // Add selection info
  const selectionInfo = getSelectionInfoForLabel(category, submitterCategory, accountAdminCategory);
  return (
    <React.Fragment>
      {showCode && <span className="mr-2 italic text-neutral-700">#{category.code}</span>}
      {categoryStr}
      {selectionInfo}
    </React.Fragment>
  );
};

const getOptions = (
  intl: IntlShape,
  host: Host,
  showCode: boolean,
  allowNone: boolean,
  submitterCategory: AccountingCategory | null,
  accountAdminCategory: AccountingCategory | null,
): OptionsMap => {
  const hostCategories = get(host, 'accountingCategories.nodes', []);
  const categoriesById: OptionsMap = {};

  hostCategories.forEach(category => {
    categoriesById[category.id] = {
      value: category,
      label: getCategoryLabel(intl, category, showCode, submitterCategory, accountAdminCategory),
      searchText: getSearchTextFromCategory(category),
    };
  });

  if (allowNone) {
    const label = getCategoryLabel(intl, null, false, submitterCategory, accountAdminCategory);
    categoriesById[VALUE_NONE] = {
      value: null,
      label,
      searchText: intl.formatMessage({ defaultMessage: "I don't know" }).toLocaleLowerCase(),
    };
  }

  return categoriesById;
};

const ExpenseCategorySelect = ({
  host,
  selectedCategory,
  submitterCategory,
  accountAdminCategory,
  onChange,
  id,
  error,
  allowNone = false,
  showCode = false,
  children,
}: ExpenseCategorySelectProps) => {
  const intl = useIntl();
  const [isOpen, setOpen] = React.useState(false);
  const options = React.useMemo(
    () => getOptions(intl, host, showCode, allowNone, submitterCategory, accountAdminCategory),
    [host, allowNone, showCode, submitterCategory, accountAdminCategory],
  );

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
                {getCategoryLabel(intl, selectedCategory, showCode, submitterCategory, accountAdminCategory) ||
                  intl.formatMessage({ defaultMessage: 'Select category' })}
              </span>
              <ChevronDown size="1em" />
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent className="z-[5000] w-[320px] p-0">
          <Command filter={(categoryId, search) => (options[categoryId].searchText.includes(search) ? 1 : 0)}>
            {size(options) > 6 && <CommandInput placeholder="Filter by name" />}
            <CommandEmpty>
              <FormattedMessage defaultMessage="No category found" />
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {Object.entries(options).map(([categoryId, { label }], idx) => (
                <React.Fragment key={categoryId}>
                  <CommandItem
                    value={categoryId}
                    className={cn('block p-3 text-xs', { 'font-semibold': selectedCategory?.id === categoryId })}
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
