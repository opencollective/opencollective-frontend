import React from 'react';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

const Tab = ({ title, description, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-col items-start justify-stretch gap-2 border-b-2 px-6 py-4 text-left ring-ring transition-colors focus:outline-none focus-visible:ring-2 sm:gap-1 sm:px-10 sm:pb-8 sm:pt-10',
        isActive
          ? 'border-b-primary bg-white'
          : 'border-b-transparent text-slate-700 hover:bg-slate-50 hover:text-inherit',
      )}
    >
      <div className="flex w-full flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <div className={clsx('text-lg font-semibold tracking-tight sm:text-xl')}>{title}</div>
      </div>

      <div className="text-xs text-muted-foreground sm:text-sm">{description}</div>
    </button>
  );
};

export function HostReportTabs({ queryFilter }) {
  return (
    <div className="grid grid-cols-2 divide-x rounded-t-xl border-b bg-muted">
      <Tab
        title={<FormattedMessage defaultMessage="Managed funds" id="Jao4Ji" />}
        description={
          <FormattedMessage defaultMessage="Funds going to and from Hosted Collective accounts" id="kN43KR" />
        }
        isActive={!queryFilter.values.isHost}
        onClick={() => queryFilter.setFilter('isHost', false)}
      />
      <Tab
        title={<FormattedMessage defaultMessage="Operational funds" id="JXgOp+" />}
        description={<FormattedMessage defaultMessage="Funds going to and from the Fiscal Host account" id="sjX7by" />}
        isActive={queryFilter.values.isHost}
        onClick={() => queryFilter.setFilter('isHost', true)}
      />
    </div>
  );
}
