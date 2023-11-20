import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const badgeVariants = cva('inline-flex align-middle items-center font-medium', {
  variants: {
    type: {
      info: 'bg-blue-100 text-blue-700',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      error: 'bg-red-100 text-red-800',
      neutral: 'bg-slate-100 text-slate-700',
      outline: 'bg-transparent text-slate-600 ring-1 ring-slate-300 ring-inset',
    },
    round: {
      true: 'rounded-full',
    },
    size: {
      xs: 'px-1 py-0.5 text-xs',
      sm: 'px-2 py-1 text-xs',
      default: 'px-3 py-1 text-sm',
    },
  },
  compoundVariants: [
    {
      size: 'xs',
      round: false,
      className: 'rounded-sm',
    },
    {
      size: 'sm',
      round: false,
      className: 'rounded-md',
    },
    {
      size: 'default',
      round: false,
      className: 'rounded-lg',
    },
  ],
  defaultVariants: {
    type: 'neutral',
    round: false,
    size: 'default',
  },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, type, size, round, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ type, size, round }), className)} {...props} />;
}

export { Badge, badgeVariants };
