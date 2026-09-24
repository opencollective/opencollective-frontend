import * as React from 'react';

import { cn } from '../../lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  error?: boolean;
}

export const BASE_INPUT_CLASS =
  'flex h-10 duration-300 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-[color,box-shadow] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-within:ring-2 ring-ring focus-within:outline-hidden disabled:cursor-not-allowed disabled:opacity-50';

export const BASE_INPUT_ERROR_CLASS = 'border-red-500 ring-red-500/30';

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(BASE_INPUT_CLASS, props.error && BASE_INPUT_ERROR_CLASS, className)}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

const InputGroup = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<'input'> & {
    append?: React.ReactNode;
    prepend?: React.ReactNode;
    prependClassName?: string;
    appendClassName?: string;
    error?: boolean;
  }
>(({ className, prepend, append, prependClassName, appendClassName, ...props }, ref) => (
  <div
    className={cn(
      BASE_INPUT_CLASS,
      'w-fit overflow-hidden p-0',
      props.error && BASE_INPUT_ERROR_CLASS,
      props.disabled && 'cursor-not-allowed opacity-50',
      className,
    )}
  >
    {prepend && <div className={cn('bg-slate-50 px-3 py-2', prependClassName)}>{prepend}</div>}

    <input
      className="mx-3 my-2 w-full bg-inherit outline-hidden file:border-0 file:bg-transparent file:text-sm file:font-medium"
      ref={ref}
      {...props}
    />
    {append && <div className={cn('bg-slate-50 px-3 py-2', appendClassName)}>{append}</div>}
  </div>
));
InputGroup.displayName = 'InputGroup';

export { Input, InputGroup };
