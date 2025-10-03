import React from 'react';
import { LoaderCircle } from 'lucide-react';

import { cn } from '../lib/utils';

interface SpinnerProps {
  /** Size of the spinner in pixels or CSS units */
  size?: number | string;
  /** Accessible title for the spinner */
  title?: string;
  /** Additional CSS classes */
  className?: string;
}

/** A loading spinner using SVG + CSS animation. */
const Spinner: React.FC<SpinnerProps> = ({ size = '1em', title = 'Loading', className, ...props }) => {
  return (
    <LoaderCircle
      size={size}
      aria-label={title}
      role="img"
      className={cn('animate-spin', className)}
      data-spinner="true"
      {...props}
    />
  );
};

/** @component */
export default Spinner;
