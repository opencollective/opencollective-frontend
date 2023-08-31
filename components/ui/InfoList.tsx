import React from 'react';

import { cn } from '../../lib/utils';

export function InfoList({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn('grid grid-cols-1', className)}>{children}</dl>;
}

export function InfoListItemTitle({ children }: { children: React.ReactNode }) {
  return <dt className="font-medium leading-6 text-slate-900">{children}</dt>;
}

export function InfoListItemValue({ children }: { children: React.ReactNode }) {
  return <dd className="mt-1 leading-6 text-slate-700 sm:mt-2">{children}</dd>;
}

export function InfoListItem({
  title,
  value,
  children,
  className,
}: {
  title?: React.ReactNode;
  value?: React.ReactNode;
  children?: React.ReactNode;
  colSpan?: 1 | 2;
  className?: string;
}) {
  return (
    <div className={cn('border-t border-slate-100 px-4 py-6 text-sm sm:px-0', className)}>
      {title && <InfoListItemTitle>{title}</InfoListItemTitle>}
      {value && <InfoListItemValue>{value}</InfoListItemValue>}
      {children}
    </div>
  );
}
