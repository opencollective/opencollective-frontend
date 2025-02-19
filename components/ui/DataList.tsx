import React from 'react';

import { cn } from '../../lib/utils';

export function DataList({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <dl className={cn('flex w-full flex-col gap-3', className)}>{children}</dl>;
}

export function DataListItemValue({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={cn('max-w-fit break-words', className)}>{children}</div>;
}

export function DataListItemLabel({ children }: { children?: React.ReactNode }) {
  return <div className="max-w-[240px] min-w-[180px] shrink-0 grow-0 basis-1/4 text-muted-foreground">{children}</div>;
}

export type DataListItemProps = {
  label?: React.ReactNode;
  value?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

export function DataListItem({ children, label, value, className }: DataListItemProps) {
  return (
    <div className={cn('relative flex w-full flex-col gap-3 sm:flex-row', className)}>
      {label && <DataListItemLabel>{label}</DataListItemLabel>}
      {value && <DataListItemValue>{value}</DataListItemValue>}
      {children}
    </div>
  );
}
