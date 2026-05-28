import React from 'react';

import { cn } from '../../lib/utils';

import { Separator } from './Separator';

type FormSectionTitleProps = {
  children: React.ReactNode;
  className?: string;
};

export function FormSectionTitle({ children, className }: FormSectionTitleProps) {
  return (
    <div className={cn('mb-3 flex items-center gap-3', className)}>
      <h3 className="text-base leading-6 font-bold whitespace-nowrap text-foreground">{children}</h3>
      <Separator className="flex-1" />
    </div>
  );
}
