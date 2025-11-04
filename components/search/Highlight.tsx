import React from 'react';
import { Markup } from 'interweave';

import { cn } from '@/lib/utils';

export function Highlight({ content, className }: { content: string; className?: string }) {
  return (
    <Markup
      className={cn(
        '[&_mark]:relative [&_mark]:-mx-0.5 [&_mark]:rounded-sm [&_mark]:bg-blue-400/20 [&_mark]:px-0.5 [&_mark]:py-0.5 [&_mark]:text-amber-950',
        className,
      )}
      allowList={['mark']}
      content={content}
    />
  );
}
