import React, { useContext } from 'react';
import { cx } from 'class-variance-authority';
import { isEmpty, omit, omitBy } from 'lodash';
import { ArrowUpDown, Filter, LayoutList, MessageSquare, MoreHorizontal, Paperclip, Table2, X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';

import { SettingsContext } from '../../lib/SettingsContext';

import Tabs from '../StyledTabs';
import { DropdownMenu, DropdownMenuItem, DropdownMenuItems, DropdownMenuTrigger } from '../ui/Dropdown';

import { FilterCombo } from './FilterCombo';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/Tooltip';
// import DashboardHeader from './DashboardHeader';
import OrderFilter from './OrderFilter';
import SelectFilter from './SelectFilter';
import FilterComboNew, { FilterOptions } from './FilterComboNew';

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
  filterOptionsMap,
  orderByKey = 'orderBy',
  orderByOptions,
  views,
  onChange,
  routeParams,
  showDisplayAs = false,
}: {
  filterOptions: FilterOptions;
}) {
  const [currentView, setView] = React.useState(views?.[0]);
  const { settings, setSettings } = useContext(SettingsContext);

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
    console.log({ newNaiveFilters, filtersToUpdate });
    setDisplayedFilters(filtersToUpdate.map(f => ({ ...f, value: query?.[f.key] })));
  }, [JSON.stringify(query)]);

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
  const viewOptions = [
    { label: 'Cards', value: 'cards' },
    { label: 'Table', value: 'table' },
  ];
  console.log({ displayedFilters, query, filterOptionsWithCurrentValue });
  const currentViewOption = viewOptions.find(v => v.value === (settings.tables ? 'table' : 'cards'));
  return (
    <div className="">
      {/* <DashboardHeader title={title} primaryAction={currentView?.actions?.[0]} secondaryActions={null} /> */}
      {/* <div className="w-full  overflow-x-auto whitespace-nowrap bg-white pt-2 ">
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
      </div> */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          {displayedFilters.map(filter => (
            <FilterComboNew key={filter.key} filter={filter} filterOptions={filterOptions} />
          ))}
          <FilterComboNew filterOptions={remainingOptions} />
        </div>
        <OrderFilter options={orderByOptions} {...getFilterProps(orderByKey)} />
      </div>
      <div className="group flex items-end justify-between gap-2 py-4">
        <div className="hidden flex-wrap items-center gap-2 sm:flex">
          {/* {filterOptions
            .filter(o => o.fixed)
            .map(filterOption => (
              <FilterCombo
                key={filterOption.key}
                currentFilter={filterArray.find(f => f.key === filterOption.key)}
                filterType={filterOption.type}
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
          {filterArray.map(filter => (
            <FilterCombo
              key={`${filter.key}-${filter.value}`}
              currentFilter={filter}
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
          /> */}
        </div>

        <div className="block sm:hidden">
          <button
            className={cx(
              'animate-in duration-400 fade-in flex flex-nowrap items-center gap-1 rounded-md bg-white  px-2.5 py-1.5 text-sm font-medium  ring-1 ring-gray-300  transition-all hover:bg-gray-50 hover:shadow',
              filterArray.length ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900',
            )}
          >
            <Filter size={16} className="text-gray-400" />
            <span>{filterArray.length ? `${filterArray.length} filters` : 'Add Filter'}</span>
          </button>
        </div>

        {/* <div className="flex items-center gap-2">
          <SelectFilter
            options={viewOptions}
            value={currentViewOption}
            onChange={option => {
              setSettings({ ...settings, tables: option.value === 'table' });
            }}
            align="center"
            trigger={
              <div>{settings.tables ? <Table2 className="" size={16} /> : <LayoutList className="" size={16} />}</div>
            }
            triggerTooltip={'Display as'}
            className="h-8 w-8"
          />

          <OrderFilter options={orderByOptions} {...getFilterProps(orderByKey)} />
        </div> */}
      </div>
    </div>
  );
}
