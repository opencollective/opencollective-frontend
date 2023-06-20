import React from 'react';
import { cx } from 'class-variance-authority';

// A function to abbreviate large integers (1000 and above) with a letter suffix.
// For example, 1000 becomes 1K, 1000000 becomes 1M, etc.
// It should also add once decimal if abbreviating (unless the number is a whole number).
// For example, 1500 becomes 1.5K, 1500000 becomes 1.5M, etc.
// If the number is less than 1000, it should return the number as-is.
const abbreviateNumber = number => {
  if (number >= 1000000000) {
    return `${(number / 1000000000).toFixed(1)}B`;
  } else if (number >= 1000000) {
    return `${(number / 1000000).toFixed(1)}M`;
  } else if (number >= 1000) {
    return `${(number / 1000).toFixed(1)}K`;
  } else {
    return number;
  }
};

export default function Tabs({ tabs, selected, onChange }) {
  return (
    <div className="flex-1">
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          defaultValue={tabs.find(tab => tab.key === selected)?.label}
        >
          {tabs.map(tab => (
            <option key={tab.label}>{tab.label}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200 -mb-px">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => onChange(tab.label)}
                className={cx(
                  tab.label === selected
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-700',
                  'flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
                )}
                aria-current={tab.label === selected ? 'page' : undefined}
              >
                {tab.label}
                {tab.showCount && typeof tab.count !== 'undefined' ? (
                  <span
                    className={cx(
                      tab.label === selected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900',
                      'ml-3 hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block',
                    )}
                    // className={cx(
                    //   'bg-white ring-gray-300 text-gray-900 ring-1 ml-3 hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block',
                    // )}
                  >
                    {abbreviateNumber(tab.count)}
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
