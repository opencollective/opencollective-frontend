import React from 'react';

import { useWindowResize, VIEWPORTS } from '../lib/hooks/useWindowResize';
import { cn } from '../lib/utils';

import { Flex } from './Grid';
import StyledSelect from './StyledSelect';

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

type TabsProps = {
  tabs: Array<{ id: string | number; label: React.ReactNode | string; count?: number; selected?: boolean }>;
  selectedId: string | number;
  onChange?: Function;
};

const Tabs = ({ tabs, selectedId, onChange, ...props }: TabsProps & Parameters<typeof Flex>[0]) => {
  const { viewport } = useWindowResize();

  if (viewport === VIEWPORTS.XSMALL) {
    const options = tabs.map(tab => ({
      label: tab.count !== undefined ? `${tab.label} (${tab.count})` : tab.label,
      value: tab.id,
    }));
    return (
      <StyledSelect
        {...props}
        inputId="tabs"
        options={options}
        onChange={option => onChange?.(option.value)}
        value={options.find(option => option.value === selectedId)}
      />
    );
  }

  return (
    <div className="border-b" {...props}>
      <div className="-mb-px flex space-x-6 overflow-x-auto">
        {tabs.map(tab => {
          const selected = tab.id === selectedId;
          return (
            <button
              key={tab.id}
              onClick={() => onChange?.(tab.id)}
              className={cn(
                'flex whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ring-inset	ring-black focus:outline-none focus-visible:ring-2',
                selected
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:border-slate-200 hover:text-slate-700',
              )}
            >
              {tab.label}{' '}
              {tab.count > 0 && (
                <span
                  className={cn(
                    'ml-3 hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block',
                    selected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-900',
                  )}
                >
                  {abbreviateNumber(tab.count)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Tabs;
