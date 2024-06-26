import React from 'react';
import { cva } from 'class-variance-authority';
import clsx from 'clsx';

import Link from '../Link';
import { triggerPrototypeToast } from './helpers';

export const Tabs = ({ tabs, centered }) => {
  const linkClasses = cva('flex h-full px-1 antialiased hover:text-primary text-sm items-center border-b-[3px]', {
    variants: {
      active: {
        true: 'border-black font-semibold',
        false: 'border-transparent font-medium',
      },
    },
    defaultVariants: {
      active: false,
    },
  });
  return (
    <div className={clsx('flex h-full gap-8', centered && 'justify-center')}>
      {tabs.map((tab, i) => (
        <Link href={`#`} key={tab} className={linkClasses({ active: i === 0 })} onClick={triggerPrototypeToast}>
          <div>{tab}</div>
        </Link>
      ))}
    </div>
  );
};
