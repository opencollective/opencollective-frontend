import * as React from 'react';

import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = 'Input';

const InputGroup = React.forwardRef<
  HTMLInputElement,
  React.ComponentPropsWithoutRef<'input'> & { append?: React.ReactNode }
>(({ className, append, ...props }, ref) => (
  <div
    className={cn(
      'flex h-10 w-fit rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
      props.disabled && 'cursor-not-allowed opacity-50',
      className,
    )}
  >
    <input
      className="mx-3 my-2 w-full bg-inherit outline-none file:border-0 file:bg-transparent file:text-sm file:font-medium"
      ref={ref}
      {...props}
    />
    {append && <div className="rounded-r-md bg-slate-50 px-3 py-2">{append}</div>}
  </div>
));
InputGroup.displayName = 'InputGroup';

export { Input, InputGroup };
