import * as React from 'react';

import { cn } from '../../lib/utils';
import { LucideIcon } from 'lucide-react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  Icon?: LucideIcon;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, Icon, ...props }, ref) => {
  return (
    <div className={'relative h-8'}>
      {Icon && (
        <div className="absolute bottom-0 left-3 top-0 flex items-center text-muted-foreground">
          <Icon size={16} />
        </div>
      )}
      <input
        type={type}
        className={cn(
          'flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          Icon && 'pl-9',
          className,
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});
Input.displayName = 'Input';

export { Input };
