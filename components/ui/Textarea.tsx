import * as React from 'react';

import { cn } from '../../lib/utils';

import { Badge } from './Badge';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showCount = false, ...props }, ref) => {
    const value = (props.value || props.defaultValue || '') as string;

    const input = (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
          props.error && 'ring-2 ring-destructive ring-offset-2',
          className,
        )}
        ref={ref}
        {...props}
      />
    );

    return !showCount ? (
      input
    ) : (
      <div className="relative">
        {input}
        <div className="absolute right-1.5 bottom-1.5">
          <Badge size="sm">
            <span>{value.length}</span>
            {props.maxLength && <span className="text-muted-foreground">/{props.maxLength}</span>}
          </Badge>
        </div>
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';

export { Textarea };
