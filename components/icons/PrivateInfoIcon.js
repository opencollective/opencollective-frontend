import React from 'react';
import PropTypes from 'prop-types';
import { Lock } from '@styled-icons/fa-solid';
import StyledTooltip from '../StyledTooltip';
import { useIntl, defineMessages } from 'react-intl';

const msg = defineMessages({
  defaultContent: {
    id: 'Tooltip.PrivateInfo',
    defaultMessage: 'This info is private',
  },
});

/**
 * A lock icon with a tooltip indicating that this info is private
 */
const PrivateInfoIcon = ({ children, size, ...props }) => {
  const { formatMessage } = useIntl();
  return (
    <StyledTooltip childrenContainer="span" content={() => children || formatMessage(msg.defaultContent)}>
      <Lock size={size} {...props} />
    </StyledTooltip>
  );
};

PrivateInfoIcon.propTypes = {
  /** A message to display in the tooltip in place of the default one */
  children: PropTypes.node,
  size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

PrivateInfoIcon.defaultProps = {
  size: '1em',
};

export default PrivateInfoIcon;
