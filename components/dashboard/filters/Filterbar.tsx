import React from 'react';
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

export function Filterbar<FV extends Record<string, any>, FM>({
  values,
  filters,
  views,
  setFilter,
  resetFilters,
  meta,
  activeViewId,
  defaultSchemaValues,
  className,
  hideSeparator,
}: {
  values: FV;
  filters: FilterComponentConfigs<FV, FM>;
  views?: Views<FV>;
  resetFilters?: resetFilters<FV>;
  setFilter: SetFilter<FV>;
  meta?: FM;
  activeViewId?: string;
  defaultSchemaValues?: Partial<FV>;
  className?: string;
  hideSeparator?: boolean;
}) {
  const intl = useIntl();
  const { displayedFilters, remainingFilters } = useGetFilterbarOptions(filters, values, defaultSchemaValues, meta);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {views ? (
        <Tabs
          tabs={views}
          selectedId={activeViewId}
          onChange={id => {
            const view = views.find(v => v.id === id);
            if (view) {
              resetFilters(view.filter);
            }
          }}
        />
      ) : (
        !hideSeparator && <Separator />
      )}
      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {displayedFilters.map(key => {
            const filter = filters[key];
            if (filter.StandaloneComponent) {
              return (
                <filter.StandaloneComponent
                  key={key}
                  value={values[key]}
                  labelMsg={filter.labelMsg}
                  onChange={val => setFilter(key, val)}
                  isViewActive={!!activeViewId}
                  intl={intl}
                />
              );
            }
            return (
              <FilterDropdown
                key={key}
                filterKey={key}
                values={values}
                filters={filters}
                setFilter={setFilter}
                isViewActive={!!activeViewId}
                meta={meta}
              />
            );
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
        {filters.orderBy && (
          <div className="flex w-full flex-1 justify-end">
            <filters.orderBy.StandaloneComponent
              onChange={value => setFilter('orderBy', value)}
              value={values.orderBy}
              intl={intl}
            />
          </div>
        )}
      </div>
    </div>
  );
}
