import React from 'react';
// eslint-disable-next-line no-restricted-imports
import Link from 'next/link';

import { cn } from '../../lib/utils';

const TabsList = ({ className = '', centered = true, ...props }) => (
  <div className={cn('flex h-full gap-8', centered && 'justify-center', className)} {...props} />
);

const TabsTrigger = ({ className = '', children, href, active, count = undefined, ...props }) => (
  <Link
    href={href}
    className={cn(
      'relative flex h-full items-center gap-1.5 border-b-[3px] px-1 text-sm antialiased hover:text-primary',
      'border-transparent font-medium transition-colors',
      active && 'border-black',
      className,
    )}
    {...props}
  >
    {children} {count > 0 && <div className="relative -top-1 align-top text-xs text-primary">{count}</div>}
  </Link>
);

export { TabsList, TabsTrigger };
