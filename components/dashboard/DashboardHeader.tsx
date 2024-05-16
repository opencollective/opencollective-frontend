import React from 'react';
import { ArrowLeft, ArrowRight, Slash } from 'lucide-react';

import { cn } from '../../lib/utils';

import Link from '../Link';
import RegisterPage from '../RegisterPage';

export default function DashboardHeader({
  title,
  subpathTitle,
  titleRoute,
  actions,
  description,
  className,
  children,
  dashboardSlug,
}: {
  title: React.ReactNode;
  subpathTitle?: React.ReactNode;
  titleRoute?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  dashboardSlug?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {dashboardSlug && <RegisterPage dashboardSlug={dashboardSlug} />}

      {subpathTitle && (
        <React.Fragment>
          <Link href={titleRoute}>
            <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              <ArrowLeft size={16} className="inline-block" /> Back to {title}
            </span>
          </Link>
        </React.Fragment>
      )}
      <div className="flex flex-col flex-wrap justify-between gap-1.5 sm:flex-row sm:items-center">
        <div className="flex items-center gap-1.5 text-2xl font-bold leading-9 tracking-tight text-muted-foreground">
          <div className="text-foreground">{subpathTitle ?? title}</div>
        </div>
        <div className="flex items-center justify-end gap-2">{actions}</div>
      </div>
      {description && <p className="max-w-prose text-muted-foreground">{description}</p>}
      {children}
    </div>
  );
}
