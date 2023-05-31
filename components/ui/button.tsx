import React from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

const buttonStyles = cva(
  ' shadow-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
  {
    variants: {
      size: {
        xs: 'px-2 py-1 text-xs',
        sm: 'px-2 py-1 text-sm',
        md: 'px-2.5 py-1.5 text-base',
        lg: 'px-3 py-2 text-lg',
        xl: 'px-3.5 py-2.5 text-xl',
      },
      intent: {
        primary: 'bg-indigo-600 hover:bg-indigo-500 text-white focus-visible:outline-indigo-600',
        secondary: 'bg-white',
        ghost: 'bg-transparent',
      },
      round: {
        true: 'rounded-full',
        false: 'rounded-md',
      },
    },
  },
);

export type ButtonProps = Omit<React.HTMLProps<HTMLButtonElement>, 'size'> & VariantProps<typeof buttonStyles>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, size = 'md', intent = 'primary', round = false, className, onClick }, ref) => {
    return (
      <button ref={ref} type="button" className={buttonStyles({ size, intent, round, className })} onClick={onClick}>
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
