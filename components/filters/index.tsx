import React from 'react';
import { cx } from 'class-variance-authority';
import { ArrowUpDown, Filter, LayoutList, MessageSquare, MoreHorizontal, Paperclip, Table2, X } from 'lucide-react';

import OrderFilter from './OrderFilter';
import SelectFilter from './SelectFilter';
import FilterCombo, { FilterOptions } from './FilterCombo';

export default function Filters({
  query,
  filterOptions,
  orderByKey = 'orderBy',
  orderByOptions,
  onChange,
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
      <div className="flex justify-between">
        <div className="flex gap-2">
          {displayedFilters.map(filter => (
            <FilterCombo key={filter.key} filter={filter} filterOptions={filterOptions} />
          ))}
          <FilterCombo filterOptions={remainingOptions} />
        </div>
        <OrderFilter options={orderByOptions} {...getFilterProps(orderByKey)} />
      </div>
    </div>
  );
}
