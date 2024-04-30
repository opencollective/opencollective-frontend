import React from 'react';

import { cn } from '../../lib/utils';

export function DataList({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <dl className={cn('flex w-full flex-col gap-3', className)}>{children}</dl>;
}

export function DataListItemValue({ children }: { children?: React.ReactNode }) {
  return <div className="max-w-fit overflow-hidden">{children}</div>;
}

export function DataListItemLabel({ children }: { children?: React.ReactNode }) {
  return <div className="min-w-[180px] max-w-[240px] shrink-0 grow-0 basis-1/4 text-muted-foreground">{children}</div>;
}

export function DataListItem({
  children,
  label,
  value,
  className,
}: {
  label?: React.ReactNode;
  value?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('relative flex w-full flex-col gap-3 sm:flex-row', className)}>
      {label && <DataListItemLabel>{label}</DataListItemLabel>}
      {value && <DataListItemValue>{value}</DataListItemValue>}
      {children}
    </div>
  );
}
