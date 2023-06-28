import React from 'react';
import { isEmpty, omit, omitBy } from 'lodash';

import Tabs from '../Tabs';
import { Table2, LayoutList, Filter } from 'lucide-react';

import OrderFilter from './OrderFilter';
import FilterCombo from './DashboardFilter';
import DashboardHeader from './DashboardHeader';
// import SelectFilter from './SelectFilter';
// import { cx } from 'class-variance-authority';

const getFiltersFromQuery = filter => {
  const filterObjs = {
    status: filter.status,
    type: filter.type,
    tag: filter.tag ? (Array.isArray(filter.tag) ? filter.tag : [filter.tag]) : undefined,
    amount: filter.amount,
    payout: filter.payout,
    searchTerm: filter.searchTerm,
    'fees-structure': filter['fees-structure'],
    kind: filter.kind,
    direction: filter.direction,
    hasMissingReceipts: filter.hasMissingReceipts
      ? 'Has missing receipts'
      : filter.hasMissingReceipts === false
      ? 'Has no missing receipts'
      : undefined,
  };
  const filterArray = Object.keys(filterObjs)
    .filter(key => !!filterObjs[key])
    .flatMap(key => {
      if (key === 'tag') {
        return filterObjs[key].map(tag => ({ key, value: tag, label: 'Tag is' }));
      }
      if (key === 'amount') {
        return {
          key,
          value: filterObjs[key],
          label: 'Amount is',
        };
      }
      if (key === 'status') {
        return {
          key,
          value: filterObjs[key],
          label: 'Status is',
        };
      }
      if (key === 'payout') {
        return {
          key,
          value: filterObjs[key],
          label: 'Payout method is',
        };
      }
      if (key === 'searchTerm') {
        return {
          key,
          value: filterObjs[key],
          label: 'Search term is',
        };
      }
      if (key === 'hasMissingReceipts') {
        return {
          key,
          value: filterObjs[key],
          label: '',
        };
      }
      if (key === 'type') {
        return {
          key,
          value: filterObjs[key],
          label: 'Type is',
        };
      }
      if (key === 'kind') {
        return {
          key,
          value: filterObjs[key],
          label: 'Kind is',
        };
      }
      if (key === 'fees-structure') {
        return {
          key,
          value: filterObjs[key],
          label: 'Fee structure is',
        };
      }
      if (key === 'direction') {
        return {
          key,
          value: filterObjs[key],
          label: 'Direction is',
        };
      }

      return { key, value: filterObjs[key] };
    });
  return filterArray;
};

export default function Filters({
  title,
  query,
  filterOptions,
  views,
  onChange,
  routeParams,
  orderByKey = 'orderBy',
  orderByOptions,
}) {
  const [currentView, setView] = React.useState(views?.[0]);

  const getCurrentFilter = query => {
    return omitBy(query, (value, key) => {
      const filterOption = filterOptions.find(f => f.key === key);
      return !value || !filterOption || filterOption.noFilter === value;
    });
  };
  const filter = React.useMemo(() => getCurrentFilter(query), [query]);
  const filterArray = getFiltersFromQuery(filter || query);
  const stringifiedFilters = JSON.stringify(filter);
  React.useEffect(() => {
    const matchingView = views?.find(v => {
      return (
        Object.keys(v.query).every(key => {
          return v.query[key] == filter[key];
        }) && Object.keys(filter).every(key => v.query[key] == filter[key])
      );
    });
    setView(matchingView || null);
  }, [stringifiedFilters]);

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
      <DashboardHeader title={title} primaryAction={currentView?.actions?.[0]} secondaryActions={null} />
      <div className="pt-2 border-b bg-white w-full overflow-x-auto whitespace-nowrap ">
        {views?.length > 0 ? (
          <Tabs
            tabs={views}
            selectedId={currentView?.id}
            onChange={id => {
              const view = views.find(v => v.id === id);
              onChange(view.query);
            }}
          />
        ) : (
          <div className="h-4" />
        )}
      </div>

      <div className="flex items-end justify-between gap-2 py-4 group">
        <div className="hidden sm:flex items-center flex-wrap gap-2">
          {filterArray.map(filter => (
            <FilterCombo
              key={`${filter.key}-${filter.value}`}
              filter={filter}
              filterOptions={filterOptions}
              active={!currentView}
              onChange={newQueryParams => {
                const newQuery = omitBy(
                  { ...query, ...newQueryParams },
                  (value, key) => !value || routeParams?.includes(key),
                );
                return onChange(newQuery);
              }}
            />
          ))}

          <FilterCombo
            filterOptions={filterOptions}
            onChange={newQueryParams => onChange({ ...query, ...newQueryParams })}
          />
        </div>

        <div className="sm:hidden block">
          <button
            className={cx(
              'animate-in bg-white hover:bg-gray-50 duration-400 fade-in text-sm px-2.5 py-1.5 rounded-md  flex items-center flex-nowrap gap-1  font-medium ring-1  ring-gray-300 hover:shadow transition-all',
              filterArray.length ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900',
            )}
          >
            <Filter size={16} className="text-gray-400" />
            <span>{filterArray.length ? `${filterArray.length} filters` : 'Add Filter'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <OrderFilter options={orderByOptions} {...getFilterProps(orderByKey)} />
        </div>
      </div>
    </div>
  );
}
