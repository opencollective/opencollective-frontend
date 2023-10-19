import React from 'react';

import { cn } from '../../lib/utils';

export default function DashboardHeader({
  title,
  actions,
  description,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold leading-10 tracking-tight">{title}</h1>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {description && <p className="mb-4 max-w-prose text-muted-foreground">{description}</p>}
    </div>
  );
}
