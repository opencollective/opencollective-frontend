import * as React from 'react';
import clsx from 'clsx';
import { isEqual, isNil } from 'lodash';
import { Plus, X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import type { FilterComponentConfigs, SetFilter as SetFilterType } from '../../../lib/filters/filter-types';

import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../ui/Command';
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from '../../ui/Popover';
import { Separator } from '../../ui/Separator';

function ChooseFilterType<FV>({
  remainingFilters,
  filters,
  setFilterKey,
}: {
  remainingFilters: (keyof FV)[];
  filters: FilterComponentConfigs<FV, any>;
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

function SetFilter({ tmpValue, setTmpValue, filterKey, filters, setFilter, setOpen, values, meta }) {
  const intl = useIntl();
  const filterConfig = filters[filterKey];
  if (!filterConfig.Component) {
    return null;
  }
  const hasChanged = !isEqual(tmpValue, values[filterKey]);

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
      />
      <div className="border-t p-2">
        <Button type="submit" className="w-full" size="sm" disabled={!hasChanged} data-cy="apply-filter">
          <FormattedMessage id="Apply" defaultMessage="Apply" />
        </Button>
      </div>
    </form>
  );
}

const FilterButton = ({ filterKey, setFilter, filters, tmpValue, open, isViewActive, meta }) => {
  const intl = useIntl();
  const value = tmpValue;
  const arrayValue = isNil(value) ? null : Array.isArray(value) ? value : [value];
  const filterConfig = filterKey ? filters[filterKey] : null;
  const valueRenderer = filterConfig?.valueRenderer;
  const hasValue = !isNil(value);
  const isFilterWithoutComponent = filterConfig && !filterConfig.Component;
  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className={clsx(
        'group rounded-full p-0 [&:has(:focus-visible)]:ring-2 [&:has(:focus-visible)]:ring-ring [&:has(:focus-visible)]:ring-offset-2',
        (!filterKey || !open) && 'text-muted-foreground',
        isFilterWithoutComponent && 'hover:bg-default hover:text-default-foreground',
      )}
      disabled={isFilterWithoutComponent}
    >
      <div className="cursor-pointer">
        {hasValue && (
          <button
            className="group/remove h-full pl-3"
            tabIndex={-1}
            onClick={() => {
              setFilter(filterKey, undefined);
            }}
          >
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-400 text-white transition-colors group-hover/remove:bg-slate-600">
              <X size={12} strokeWidth={1.5} absoluteStrokeWidth />
            </div>
          </button>
        )}
        <PopoverTrigger
          className={clsx('flex h-full items-center px-3 focus:outline-none', hasValue && 'pl-2 text-foreground')}
          disabled={isFilterWithoutComponent}
          data-cy={filterKey ? `filter-${filterKey}` : `add-filter`}
        >
          {!hasValue && (
            <div className="mr-2 flex h-4 w-4 items-center justify-center rounded-full bg-slate-400 text-white transition-colors group-hover:bg-slate-600">
              <Plus size={12} strokeWidth={1.5} absoluteStrokeWidth />
            </div>
          )}
          {filterConfig ? (
            filterConfig.labelMsg ? (
              intl.formatMessage(filterConfig.labelMsg)
            ) : (
              filterKey
            )
          ) : (
            <FormattedMessage defaultMessage="Add Filter" id="Rqzsq/" />
          )}
          {arrayValue?.length > 0 && (
            <React.Fragment>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <div className="space-x-1">
                {arrayValue.length > 2 ? (
                  <Badge className={clsx('rounded-sm px-1 font-normal', !isViewActive && 'bg-blue-50 text-blue-700')}>
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
                        !isViewActive && 'bg-blue-50 text-blue-700',
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
};

function FilterDropdown<FV, FM>({
  filterKey: currentFilterKey,
  remainingFilters,
  filters,
  setFilter,
  isViewActive,
  meta,
  values,
}: {
  filterKey?: keyof FV;
  remainingFilters?: (keyof FV)[];
  filters: FilterComponentConfigs<FV, FM>;
  setFilter: SetFilterType<FV>;
  isViewActive?: boolean;
  meta?: FM;
  values: FV;
}) {
  const [open, setOpen] = React.useState(false);
  const [filterKey, setFilterKey] = React.useState(currentFilterKey);
  const [tmpValue, setTmpValue] = React.useState(values[currentFilterKey]);

  React.useEffect(() => {
    setFilterKey(currentFilterKey);
    setTmpValue(values[currentFilterKey]);
  }, [remainingFilters, currentFilterKey, values]);

  return (
    <Popover
      open={open}
      onOpenChange={open => {
        setFilterKey(currentFilterKey);
        setTmpValue(values[currentFilterKey]);
        setOpen(open);
      }}
    >
      <PopoverAnchor>
        <FilterButton
          filterKey={filterKey}
          filters={filters}
          tmpValue={tmpValue}
          setFilter={setFilter}
          isViewActive={isViewActive}
          open={open}
          meta={meta}
        />
      </PopoverAnchor>
      <PopoverContent className="w-[260px] p-0" align="start">
        {filterKey ? (
          <SetFilter
            tmpValue={tmpValue}
            setTmpValue={setTmpValue}
            filters={filters}
            filterKey={filterKey}
            setFilter={setFilter}
            setOpen={setOpen}
            meta={meta}
            values={values}
          />
        ) : (
          <ChooseFilterType remainingFilters={remainingFilters} filters={filters} setFilterKey={setFilterKey} />
        )}
      </PopoverContent>
    </Popover>
  );
}

export default React.memo(FilterDropdown) as typeof FilterDropdown;
