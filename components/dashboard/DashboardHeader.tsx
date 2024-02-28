import React from 'react';
import { Slash } from 'lucide-react';

import { cn } from '../../lib/utils';

import Link from '../Link';

export default function DashboardHeader({
  title,
  subpathTitle,
  titleRoute,
  actions,
  description,
  className,
  children,
}: {
  title: React.ReactNode;
  subpathTitle?: React.ReactNode;
  titleRoute?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-2xl font-bold leading-9 tracking-tight text-muted-foreground">
          {subpathTitle && (
            <React.Fragment>
              <Link href={titleRoute}>
                <span className="transition-colors hover:text-foreground">{title}</span>
              </Link>
              <Slash size={24} />
            </React.Fragment>
          )}
          <h1 className="capitalize text-foreground">{subpathTitle ?? title}</h1>
        </div>
        <div className="flex items-center gap-2">{actions}</div>
      </div>
      {description && <p className="max-w-prose text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}
