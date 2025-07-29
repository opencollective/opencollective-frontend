import * as React from 'react';

import { cn } from '../../lib/utils';

import { Badge } from './Badge';
import { BASE_INPUT_CLASS, BASE_INPUT_ERROR_CLASS } from './Input';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
  error?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, showCount = false, ...props }, ref) => {
    const value = (props.value || props.defaultValue || '') as string;

    const input = (
      <textarea
        className={cn(BASE_INPUT_CLASS, props.error && BASE_INPUT_ERROR_CLASS, className)}
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
