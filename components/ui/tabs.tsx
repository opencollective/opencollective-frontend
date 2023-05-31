import React from 'react';
import PropTypes from "prop-types"
import { cx } from 'class-variance-authority';
export default function Tabs({ filters, selected, getLabel, onChange, getCount }) {
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          defaultValue={filters.find(filter => filter === selected)}
        >
          {filters.map(filter => (
            <option key={filter}>{getLabel(filter)}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {filters.map(filter => (
              <button
                key={filter}
                onClick={() => onChange(filter)}
                className={cx(
                  filter === selected
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-700',
                  'flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
                )}
                aria-current={filter === selected ? 'page' : undefined}
              >
                {getLabel(filter)}
                {getCount ? (
                  <span
                    className={cx(
                      filter === selected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900',
                      'ml-3 hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block',
                    )}
                  >
                    {getCount(filter)}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

Tabs.propTypes = {
  filters: PropTypes.arrayOf(PropTypes.string).isRequired,
  selected: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  getLabel: PropTypes.func.isRequired,
  getCount: PropTypes.func,
};
