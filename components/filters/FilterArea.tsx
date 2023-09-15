import React from 'react';

import DashboardViews from '../dashboard/DashboardViews';
import { Separator } from '../ui/Separator';

import FilterCombo from './FilterCombo';
import OrderFilter from './OrderFilter';
import { FilterOptions, FilterType } from './types';

export default function FilterArea({
  query,
  filterOptions = [
    {
      key: 'searchTerm',
      static: true,
      filterType: FilterType.TEXT_INPUT,
      label: 'Search...',
    },
  ],
  orderByKey = 'orderBy',
  orderByOptions,
  onChange,
  omitMatchingParams,
  views,
}: {
  filterOptions: FilterOptions;
}) {
  const filterOptionsWithCurrentValue = filterOptions.map(option => ({
    ...option,
    value: query?.[option.key],
  }));

  const [displayedFilters, setDisplayedFilters] = React.useState(
    filterOptionsWithCurrentValue.filter(f => f.value || f.static),
  );

  const remainingOptions = filterOptionsWithCurrentValue.filter(f => !f.value && !f.static);

  React.useEffect(() => {
    const newNaiveFilters = filterOptionsWithCurrentValue.filter(f => f.value || f.static);
    const filtersToUpdate = displayedFilters
      .filter(f => newNaiveFilters.find(nf => nf.key === f.key))
      .concat(newNaiveFilters.filter(f => !displayedFilters.find(df => df.key === f.key)));
    setDisplayedFilters(filtersToUpdate.map(f => ({ ...f, value: query?.[f.key] })));
  }, [JSON.stringify(query)]);

  const generalOnChange = (newQuery: Record<string, string>) => {
    onChange({ ...query, ...newQuery });
  };
  const getFilterProps = (name, valueModifier) => ({
    inputId: `expenses-filter-${name}`,
    value: query?.[name],
    onChange: value => {
      const preparedValue = valueModifier ? valueModifier(value) : value;
      onChange({ ...query, [name]: preparedValue });
    },
  });

  return (
    <div className="">
      {views ? (
        <DashboardViews query={query} omitMatchingParams={omitMatchingParams} views={views} onChange={onChange} />
      ) : (
        <Separator className="my-4" />
      )}
      <div className="flex flex-wrap justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {displayedFilters.map(filter => (
            <FilterCombo key={filter.key} filter={filter} filterOptions={filterOptions} onChange={generalOnChange} />
          ))}
          <FilterCombo filterOptions={remainingOptions} onChange={generalOnChange} />
        </div>
        <div className="flex flex-1 justify-end">
          <OrderFilter className="ml-auto" options={orderByOptions} {...getFilterProps(orderByKey)} />
        </div>
      </div>
    </div>
  );
}
