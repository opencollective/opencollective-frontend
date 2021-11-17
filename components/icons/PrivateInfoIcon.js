import React from 'react';
import PropTypes from 'prop-types';
import { Lock } from '@styled-icons/material/Lock';
import { defineMessages, useIntl } from 'react-intl';

import StyledTooltip from '../StyledTooltip';

const msg = defineMessages({
  defaultContent: {
    id: 'Tooltip.PrivateInfo',
    defaultMessage: 'This info is private',
  },
});

/**
 * A lock icon with a tooltip indicating that this info is private
 */
const PrivateInfoIcon = ({ children, size, tooltipProps, withoutTooltip, color, ...props }) => {
  const { formatMessage } = useIntl();
  const icon = <Lock size={size} color={color} {...props} />;

  if (withoutTooltip) {
    return icon;
  }

  return (
    <StyledTooltip
      childrenContainer="span"
      content={() => children || formatMessage(msg.defaultContent)}
      {...tooltipProps}
    >
      {icon}
    </StyledTooltip>
  );
};

PrivateInfoIcon.propTypes = {
  /** A message to display in the tooltip in place of the default one */
  children: PropTypes.node,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  tooltipProps: PropTypes.object,
  withoutTooltip: PropTypes.bool,
  color: PropTypes.string,
};

PrivateInfoIcon.defaultProps = {
  size: '0.9em',
  color: '#75777A',
};

export default PrivateInfoIcon;
