import React from 'react';
import { clsx } from 'clsx';
import { isNil } from 'lodash';
import { useIntl } from 'react-intl';

import { useWindowResize, VIEWPORTS } from '../lib/hooks/useWindowResize';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select';

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

const Count = ({ count, selected }: { count?: number; selected?: boolean }) => {
  if (isNil(count)) {
    return null;
  }
  return (
    <span
      className={clsx(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        selected ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground',
      )}
    >
      {abbreviateNumber(count)}
    </span>
  );
};

type TabsProps = {
  tabs: Array<{ id: string; label: React.ReactNode | string; count?: number }>;
  selectedId?: string;
  onChange?: Function;
  variant?: 'horizontal' | 'vertical';
};

const Tabs = ({ tabs, selectedId, onChange, ...props }: TabsProps) => {
  const { viewport } = useWindowResize();
  const intl = useIntl();
  if (viewport === VIEWPORTS.XSMALL) {
    return (
      <Select onValueChange={val => onChange(val)} value={selectedId ?? ''}>
        <SelectTrigger data-cy={`view-${selectedId}`} className={selectedId && 'font-medium text-primary'}>
          <SelectValue className="font-bold" placeholder={intl.formatMessage({ defaultMessage: 'Select a view' })} />
        </SelectTrigger>
        <SelectContent>
          {tabs.map(tab => {
            return (
              <SelectItem value={tab.id} key={tab.id} className="">
                <span>{tab.label}</span> <Count count={tab.count} />
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  } else if (props.variant === 'vertical') {
    return (
      <div className="flex flex-col gap-2">
        {tabs.map(tab => {
          const selected = tab.id === selectedId;
          return (
            <button
              key={tab.id}
              onClick={() => onChange?.(tab.id)}
              className={clsx(
                'ring-ringtransition-colors flex items-center justify-between gap-2 whitespace-nowrap rounded-md px-2 py-1 ring-inset focus:outline-none focus-visible:ring-2',
                selected ? 'bg-primary/10' : 'hover:border-border hover:text-foreground/80',
              )}
            >
              <div className="font-bold">{tab.label}</div>
              {!isNil(tab.count) && <div className="text-xs text-slate-600">({tab.count})</div>}
            </button>
          );
        })}
      </div>
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
              className={clsx(
                'flex gap-3 whitespace-nowrap border-b-2 px-1 pb-4 pt-2 text-sm font-medium ring-inset ring-ring	transition-colors focus:outline-none focus-visible:ring-2',
                selected
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground/80',
              )}
            >
              {tab.label} <Count count={tab.count} selected={selected} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(Tabs) as typeof Tabs;
