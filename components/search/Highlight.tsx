import React from 'react';
import { Markup } from 'interweave';

import { cn } from '@/lib/utils';

export function Highlight({ content, className }: { content?: string; className?: string }) {
  return (
    <Markup
      className={cn(
        '[&_mark]:relative [&_mark]:rounded-sm [&_mark]:bg-amber-200/30 [&_mark]:text-amber-950 [&_mark]:shadow-[0_0_0_2px_color-mix(in_oklab,var(--color-amber-200)_30%,transparent)]',
        className,
      )}
      allowList={['mark']}
      content={content}
    />
  );
}
