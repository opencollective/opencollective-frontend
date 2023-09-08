import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex items-center rounded-full px-2 py-1 text-xs font-medium', {
  variants: {
    color: {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      slate: 'bg-slate-100 text-slate-600',
    },
    rounded: {
      true: 'rounded-full',
      false: 'rounded-md',
    },
  },
  defaultVariants: {
    color: 'slate',
    rounded: false,
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, color, rounded, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ color, rounded }), className)} {...props} />;
}

export { Badge, badgeVariants };
