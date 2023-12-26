import React from 'react';
import { get, isUndefined, pick, remove, size, throttle } from 'lodash';
import { ChevronDown, Sparkles } from 'lucide-react';
import { defineMessages, FormattedMessage, IntlShape, useIntl } from 'react-intl';

import { Account, AccountingCategory, Expense, ExpenseType, Host } from '../../lib/graphql/types/v2/graphql';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import useLoggedInUser from '../../lib/hooks/useLoggedInUser';
import { fetchExpenseCategoryPredictions } from '../../lib/ml-service';
import { cn } from '../../lib/utils';

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '../ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/Popover';

type ExpenseCategorySelectProps = {
  host: Host;
  account: Account;
  expenseType: ExpenseType;
  predictionStyle?: 'full' | 'inline';
  /** If provided, these values (descriptions, items, etc...) will be used to call the prediction service */
  expenseValues?: Partial<Expense>;
  selectedCategory: AccountingCategory | undefined | null;
  valuesByRole?: Expense['valuesByRole'];
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

const SelectionRoleLabels = defineMessages({
  submitter: { id: 'accountingCategory.submitter', defaultMessage: 'the expense submitter' },
  accountAdmin: { id: 'accountingCategory.accountAdmin', defaultMessage: 'the collective admin' },
  hostAdmin: { id: 'accountingCategory.hostAdmin', defaultMessage: 'the host admin' },
});

/**
 * Returns a message to display next to the category label to show which role selected which category.
 */
const getSelectionInfoForLabel = (
  intl: IntlShape,
  category: AccountingCategory | null,
  valuesByRole: Expense['valuesByRole'],
): React.ReactNode | null => {
  const roles = ['submitter', 'accountAdmin', 'hostAdmin'];
  const rolesCategories = roles.map(field => get(valuesByRole, `${field}.accountingCategory`));
  if (!category || !rolesCategories.some(Boolean)) {
    return null;
  }

  const rolesHaveSelectedCategory = rolesCategories.map(roleCategory => isSameCategory(roleCategory, category));
  if (rolesHaveSelectedCategory.some(Boolean)) {
    const rolesToDisplay = roles.filter((_, index) => rolesHaveSelectedCategory[index]);
    return (
      <span className="ml-1 text-xs font-normal italic text-gray-500">
        {'• '}
        <FormattedMessage
          id="accountingCategory.selectedBy"
          defaultMessage="Selected by {nbRoles, select, 1 {{role1}} 2 {{role1} and {role2}} other {{role1}, {role2} and {role3}}}."
          values={{
            nbRoles: rolesToDisplay.length,
            role1: intl.formatMessage(SelectionRoleLabels[rolesToDisplay[0]]),
            role2: rolesToDisplay[1] && intl.formatMessage(SelectionRoleLabels[rolesToDisplay[1]]),
            role3: rolesToDisplay[2] && intl.formatMessage(SelectionRoleLabels[rolesToDisplay[2]]),
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
  valuesByRole: Expense['valuesByRole'],
): React.ReactNode | null => {
  if (isUndefined(category)) {
    return null;
  }

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
  const selectionInfo = getSelectionInfoForLabel(intl, category, valuesByRole);
  return (
    <React.Fragment>
      {showCode && category && <span className="mr-2 italic text-neutral-700">#{category.code}</span>}
      {categoryStr}
      {selectionInfo}
    </React.Fragment>
  );
};

/**
 * Returns true if the category is supported for the given expense type. Host admins can select any category.
 */
export const isSupportedExpenseCategory = (
  expenseType: ExpenseType,
  category: AccountingCategory,
  isHostAdmin: boolean,
) => {
  return isHostAdmin || !category?.expensesTypes || category.expensesTypes.includes(expenseType);
};

const getOptions = (
  intl: IntlShape,
  host: Host,
  expenseType: ExpenseType,
  showCode: boolean,
  allowNone: boolean,
  valuesByRole: Expense['valuesByRole'],
  isHostAdmin: boolean,
): OptionsMap => {
  const categories = [...get(host, 'accountingCategories.nodes', [])];
  const categoriesById: OptionsMap = {};

  // Show all categories to host admins, but only the ones that match the expense type to other users
  remove(categories, category => !isSupportedExpenseCategory(expenseType, category, isHostAdmin));

  categories.forEach(category => {
    categoriesById[category.id] = {
      value: category,
      label: getCategoryLabel(intl, category, showCode, valuesByRole),
      searchText: getSearchTextFromCategory(category),
    };
  });

  if (allowNone) {
    const label = getCategoryLabel(intl, null, false, valuesByRole);
    categoriesById[VALUE_NONE] = {
      value: null,
      label,
      searchText: intl.formatMessage({ defaultMessage: "I don't know" }).toLocaleLowerCase(),
    };
  }

  return categoriesById;
};

const getCleanInputData = (
  expenseValues: Partial<Expense>,
): {
  description: string;
  items: string;
  type: ExpenseType;
} => {
  const cleanStr = (str: string) => (!str ? '' : str.trim().toLocaleLowerCase());

  return {
    type: get(expenseValues, 'type'),
    description: cleanStr(get(expenseValues, 'description', '')),
    items: get(expenseValues, 'items', [])
      .map(item => cleanStr(item.description))
      .filter(Boolean)
      .join(' | '),
  };
};

/**
 * A hook that retrieves the categories predictions for a given expense, while making sure:
 * - The requests are debounced (to avoid making too many requests when typing)
 * - The requests are deduplicated (do not re-query if the parameters don't change)
 * - Errors are ignored (the UI should not break if the prediction service is down)
 */
const useExpenseCategoryPredictionService = (
  enabled: boolean,
  host: Host,
  account: Account,
  expenseValues?: Partial<Expense>,
) => {
  const { call: fetchPredictionsCall, data, loading } = useAsyncCall(fetchExpenseCategoryPredictions);
  const throttledFetchPredictions = React.useMemo(() => throttle(fetchPredictionsCall, 500), []);
  const [showPreviousPredictions, setShowPreviousPredictions] = React.useState(true);
  const inputData = !enabled ? null : getCleanInputData(expenseValues);
  const hasValidParams = Boolean(
    inputData && inputData.type && (inputData.description.length > 3 || inputData.items.length > 3),
  );

  // Trigger new fetch predictions, and hide the current ones if we don't get a response within 1s (to avoid flickering)
  React.useEffect(() => {
    if (hasValidParams) {
      const hidePredictionsTimeout = setTimeout(() => setShowPreviousPredictions(false), 1000);
      throttledFetchPredictions({ hostSlug: host.slug, accountSlug: account.slug, ...inputData }).then(() => {
        clearTimeout(hidePredictionsTimeout);
        if (showPreviousPredictions) {
          setShowPreviousPredictions(true);
        }
      });
    }
  }, [host.slug, account.slug, hasValidParams, ...Object.values(inputData || {})]);

  // Map returned categories with known ones to build `predictions`
  const predictions = React.useMemo(() => {
    if (!hasValidParams || !data?.length) {
      return null;
    }

    const filteredData = data.filter(prediction => prediction.confidence >= 0.1);
    const hostCategories = get(host, 'accountingCategories.nodes', []);
    const getHostCategoryFromCode = code => hostCategories.find(category => category.code === code);
    const mappedData = filteredData.map(prediction => getHostCategoryFromCode(prediction.code));
    return mappedData.filter(Boolean);
  }, [hasValidParams, data]);

  // Store previous predictions to keep showing them while loading
  const previousPredictions = React.useRef(predictions);
  React.useEffect(() => {
    if (predictions) {
      previousPredictions.current = predictions;
    }
  }, [predictions]);

  return { loading, predictions: predictions || (showPreviousPredictions && previousPredictions.current) || [] };
};

const ExpenseCategorySelect = ({
  host,
  account,
  expenseType,
  selectedCategory,
  valuesByRole,
  predictionStyle,
  onChange,
  id,
  error,
  allowNone = false,
  showCode = false,
  expenseValues = undefined,
  children,
}: ExpenseCategorySelectProps) => {
  const intl = useIntl();
  const [isOpen, setOpen] = React.useState(false);
  const { LoggedInUser } = useLoggedInUser();
  const isHostAdmin = Boolean(LoggedInUser?.isAdminOfCollective(host));
  const usePredictions = host.slug === 'foundation' && (predictionStyle === 'full' || isOpen);
  const { predictions } = useExpenseCategoryPredictionService(usePredictions, host, account, expenseValues);
  const hasPredictions = Boolean(predictions?.length);
  const options = React.useMemo(
    () => getOptions(intl, host, expenseType, showCode, allowNone, valuesByRole, isHostAdmin),
    [host, expenseType, allowNone, showCode, valuesByRole, isHostAdmin],
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
              <span
                className={cn('mr-3 max-w-[328px] truncate text-sm', {
                  'text-gray-400': isUndefined(selectedCategory),
                })}
              >
                {getCategoryLabel(intl, selectedCategory, false, valuesByRole) ||
                  intl.formatMessage({ defaultMessage: 'Select category' })}
              </span>
              <ChevronDown size="1em" />
            </button>
          )}
        </PopoverTrigger>
        <PopoverContent className="z-[5000] w-[320px] p-0">
          <Command filter={(categoryId, search) => (options[categoryId]?.searchText.includes(search) ? 1 : 0)}>
            {size(options) > 6 && <CommandInput placeholder="Filter by name" />}
            <CommandEmpty>
              <FormattedMessage defaultMessage="No category found" />
            </CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-y-auto">
              {Object.entries(options).map(([categoryId, { label }]) => {
                const isSelected = selectedCategory?.id === categoryId;
                const isPrediction = predictions?.some(prediction => prediction.id === categoryId);
                return (
                  <React.Fragment key={categoryId}>
                    <CommandItem
                      value={categoryId}
                      className={cn('block p-3 text-xs', { 'font-semibold': isSelected })}
                      onSelect={categoryId => {
                        onChange(options[categoryId].value);
                        setOpen(false);
                      }}
                    >
                      <div className="flex justify-between">
                        <span
                          className={
                            // If there are predictions, grey out the categories that are not selected or predicted
                            isSelected || isPrediction || !hasPredictions ? 'text-neutral-900' : 'text-gray-600'
                          }
                        >
                          {label}
                        </span>
                        {isPrediction && (
                          <span
                            className="text-right text-xs text-gray-500"
                            title={intl.formatMessage({ defaultMessage: 'Suggested' })}
                          >
                            <Sparkles size={16} className="mr-1 inline-block text-yellow-500" strokeWidth={1.5} />
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  </React.Fragment>
                );
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {usePredictions && predictionStyle === 'full' && (
        <div className="mt-2 min-h-[33px] text-xs text-gray-700">
          {hasPredictions && (
            <div>
              <Sparkles size={16} className=" mr-1 inline-block text-yellow-500" strokeWidth={1.5} />
              <FormattedMessage
                defaultMessage="Suggested: {suggestions}"
                values={{
                  suggestions: predictions.slice(0, 3).map((prediction, index) => (
                    <React.Fragment key={prediction.code}>
                      <span
                        tabIndex={0}
                        role="button"
                        onKeyDown={e => e.key === 'Enter' && onChange(prediction)}
                        onClick={() => onChange(prediction)}
                        className="cursor-pointer text-[--primary-color-600] underline hover:opacity-80"
                        aria-label={intl.formatMessage({ defaultMessage: 'Select {name}' }, { name: prediction.name })}
                      >
                        {prediction.name}
                      </span>
                      {index < Math.min(predictions.length, 3) - 1 ? ', ' : '.'}
                    </React.Fragment>
                  )),
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseCategorySelect;
