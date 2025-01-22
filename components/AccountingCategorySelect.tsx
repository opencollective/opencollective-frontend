import React from 'react';
import { get, isUndefined, pick, remove, size, throttle, uniq } from 'lodash';
import { Check, ChevronDown, Sparkles } from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import type { Account, AccountingCategory, Expense, ExpenseType, Host } from '../lib/graphql/types/v2/schema';
import { AccountingCategoryAppliesTo, AccountingCategoryKind } from '../lib/graphql/types/v2/schema';
import { useAsyncCall } from '../lib/hooks/useAsyncCall';
import useLoggedInUser from '../lib/hooks/useLoggedInUser';
import { fetchExpenseCategoryPredictions } from '../lib/ml-service';
import { cn } from '../lib/utils';
import { ACCOUNTING_CATEGORY_HOST_FIELDS } from './expenses/lib/accounting-categories';
import { isSameAccount } from '@/lib/collective';

import { Button } from './ui/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/Command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/Popover';

type RequiredHostFields = Pick<Host, 'id' | 'slug' | 'type'> & {
  [K in (typeof ACCOUNTING_CATEGORY_HOST_FIELDS)[number]]?: { nodes: RequiredAccountingCategoryFields[] };
};

type RequiredAccountingCategoryFields = Pick<AccountingCategory, 'id' | 'name' | 'code' | 'kind'>;

type AccountingCategorySelectProps = {
  host: RequiredHostFields;
  /** The account holding the expense. Only used when using the prediction service */
  account?: { id: Account['id']; slug: Account['slug']; parent?: { id: Account['id'] } };
  kind: AccountingCategoryKind | `${AccountingCategoryKind}`;
  /** If `kind` is `EXPENSE`, the (optional) expense type is used to filter the categories */
  expenseType?: ExpenseType;
  /** If provided, these values (descriptions, items, etc...) will be used to call the prediction service */
  expenseValues?: {
    type?: Expense['type'];
    description?: Expense['description'];
    items?: Array<{ description?: string }>;
  };
  predictionStyle?: 'full' | 'inline-preload';
  selectedCategory: Pick<AccountingCategory, 'friendlyName' | 'name' | 'code' | 'id'> | undefined | null;
  valuesByRole?: Expense['valuesByRole'];
  onChange: (category: AccountingCategory) => void;
  onBlur?: () => void;
  allowNone?: boolean;
  showCode?: boolean;
  id?: string;
  error?: boolean;
  children?: React.ReactNode;
  buttonClassName?: string;
  disabled?: boolean;
  selectFirstOptionIfSingle?: boolean;
};

type AccountingCategoryOption = {
  key: string;
  value: AccountingCategory | null;
  searchText: string;
  label: React.ReactNode;
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
const isSameCategory = (
  category1: Pick<AccountingCategory, 'code' | 'id'> | null,
  category2: Pick<AccountingCategory, 'code' | 'id'> | null,
): boolean => {
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
  category: Pick<AccountingCategory, 'friendlyName' | 'name' | 'code' | 'id'> | null,
  valuesByRole: Expense['valuesByRole'] = null,
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
      <span className="text-xs font-normal italic text-muted-foreground">
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

export const getCategoryLabel = (
  intl: IntlShape,
  category: Pick<AccountingCategory, 'friendlyName' | 'name' | 'code' | 'id'>,
  showCode: boolean,
  valuesByRole: Expense['valuesByRole'] = null,
): React.ReactNode | null => {
  if (isUndefined(category)) {
    return null;
  }

  // Get category label
  let categoryStr;
  if (category === null) {
    categoryStr = intl.formatMessage({ defaultMessage: "I don't know", id: 'AkIyKO' });
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
      <div className="space-x-1.5">
        {showCode && category && <span className="text-muted-foreground">{category.code}</span>}
        <span>{categoryStr}</span>
      </div>

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
  return (
    category?.kind === AccountingCategoryKind.EXPENSE &&
    (isHostAdmin || !category?.expensesTypes || category.expensesTypes.includes(expenseType))
  );
};

const getOptions = (
  intl: IntlShape,
  host: RequiredHostFields,
  kind: AccountingCategoryKind | `${AccountingCategoryKind}`,
  expenseType: ExpenseType,
  showCode: boolean,
  allowNone: boolean,
  valuesByRole: Expense['valuesByRole'],
  isHostAdmin: boolean,
  account: Pick<Account, 'id'> & { parent?: Pick<Account, 'id'> },
): AccountingCategoryOption[] => {
  const contributionCategories = ['CONTRIBUTION', 'ADDED_FUNDS'];
  const possibleFields = ACCOUNTING_CATEGORY_HOST_FIELDS;
  const categories = uniq([...possibleFields.map(field => get(host, `${field}.nodes`, [])).flat()]);
  const options: AccountingCategoryOption[] = [];

  // Show all categories to host admins, but only the ones that match the expense type to other users
  if (kind === AccountingCategoryKind.EXPENSE) {
    remove(categories, category => !isSupportedExpenseCategory(expenseType, category, isHostAdmin));
  } else if (contributionCategories.includes(kind)) {
    remove(categories, category => !contributionCategories.includes(category.kind));
  }

  const expectedAppliesTo =
    isSameAccount(host, account) || isSameAccount(host, account?.parent)
      ? AccountingCategoryAppliesTo.HOST
      : AccountingCategoryAppliesTo.HOSTED_COLLECTIVES;

  remove(categories, category => category.appliesTo !== expectedAppliesTo);

  categories.forEach(category => {
    options.push({
      key: category.id,
      value: category,
      label: getCategoryLabel(intl, category, showCode, valuesByRole),
      searchText: getSearchTextFromCategory(category),
    });
  });

  if (allowNone) {
    const label = getCategoryLabel(intl, null, false, valuesByRole);
    options.push({
      key: null,
      value: null,
      label,
      searchText: intl.formatMessage({ defaultMessage: "I don't know", id: 'AkIyKO' }).toLocaleLowerCase(),
    });
  }

  return options;
};

const getCleanInputData = (
  expenseValues: AccountingCategorySelectProps['expenseValues'],
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
  host: RequiredHostFields,
  account: Pick<Account, 'slug'>,
  expenseValues?: AccountingCategorySelectProps['expenseValues'],
) => {
  const { call: fetchPredictionsCall, data, loading } = useAsyncCall(fetchExpenseCategoryPredictions);
  const throttledFetchPredictions = React.useMemo(() => throttle(fetchPredictionsCall, 500), []);
  const [showPreviousPredictions, setShowPreviousPredictions] = React.useState(true);
  const inputData = getCleanInputData(expenseValues);
  const hasValidParams = Boolean(
    account && enabled && inputData.type && (inputData.description.length > 3 || inputData.items.length > 3),
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
  }, [host.slug, account?.slug, hasValidParams, ...Object.values(inputData)]);

  // Map returned categories with known ones to build `predictions`
  const predictions = React.useMemo(() => {
    if (!hasValidParams || !data?.length) {
      return null;
    }

    const filteredData = data.filter(prediction => prediction.confidence >= 0.1);
    const hostCategories =
      get(host, 'accountingCategories.nodes') || get(host, 'expenseAccountingCategories.nodes') || [];
    const getHostCategoryFromCode = code => hostCategories.find(category => category.code === code);
    const mappedData = filteredData.map(prediction => getHostCategoryFromCode(prediction.code));
    return mappedData.filter(Boolean);
  }, [host, hasValidParams, data]);

  // Store previous predictions to keep showing them while loading
  const previousPredictions = React.useRef(predictions);
  React.useEffect(() => {
    if (predictions) {
      previousPredictions.current = predictions;
    }
  }, [predictions]);

  return { loading, predictions: predictions || (showPreviousPredictions && previousPredictions.current) || [] };
};

const hostSupportsPredictions = (host: RequiredHostFields) => ['foundation', 'opensource'].includes(host?.slug);

const shouldUsePredictions = (
  host: RequiredHostFields,
  kind: string,
  predictionStyle: AccountingCategorySelectProps['predictionStyle'],
  isOpen: boolean,
  selectedCategory?: AccountingCategorySelectProps['selectedCategory'],
) => {
  if (!hostSupportsPredictions(host) || kind !== 'EXPENSE') {
    return false;
  } else if (predictionStyle === 'full') {
    return true;
  } else if (predictionStyle === 'inline-preload') {
    return !selectedCategory || isOpen; // Only preload suggestions if no category is selected
  } else if (predictionStyle === 'inline') {
    return isOpen;
  }
};

const AccountingCategorySelect = ({
  host,
  account,
  kind,
  expenseType,
  selectedCategory,
  valuesByRole,
  predictionStyle,
  onChange,
  onBlur,
  id,
  error,
  allowNone = false,
  showCode = false,
  expenseValues = undefined,
  buttonClassName = '',
  children = null,
  selectFirstOptionIfSingle,
  disabled,
}: AccountingCategorySelectProps) => {
  const intl = useIntl();
  const [isOpen, setOpen] = React.useState(false);
  const { LoggedInUser } = useLoggedInUser();
  const isHostAdmin = Boolean(LoggedInUser?.isAdminOfCollective(host));
  const usePredictions = shouldUsePredictions(host, kind, predictionStyle, isOpen, selectedCategory);
  const { predictions } = useExpenseCategoryPredictionService(usePredictions, host, account, expenseValues);
  const hasPredictions = Boolean(predictions?.length);

  const triggerChange = newCategory => {
    if (selectedCategory?.id !== newCategory?.id) {
      onChange(newCategory);
    }
  };
  const options = React.useMemo(
    () => getOptions(intl, host, kind, expenseType, showCode, allowNone, valuesByRole, isHostAdmin, account),
    [intl, host, kind, expenseType, allowNone, showCode, valuesByRole, isHostAdmin, account],
  );

  React.useEffect(() => {
    if (
      selectFirstOptionIfSingle &&
      selectedCategory === undefined &&
      options.length === 1 &&
      options[0].value !== undefined
    ) {
      onChange(options[0].value);
    }
  }, [options, selectFirstOptionIfSingle, selectedCategory, onChange]);

  const suggestedOptions = React.useMemo(() => {
    return !predictions.length
      ? []
      : options.filter(option => predictions.some(prediction => prediction.code === option.value?.code));
  }, [options, predictions]);

  const useSeparatePredictionsCommandGroup = Boolean(predictionStyle === 'inline-preload' && suggestedOptions.length);

  return (
    <div>
      <Popover open={isOpen} onOpenChange={setOpen}>
        <PopoverTrigger asChild onBlur={onBlur} disabled={disabled}>
          {children || (
            <Button
              id={id}
              variant="outline"
              className={cn(
                'w-full max-w-[300px] font-normal',
                {
                  'ring-2 ring-destructive ring-offset-2': error,
                },
                buttonClassName,
              )}
              disabled={disabled}
            >
              <span
                className={cn('mr-3 flex-grow truncate text-start text-sm', {
                  'text-gray-400': isUndefined(selectedCategory),
                })}
              >
                {getCategoryLabel(intl, selectedCategory, false, valuesByRole) ||
                  intl.formatMessage({ defaultMessage: 'Select category', id: 'RUJYth' })}
              </span>
              <ChevronDown size="1em" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent className="min-w-[280px] p-0" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command>
            {size(options) > 6 && <CommandInput placeholder="Filter by name" />}

            <CommandList>
              <CommandEmpty>
                <FormattedMessage defaultMessage="No category found" id="bn5V11" />
              </CommandEmpty>
              {useSeparatePredictionsCommandGroup && (
                <CommandGroup heading={intl.formatMessage({ defaultMessage: 'Suggested categories', id: 'ydZSPT' })}>
                  {suggestedOptions.map(({ key, label, value, searchText }) => (
                    <CommandItem
                      key={key || 'none'}
                      value={searchText}
                      onSelect={() => {
                        triggerChange(value);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-1 items-center justify-between">
                        <span>{label}</span>
                        <span
                          className="text-right text-xs text-gray-500"
                          title={intl.formatMessage({ defaultMessage: 'Suggested', id: 'a0lFbM' })}
                        >
                          <Sparkles size={16} className="mr-1 inline-block text-yellow-500" strokeWidth={1.5} />
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandGroup
                heading={
                  !useSeparatePredictionsCommandGroup
                    ? undefined
                    : intl.formatMessage({ defaultMessage: 'All Categories', id: '1X6HtI' })
                }
              >
                {options.map(({ label, key, value, searchText }) => {
                  const isSelected = selectedCategory?.id === key;
                  const isPrediction = suggestedOptions.some(option => option.key === key);
                  return (
                    <CommandItem
                      key={key || 'none'} // `CommandItem` doesn't like nil key/value
                      value={searchText}
                      onSelect={() => {
                        triggerChange(value);
                        setOpen(false);
                      }}
                    >
                      <div className="flex flex-1 items-center justify-between">
                        <span
                          className={
                            // If there are predictions, grey out the categories that are not selected or predicted
                            isSelected || isPrediction || !hasPredictions || predictionStyle === 'inline-preload'
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          }
                        >
                          {label}
                        </span>
                        <div className="flex items-center gap-1 pt-0.5">
                          {isSelected && <Check size={16} className="ml-2 inline-block" />}

                          {isPrediction && (
                            <span
                              className="text-right text-xs text-gray-500"
                              title={intl.formatMessage({ defaultMessage: 'Suggested', id: 'a0lFbM' })}
                            >
                              <Sparkles size={16} className="mr-1 inline-block text-yellow-500" strokeWidth={1.5} />
                            </span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {predictionStyle === 'full' && (
        <div className="mt-2 min-h-[33px] text-xs text-gray-700">
          {Boolean(suggestedOptions.length) && (
            <div>
              <Sparkles size={16} className="mr-1 inline-block text-yellow-500" strokeWidth={1.5} />
              <FormattedMessage
                defaultMessage="Suggested: {suggestions}"
                id="XItXfz"
                values={{
                  suggestions: suggestedOptions.slice(0, 3).map((option, index) => (
                    <React.Fragment key={option.key}>
                      <span
                        tabIndex={0}
                        role="button"
                        onKeyDown={e => e.key === 'Enter' && triggerChange(option.value)}
                        onClick={() => triggerChange(option.value)}
                        className="cursor-pointer text-[--primary-color-600] underline hover:opacity-80"
                        aria-label={intl.formatMessage(
                          { defaultMessage: 'Select {name}', id: 'G65XME' },
                          { name: option.value.name },
                        )}
                      >
                        {option.value.friendlyName || option.value.name}
                      </span>
                      {index < Math.min(suggestedOptions.length, 3) - 1 ? ', ' : '.'}
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

export default AccountingCategorySelect;
