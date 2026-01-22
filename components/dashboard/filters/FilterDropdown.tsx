import * as React from 'react';
import { clsx } from 'clsx';
import { isEmpty, isEqual, isNil } from 'lodash';
import { Plus, X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { FilterComponentConfigs, SetFilter as SetFilterType } from '../../../lib/filters/filter-types';
import { cn } from '@/lib/utils';

import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../ui/Command';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '../../ui/Popover';
import { Separator } from '../../ui/Separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/Tooltip';

function ChooseFilterType<FV>({
  remainingFilters,
  filters,
  setFilterKey,
}: {
  remainingFilters: (keyof FV)[];
  filters: FilterComponentConfigs<FV, unknown>;
  setFilterKey: (key: keyof FV) => void;
}) {
  const intl = useIntl();
  const filterOptions = remainingFilters.map(key => ({ label: intl.formatMessage(filters[key].labelMsg), value: key }));
  return (
    <React.Fragment>
      <Command>
        <CommandInput placeholder={intl.formatMessage({ defaultMessage: 'Search filters...', id: '+JHk55' })} />
        <CommandList>
          <CommandEmpty>
            <FormattedMessage defaultMessage="No filters found." id="LJgfxS" />
          </CommandEmpty>
          <CommandGroup>
            {filterOptions.map(option => {
              return (
                <CommandItem
                  key={String(option.value)}
                  onSelect={() => {
                    setFilterKey(option.value);
                  }}
                >
                  <span>{option.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
      </Command>
    </React.Fragment>
  );
}

export function SetFilter({ tmpValue, setTmpValue, filterKey, filters, setFilter, setOpen, values, meta = {} }) {
  const intl = useIntl();
  const filterConfig = filters[filterKey];
  if (!filterConfig.Component) {
    return null;
  }
  const hasChanged = !isEqual(tmpValue, values[filterKey]);
  const isDisallowedEmpty = Boolean(filterConfig.getDisallowEmpty?.({ meta }) && isEmpty(tmpValue));

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        setFilter(filterKey, tmpValue);
        setOpen(false);
      }}
    >
      <filterConfig.Component
        intl={intl}
        value={tmpValue}
        onChange={setTmpValue}
        valueRenderer={filterConfig.valueRenderer}
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

const FilterButton = ({ filterKey, setFilter, filters, tmpValue, open, highlighted, meta, locked }) => {
  const intl = useIntl();
  const value = tmpValue;
  const arrayValue = isNil(value) ? null : Array.isArray(value) ? value : [value];
  const filterConfig = filterKey ? filters[filterKey] : null;
  const valueRenderer = filterConfig?.valueRenderer;
  const hasValue = !isNil(value);
  const isFilterWithoutComponent = filterConfig && !filterConfig.Component;
  const disallowEmpty = Boolean(filterConfig?.getDisallowEmpty?.({ meta })) || locked;

  const filterLabel = filterConfig?.labelMsg ? intl.formatMessage(filterConfig.labelMsg) : filterKey;

  const button = (
    <Button
      asChild
      variant="outline"
      size="sm"
      className={clsx(
        'group rounded-full p-0 [&:has(:focus-visible)]:ring-2 [&:has(:focus-visible)]:ring-ring [&:has(:focus-visible)]:ring-offset-2',
        (!filterKey || !open) && 'text-muted-foreground',
        isFilterWithoutComponent && 'hover:bg-default hover:text-default-foreground',
        locked && 'hover:bg-background',
      )}
      disabled={isFilterWithoutComponent}
    >
      <div>
        {hasValue &&
          (!disallowEmpty ? (
            <button
              className="group/remove h-full pl-3"
              data-cy={`remove-filter-${filterKey}`}
              tabIndex={-1}
              onClick={() => {
                setFilter(filterKey, undefined);
              }}
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
          data-cy={filterKey ? `filter-${filterKey}` : `add-filter`}
        >
          {!hasValue && (
            <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-full bg-slate-400 text-white transition-colors group-hover:bg-slate-600">
              <Plus size={12} strokeWidth={1.5} absoluteStrokeWidth />
            </div>
          )}
          {filterLabel ?? <FormattedMessage defaultMessage="Add Filter" id="Rqzsq/" />}
          {arrayValue?.length > 0 && (
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
                  arrayValue.map(value => (
                    <Badge
                      className={clsx(
                        'max-w-[256px] truncate rounded-sm px-1 font-normal',
                        highlighted && 'bg-blue-50 text-blue-700',
                      )}
                      key={JSON.stringify(value)}
                    >
                      {valueRenderer ? valueRenderer({ intl, value, meta }) : String(value)}
                    </Badge>
                  ))
                )}
              </div>
            </React.Fragment>
          )}
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
};

function FilterDropdown<FV, FM>({
  filterKey: initialFilterKey,
  remainingFilters,
  filters,
  setFilter,
  highlighted,
  meta,
  values,
  locked,
}: {
  filterKey?: keyof FV;
  remainingFilters?: (keyof FV)[];
  filters: FilterComponentConfigs<FV, FM>;
  setFilter: SetFilterType<FV>;
  highlighted?: boolean;
  meta?: FM;
  values: FV;
  locked?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [activeFilterKey, setActiveFilterKey] = React.useState(initialFilterKey);
  const currentFilterValue = values[initialFilterKey];
  const [tmpValue, setTmpValue] = React.useState(currentFilterValue);

  React.useEffect(() => {
    // Reset if the currently selected filter type is no longer available
    // (e.g., it was just applied and moved to displayed filters)
    if (activeFilterKey && remainingFilters && !remainingFilters.includes(activeFilterKey)) {
      setActiveFilterKey(initialFilterKey);
    }
    // Always sync tmpValue with the current filter value
    setTmpValue(currentFilterValue);
  }, [activeFilterKey, initialFilterKey, currentFilterValue, remainingFilters]);

  return (
    <Popover
      open={open}
      onOpenChange={open => {
        if (!locked) {
          setActiveFilterKey(initialFilterKey);
          setTmpValue(values[initialFilterKey]);
          setOpen(open);
        }
      }}
    >
      <PopoverAnchor>
        <FilterButton
          filterKey={activeFilterKey}
          filters={filters}
          tmpValue={tmpValue}
          setFilter={setFilter}
          highlighted={highlighted}
          open={open}
          meta={meta}
          locked={locked}
        />
      </PopoverAnchor>
      <PopoverContent className="w-[260px] p-0" align="start">
        {activeFilterKey ? (
          <SetFilter
            tmpValue={tmpValue}
            setTmpValue={setTmpValue}
            filters={filters}
            filterKey={activeFilterKey}
            setFilter={setFilter}
            setOpen={setOpen}
            meta={meta}
            values={values}
          />
        ) : (
          <ChooseFilterType remainingFilters={remainingFilters} filters={filters} setFilterKey={setActiveFilterKey} />
        )}
      </PopoverContent>
    </Popover>
  );
}

export default React.memo(FilterDropdown) as typeof FilterDropdown;
