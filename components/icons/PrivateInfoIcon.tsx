import React from 'react';
import { Lock } from '@styled-icons/material/Lock';
import { useIntl } from 'react-intl';

import StyledTooltip from '../StyledTooltip';

type PrivateInfoIconProps = {
  children?: React.ReactNode;
  size?: string | number;
  tooltipProps?: any;
  withoutTooltip?: boolean;
  color?: string;
};

/**
 * A lock icon with a tooltip indicating that this info is private
 */
const PrivateInfoIcon = ({
  children = undefined,
  size = '0.9em',
  tooltipProps = undefined,
  withoutTooltip = undefined,
  color = '#75777A',
  ...props
}: PrivateInfoIconProps) => {
  const { formatMessage } = useIntl();
  const icon = <Lock size={size} color={color} {...props} />;

  if (withoutTooltip) {
    return icon;
  }

  return (
    <StyledTooltip
      childrenContainer="span"
      content={() => children || formatMessage({ id: 'Tooltip.PrivateInfo', defaultMessage: 'This info is private' })}
      {...tooltipProps}
    >
      {icon}
    </StyledTooltip>
  );
};

export default PrivateInfoIcon;
