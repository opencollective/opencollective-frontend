import React, { Fragment } from 'react';

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

export default function Tabs({
  tabs,
  selectedId,
  onChange,
  label = 'Tabs',
  selectProps: { showSelectOnMobile = true, showEmptyOption = true, emptyOptionLabel = 'Select a tab' } = {},
}: {
  tabs: {
    id: string;
    label: string;
    count?: number;
    showCount?: boolean;
  }[];
  selectedId?: string;
  onChange: (value: string) => void;
  label?: string;
  selectProps?: {
    showSelectOnMobile?: boolean;
    showEmptyOption?: boolean;
    emptyOptionLabel?: string;
  };
}) {
  const selectedTab = React.useMemo(() => tabs.find(tab => tab.id === selectedId), [tabs, selectedId]);
  return (
    <div className="">
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          {label}
        </label>
        {/* TODO: Replace with ui/Select */}
        <select
          id="tabs"
          name="tabs"
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          value={selectedTab?.id ?? null}
          onChange={e => onChange(e.target.value)}
        >
          {showEmptyOption ? (
            <option disabled selected={!selectedTab} value={null}>
              {emptyOptionLabel}
            </option>
          ) : null}

          {tabs.map(tab => (
            <option key={tab.id} value={tab.id}>
              {tab.label} {tab.count ? <Fragment>({tab.count})</Fragment> : null}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label={label}>
            {tabs.map(tab => {
              const isActive = selectedTab?.id === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onChange(tab.id)}
                  // className={cx(
                  //   isActive
                  //     ? 'border-blue-500 text-blue-600'
                  //     : 'border-transparent text-gray-500 hover:border-gray-200 hover:text-gray-700',
                  //   'flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium',
                  // )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {tab.label}
                  {tab.showCount && typeof tab.count !== 'undefined' ? (
                    <span
                    // className={cx(
                    //   isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-900',
                    //   'ml-3 hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block',
                    // )}
                    >
                      {abbreviateNumber(tab.count)}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
