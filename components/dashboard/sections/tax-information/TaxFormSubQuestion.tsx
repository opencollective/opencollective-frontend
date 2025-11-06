import React from 'react';

import { cn } from '@/lib/utils';

export const TaxFormSubQuestion = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn('flex flex-col gap-y-2 border-l-2 border-gray-200 pt-2 pl-4 animate-in fade-in', className)}>
      {children}
    </div>
  );
};
