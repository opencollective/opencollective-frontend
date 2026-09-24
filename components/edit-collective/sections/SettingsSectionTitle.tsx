import React from 'react';

import { cn } from '@/lib/utils';

import { Separator } from '@/components/ui/Separator';

const SettingsSectionTitle = ({ children, actions = null, className = '' }) => {
  return (
    <div className={cn('mb-3 flex w-full items-center justify-between gap-2', className)}>
      <h3 className="text-black-800 text-base leading-6 font-bold">{children}</h3>
      <Separator className="flex-1" />
      {actions}
    </div>
  );
};

export default SettingsSectionTitle;
