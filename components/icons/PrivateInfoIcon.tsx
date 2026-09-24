import React from 'react';
import { Lock } from 'lucide-react';
import { useIntl } from 'react-intl';

import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/Tooltip';

type PrivateInfoIconProps = {
  children?: React.ReactNode;
  size?: string | number;
  color?: string;
  className?: string;
};

/**
 * A lock icon with a tooltip indicating that this info is private
 */
const PrivateInfoIcon = ({
  children = undefined,
  size = 14,
  className = undefined,
  ...props
}: PrivateInfoIconProps) => {
  const { formatMessage } = useIntl();
  const defaultLabel = formatMessage({ id: 'Tooltip.PrivateInfo', defaultMessage: 'This info is private' });
  const icon = <Lock size={size} className={className} {...props} />;

  return (
    <Tooltip>
      <TooltipTrigger
        className="cursor-help align-middle"
        aria-label={typeof children === 'string' ? children : defaultLabel}
      >
        {icon}
      </TooltipTrigger>
      <TooltipContent className="font-normal">{children || defaultLabel}</TooltipContent>
    </Tooltip>
  );
};

export default PrivateInfoIcon;
