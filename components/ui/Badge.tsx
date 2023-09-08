import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', {
  variants: {
    type: {
      info: 'bg-blue-100 text-blue-700',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      neutral: 'bg-slate-100 text-slate-700',
    },
    rounded: {
      true: 'rounded-full',
      false: 'rounded-md',
    },
  },
  defaultVariants: {
    type: 'neutral',
    rounded: false,
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, type, rounded, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ type, rounded }), className)} {...props} />;
}

export { Badge, badgeVariants };
