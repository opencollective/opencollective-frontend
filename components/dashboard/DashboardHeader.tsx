import React from 'react';

import { cn } from '../../lib/utils';

export default function DashboardHeader({
  title,
  actions,
  description,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold leading-9 tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {description && <p className="max-w-prose text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}
