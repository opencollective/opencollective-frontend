import React from 'react';
import { BarsArrowUpIcon, FunnelIcon } from '@heroicons/react/20/solid';
import { isEmpty, omit, omitBy } from 'lodash';

import Tabs from './ui/tabs-updated';
import { ChevronDown, Filter, X } from 'lucide-react';
import FlipMove from 'react-flip-move';
import { Flipper, Flipped } from 'react-flip-toolkit';
import { FormattedMessage, useIntl } from 'react-intl';
import OrderFilter from './OrderFilter';
import { FilterCombo } from './ui/filter';
import DashboardHeader from './DashboardHeader';
import { set } from 'cypress/types/lodash';

const getFiltersFromQuery = filter => {
  const filterObjs = {
    status: filter.status,
    type: filter.type,
    tag: filter.tag ? (Array.isArray(filter.tag) ? filter.tag : [filter.tag]) : undefined,
    amount: filter.amount,
    payout: filter.payout,
    searchTerm: filter.searchTerm,
    'fees-structure': filter['fees-structure'],
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
          label: 'Text search is',
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
      if (key === 'fees-structure') {
        return {
          key,
          value: filterObjs[key],
          label: 'Fee structure is',
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
  orderByKey = 'orderBy',
  orderByOptions,
  views,
  onChange,
  routeParams,
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
      console.log('view:', v.query, 'filter', filter);
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
    <div>
      <DashboardHeader title={title} primaryAction={currentView?.actions?.[0]} secondaryActions={null} />
      <div className="border-b mt-2 border-gray-200 bg-white sticky top-0">
        {views?.length > 0 ? (
          <Tabs
            tabs={views}
            selected={currentView?.label}
            onChange={label => {
              const view = views.find(v => v.label === label);
              onChange(view.query);
            }}
          />
        ) : (
          <div className="h-4" />
        )}
      </div>

      <div className="flex items-center justify-between  py-4 group">
        <div className="flex items-center gap-2">
          {filterArray.map(filter => (
            <FilterCombo
              key={`${filter.key}-${filter.value}`}
              filter={filter}
              filterOptions={filterOptions}
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
        <div className="flex items-center gap-6">
          <OrderFilter options={orderByOptions} {...getFilterProps(orderByKey)} />
        </div>
      </div>
    </div>
  );
}
