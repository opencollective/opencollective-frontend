import * as React from 'react';
import { clsx } from 'clsx';
import { isEmpty, isEqual, isNil } from 'lodash';
import { Plus, X } from 'lucide-react';
import type { IntlShape } from 'react-intl';
import { FormattedMessage, useIntl } from 'react-intl';

import type { FilterComponentConfigs, SetFilter as SetFilterType } from '../../../lib/filters/filter-types';
import { cn } from '@/lib/utils';

import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../ui/Command';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '../../ui/Popover';
import { Separator } from '../../ui/Separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/Tooltip';

// ============================================================================
// Shared Components
// ============================================================================

/**
 * Renders the value badges for a filter (e.g., "2 selected" or individual value badges)
 */
function FilterValueBadges<FV, FM>({
  value,
  highlighted,
  valueRenderer,
  meta,
}: {
  value: FV[keyof FV];
  highlighted?: boolean;
  valueRenderer?: (props: { intl: IntlShape; value: unknown; meta?: FM }) => React.ReactNode;
  meta?: FM;
}) {
  const intl = useIntl();
  const arrayValue = isNil(value) ? null : Array.isArray(value) ? value : [value];

  if (!arrayValue?.length) {
    return null;
  }

  return (
    <React.Fragment>
      <Separator orientation="vertical" className="mx-2 h-4" />
      <div className="space-x-1">
        {arrayValue.length > 2 ? (
          <Badge className={clsx('rounded-sm px-1 font-normal', highlighted && 'bg-blue-50 text-blue-700')}>
            <FormattedMessage
              id="filter.noFiltersSelected"
              defaultMessage="{number} selected"
              values={{ number: arrayValue.length }}
            />
          </Badge>
        ) : (
          arrayValue.map(val => (
            <Badge
              className={clsx(
                'max-w-[256px] truncate rounded-sm px-1 font-normal',
                highlighted && 'bg-blue-50 text-blue-700',
              )}
              key={JSON.stringify(val)}
            >
              {valueRenderer ? valueRenderer({ intl, value: val, meta }) : String(val)}
            </Badge>
          ))
        )}
      </div>
    </React.Fragment>
  );
}

/**
 * The pill/button UI for a filter. Used by both FilterDropdown and AddFilterDropdown.
 */
function FilterPill<FV, FM>({
  filterKey,
  filters,
  value,
  isOpen,
  highlighted,
  meta,
  locked,
  onClear,
}: {
  filterKey?: keyof FV;
  filters: FilterComponentConfigs<FV, FM>;
  value?: FV[keyof FV];
  isOpen: boolean;
  highlighted?: boolean;
  meta?: FM;
  locked?: boolean;
  onClear?: () => void;
}) {
  const intl = useIntl();
  const filterConfig = filterKey ? filters[filterKey] : null;
  const hasValue = !isNil(value);
  const isFilterWithoutComponent = filterConfig && !filterConfig.Component;
  const canClear = hasValue && !locked && !filterConfig?.getDisallowEmpty?.({ meta });
  const filterLabel = filterConfig?.labelMsg
    ? intl.formatMessage(filterConfig.labelMsg)
    : filterKey
      ? String(filterKey)
      : null;

  const button = (
    <Button
      asChild
      variant="outline"
      size="sm"
      className={clsx(
        'group rounded-full p-0 [&:has(:focus-visible)]:ring-2 [&:has(:focus-visible)]:ring-ring [&:has(:focus-visible)]:ring-offset-2',
        (!filterKey || !isOpen) && 'text-muted-foreground',
        isFilterWithoutComponent && 'hover:bg-default hover:text-default-foreground',
        locked && 'hover:bg-background',
      )}
      disabled={isFilterWithoutComponent}
    >
      <div>
        {hasValue &&
          (canClear ? (
            <button
              className="group/remove h-full pl-3"
              data-cy={`remove-filter-${String(filterKey)}`}
              tabIndex={-1}
              onClick={onClear}
            >
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-400 text-white transition-colors group-hover/remove:bg-slate-600">
                <X size={12} strokeWidth={1.5} absoluteStrokeWidth />
              </div>
            </button>
          ) : (
            <div />
          ))}
        <PopoverTrigger
          className={cn(
            'flex h-full items-center px-3 focus:outline-hidden',
            hasValue && 'pl-2 text-foreground',
            locked && 'cursor-default text-muted-foreground',
          )}
          disabled={isFilterWithoutComponent}
          data-cy={filterKey ? `filter-${String(filterKey)}` : `add-filter`}
        >
          {!hasValue && (
            <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-full bg-slate-400 text-white transition-colors group-hover:bg-slate-600">
              <Plus size={12} strokeWidth={1.5} absoluteStrokeWidth />
            </div>
          )}
          {filterLabel ?? <FormattedMessage defaultMessage="Add Filter" id="Rqzsq/" />}
          <FilterValueBadges
            value={value}
            highlighted={highlighted}
            valueRenderer={
              'valueRenderer' in (filterConfig || {})
                ? (
                    filterConfig as {
                      valueRenderer?: (props: { intl: IntlShape; value: unknown; meta?: FM }) => React.ReactNode;
                    }
                  ).valueRenderer
                : undefined
            }
            meta={meta}
          />
        </PopoverTrigger>
      </div>
    </Button>
  );

  if (locked) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent align="start">
          <FormattedMessage
            defaultMessage="{filterLabel} can't be modified in this view"
            id="rO7VnP"
            values={{ filterLabel }}
          />
        </TooltipContent>
      </Tooltip>
    );
  }

  return button;
}

/**
 * Form for editing a filter's value with an Apply button.
 */
function FilterValueForm<FV, FM>({
  draftValue,
  setDraftValue,
  filterKey,
  filters,
  setFilter,
  setOpen,
  values,
  meta,
}: {
  draftValue: FV[keyof FV];
  setDraftValue: (value: FV[keyof FV]) => void;
  filterKey: keyof FV;
  filters: FilterComponentConfigs<FV, FM>;
  setFilter: SetFilterType<FV>;
  setOpen: (open: boolean) => void;
  values: FV;
  meta?: FM;
}) {
  const intl = useIntl();
  const filterConfig = filters[filterKey];

  if (!filterConfig?.Component) {
    return null;
  }

  const hasChanged = !isEqual(draftValue, values[filterKey]);
  const isDisallowedEmpty = Boolean(filterConfig.getDisallowEmpty?.({ meta }) && isEmpty(draftValue));

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        setFilter(filterKey, draftValue);
        setOpen(false);
      }}
    >
      <filterConfig.Component
        intl={intl}
        value={draftValue}
        onChange={setDraftValue}
        valueRenderer={'valueRenderer' in filterConfig ? filterConfig.valueRenderer : undefined}
        labelMsg={filterConfig.labelMsg}
        meta={meta}
        values={values}
      />
      <div className="border-t p-2">
        <Button
          type="submit"
          className="w-full"
          size="sm"
          disabled={!hasChanged || isDisallowedEmpty}
          data-cy="apply-filter"
        >
          <FormattedMessage id="Apply" defaultMessage="Apply" />
        </Button>
      </div>
    </form>
  );
}

/**
 * Searchable list for choosing a filter type (used by AddFilterDropdown).
 */
function FilterTypePicker<FV, FM>({
  remainingFilters,
  filters,
  onSelect,
}: {
  remainingFilters: (keyof FV)[];
  filters: FilterComponentConfigs<FV, FM>;
  onSelect: (key: keyof FV) => void;
}) {
  const intl = useIntl();
  const filterOptions = remainingFilters.map(key => ({
    label: intl.formatMessage(filters[key].labelMsg),
    value: key,
  }));

  return (
    <Command>
      <CommandInput placeholder={intl.formatMessage({ defaultMessage: 'Search filters...', id: '+JHk55' })} />
      <CommandList>
        <CommandEmpty>
          <FormattedMessage defaultMessage="No filters found." id="LJgfxS" />
        </CommandEmpty>
        <CommandGroup>
          {filterOptions.map(option => (
            <CommandItem key={String(option.value)} onSelect={() => onSelect(option.value)}>
              <span>{option.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}

// ============================================================================
// FilterDropdown - For editing an existing filter
// ============================================================================

/**
 * Dropdown for editing an existing filter's value.
 * Shows the current value as a pill and opens a popover to edit it.
 */
function FilterDropdown<FV, FM>({
  filterKey,
  filters,
  setFilter,
  highlighted,
  meta,
  values,
  locked,
}: {
  filterKey: keyof FV;
  filters: FilterComponentConfigs<FV, FM>;
  setFilter: SetFilterType<FV>;
  highlighted?: boolean;
  meta?: FM;
  values: FV;
  locked?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const appliedValue = values[filterKey];
  const [draftValue, setDraftValue] = React.useState(appliedValue);

  // Sync draft value when the applied value changes externally (e.g., URL change)
  // Only sync when popover is closed to avoid resetting user's draft mid-edit
  React.useEffect(() => {
    if (!open) {
      setDraftValue(appliedValue);
    }
  }, [appliedValue, open]);

  const handleOpenChange = (isOpen: boolean) => {
    if (locked) {
      return;
    }
    // Reset draft to applied value when opening
    if (isOpen) {
      setDraftValue(appliedValue);
    }
    setOpen(isOpen);
  };

  const handleClear = () => {
    setFilter(filterKey, undefined);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor>
        <FilterPill
          filterKey={filterKey}
          filters={filters}
          value={draftValue}
          isOpen={open}
          highlighted={highlighted}
          meta={meta}
          locked={locked}
          onClear={handleClear}
        />
      </PopoverAnchor>
      <PopoverContent className="w-[260px] p-0" align="start">
        <FilterValueForm
          draftValue={draftValue}
          setDraftValue={setDraftValue}
          filters={filters}
          filterKey={filterKey}
          setFilter={setFilter}
          setOpen={setOpen}
          meta={meta}
          values={values}
        />
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// AddFilterDropdown - For adding a new filter
// ============================================================================

/**
 * Dropdown for adding a new filter.
 * First shows a list of available filters, then shows the filter editor.
 */
export function AddFilterDropdown<FV, FM>({
  remainingFilters,
  filters,
  setFilter,
  meta,
  values,
}: {
  remainingFilters: (keyof FV)[];
  filters: FilterComponentConfigs<FV, FM>;
  setFilter: SetFilterType<FV>;
  meta?: FM;
  values: FV;
}) {
  const [open, setOpen] = React.useState(false);
  const [selectedFilterKey, setSelectedFilterKey] = React.useState<keyof FV | null>(null);
  const [draftValue, setDraftValue] = React.useState<FV[keyof FV] | undefined>(undefined);

  // Reset state when the selected filter is no longer available
  // (e.g., it was just applied and moved to displayed filters)
  React.useEffect(() => {
    if (selectedFilterKey && !remainingFilters.includes(selectedFilterKey) && !open) {
      setSelectedFilterKey(null);
      setDraftValue(undefined);
    }
  }, [selectedFilterKey, remainingFilters, open]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      // Reset state when closing
      setSelectedFilterKey(null);
      setDraftValue(undefined);
    }
    setOpen(isOpen);
  };

  const handleSelectFilterType = (key: keyof FV) => {
    setSelectedFilterKey(key);
    // Initialize draft with the current value for this filter (if any)
    setDraftValue(values[key]);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor>
        <FilterPill<FV, FM>
          filterKey={selectedFilterKey}
          filters={filters}
          value={draftValue}
          isOpen={open}
          meta={meta}
        />
      </PopoverAnchor>
      <PopoverContent className="w-[260px] p-0" align="start">
        {selectedFilterKey ? (
          <FilterValueForm
            draftValue={draftValue}
            setDraftValue={setDraftValue}
            filters={filters}
            filterKey={selectedFilterKey}
            setFilter={setFilter}
            setOpen={setOpen}
            meta={meta}
            values={values}
          />
        ) : (
          <FilterTypePicker remainingFilters={remainingFilters} filters={filters} onSelect={handleSelectFilterType} />
        )}
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Exports
// ============================================================================

// Legacy export for SetFilter (used by other components)
export { FilterValueForm as SetFilter };

export default React.memo(FilterDropdown) as typeof FilterDropdown;
