import React from 'react';

import { cn } from '../../lib/utils';
import Link from 'next/link';

const TabsList = ({ className, centered, ...props }) => (
  <div className={cn('flex h-full gap-8', centered && 'justify-center', className)} {...props} />
);

const TabsTrigger = ({ className, children, href, value, activeTab, count, ...props }) => (
  <Link
    href={href}
    className={cn(
      'relative flex h-full items-center gap-1.5 border-b-[3px] px-1 text-sm antialiased hover:text-primary',
      'border-transparent font-medium transition-colors data-[state=active]:border-black',
      className,
    )}
    {...(activeTab === value && {
      'data-state': 'active',
    })}
    {...props}
  >
    {children} {count > 0 && <div className="relative -top-1 align-top text-xs text-primary">{count}</div>}
  </Link>
);

export { TabsList, TabsTrigger };
