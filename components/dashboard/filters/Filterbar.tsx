import React from 'react';
import { partition } from 'lodash';
import { useIntl } from 'react-intl';

import type { FilterComponentConfigs, resetFilters, SetFilter, Views } from '../../../lib/filters/filter-types';
import { filterShouldBeInAddFilterOptions, filterShouldDisplay } from '../../../lib/filters/filter-utils';
import { cn } from '../../../lib/utils';

import Tabs from '../../Tabs';
import { Separator } from '../../ui/Separator';

import FilterDropdown from './FilterDropdown';

function useGetFilterbarOptions(filters, values, defaultSchemaValues, meta) {
  const filterKeys = Object.keys(filters);
  const [displayedFilters, setDisplayedFilters] = React.useState(
    filterKeys.filter(key => filterShouldDisplay(key, { values, filters, defaultSchemaValues, meta })),
  );
  const remainingFilters = filterKeys.filter(key =>
    filterShouldBeInAddFilterOptions(key, { values, filters, defaultSchemaValues, meta }),
  );

  // When the values change, this effect makes sure to update the displayed filter keys array and maintain the order of the filters
  React.useEffect(() => {
    const updatedKeys = filterKeys.filter(key =>
      filterShouldDisplay(key, { values, filters, defaultSchemaValues, meta }),
    );
    const remainingKeys = displayedFilters.filter(key => updatedKeys.includes(key));
    const keysToAppend = updatedKeys.filter(key => !remainingKeys.includes(key));

    setDisplayedFilters([...remainingKeys, ...keysToAppend]);
  }, [values, meta]);

  return { displayedFilters, remainingFilters };
}

const renderFilter = ({ filters, values, key, activeViewId, views, lockViewFilters, intl, meta, setFilter }) => {
  const filter = filters[key];
  const view = views?.find(v => v.id === activeViewId);
  const filterPartOfView = Boolean(view?.filter[key]);
  const highlighted = !filterPartOfView;
  const locked = lockViewFilters && filterPartOfView;

  if (!filter) {
    return null;
  } else if (filter.StandaloneComponent) {
    return (
      <filter.StandaloneComponent
        key={key}
        value={values[key]}
        labelMsg={filter.labelMsg}
        onChange={val => setFilter(key, val)}
        highlighted={highlighted}
        intl={intl}
        meta={meta}
      />
    );
  } else {
    return (
      <FilterDropdown
        key={key}
        filterKey={key}
        values={values}
        filters={filters}
        setFilter={setFilter}
        highlighted={highlighted}
        meta={meta}
        locked={locked}
      />
    );
  }
};

export function Filterbar<FV extends Record<string, any>, FM>({
  values,
  filters,
  views,
  setFilter,
  resetFilters,
  onViewChange,
  meta,
  activeViewId,
  defaultSchemaValues,
  className,
  hideSeparator,
  primaryFilters,
  primaryFilterClassName,
  lockViewFilters,
}: {
  values: FV;
  filters: FilterComponentConfigs<FV, FM>;
  views?: Views<FV>;
  resetFilters?: resetFilters<FV>;
  onViewChange?: (view: Views<FV>[number]) => void;
  setFilter: SetFilter<FV>;
  meta?: FM;
  activeViewId?: string;
  defaultSchemaValues?: Partial<FV>;
  className?: string;
  hideSeparator?: boolean;
  primaryFilters?: string[];
  primaryFilterClassName?: string;
  lockViewFilters?: boolean;
}) {
  const intl = useIntl();
  const { displayedFilters, remainingFilters } = useGetFilterbarOptions(filters, values, defaultSchemaValues, meta);
  const sortFilterKey = filters.sort ? 'sort' : filters.orderBy ? 'orderBy' : null;
  const sortFilter = filters[sortFilterKey];
  const [filtersOnTop, regularFilters] = React.useMemo(() => {
    if (!primaryFilters) {
      return [[], displayedFilters];
    } else {
      return partition(displayedFilters, filterKey => primaryFilters.includes(filterKey));
    }
  }, [displayedFilters, primaryFilters]);

  const onTabChange = React.useCallback(
    id => {
      const view = views.find(v => v.id === id);
      if (view) {
        if (onViewChange) {
          onViewChange(view);
        } else {
          resetFilters(view.filter);
        }
      }
    },
    [views, onViewChange, resetFilters],
  );

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {views ? <Tabs tabs={views} selectedId={activeViewId} onChange={onTabChange} /> : !hideSeparator && <Separator />}
      {Boolean(filtersOnTop.length) && (
        <div className={cn('repeat(auto-fit, minmax(200px, 1fr)) grid gap-2 [&_input]:w-full', primaryFilterClassName)}>
          {filtersOnTop.map(key => {
            return renderFilter({ filters, values, key, activeViewId, intl, meta, setFilter, views, lockViewFilters });
          })}
          {primaryFilters.includes(sortFilterKey) && (
            <sortFilter.StandaloneComponent
              onChange={value => setFilter(sortFilterKey, value)}
              value={values[sortFilterKey]}
              intl={intl}
            />
          )}
        </div>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {regularFilters.map(key => {
            return renderFilter({ filters, values, key, activeViewId, intl, meta, setFilter, views, lockViewFilters });
          })}

          {remainingFilters.length > 0 && (
            <FilterDropdown
              filters={filters}
              values={values}
              // If last option display it directly
              {...(remainingFilters.length === 1 && {
                filterKey: remainingFilters[0],
              })}
              remainingFilters={remainingFilters}
              setFilter={setFilter}
              meta={meta}
            />
          )}
        </div>
        {sortFilterKey && !primaryFilters?.includes(sortFilterKey) && (
          <div className="flex w-full flex-1 justify-end">
            <sortFilter.StandaloneComponent
              onChange={value => setFilter(sortFilterKey, value)}
              value={values[sortFilterKey]}
              intl={intl}
            />
          </div>
        )}
      </div>
    </div>
  );
}
