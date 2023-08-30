import React from 'react';

import { cn } from '../../lib/utils';

export function DescriptionList({
  children,
  columns = 1,
  className,
}: {
  children: React.ReactNode;
  columns?: 1 | 2;
  className?: string;
}) {
  return <dl className={cn('grid grid-cols-1', columns === 2 && 'sm:grid-cols-2', className)}>{children}</dl>;
}

export function DescriptionListItemTitle({ children }: { children: React.ReactNode }) {
  return <dt className="font-medium leading-6 text-slate-900">{children}</dt>;
}

export function DescriptionListItemValue({ children }: { children: React.ReactNode }) {
  return <dd className="mt-1 leading-6 text-slate-700 sm:mt-2">{children}</dd>;
}

export function DescriptionListItem({
  title,
  value,
  children,
  colSpan = 1,
  className,
}: {
  title?: React.ReactNode;
  value?: React.ReactNode;
  children?: React.ReactNode;
  colSpan?: 1 | 2;
  className?: string;
}) {
  return (
    <div
      className={cn('border-t border-slate-100 px-4 py-6 text-sm sm:px-0', colSpan === 2 && 'sm:col-span-2', className)}
    >
      {title && <DescriptionListItemTitle>{title}</DescriptionListItemTitle>}
      {value && <DescriptionListItemValue>{value}</DescriptionListItemValue>}
      {children}
    </div>
  );
}
