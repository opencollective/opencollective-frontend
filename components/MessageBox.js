import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from '@styled-icons/fa-solid/CheckCircle';
import { ExclamationCircle } from '@styled-icons/fa-solid/ExclamationCircle';
import { ExclamationTriangle } from '@styled-icons/fa-solid/ExclamationTriangle';
import { InfoCircle } from '@styled-icons/fa-solid/InfoCircle';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';
import { borders, color, display, flexbox, layout, shadow, space, typography } from 'styled-system';

import { whiteSpace } from '../lib/styled-system-custom-properties';
import { messageType } from '../lib/theme/variants/message';

import StyledCard from './StyledCard';
import StyledSpinner from './StyledSpinner';
import { H4, Span } from './Text';
import Image from './Image';
import { Box } from './Grid';

const Message = styled.div`
  border: 0.6px solid;
  border-radius: 12px;
  padding: ${themeGet('space.3')}px 24px;
  font-size: 13px;
  line-height: 20px;

  a {
    text-decoration: underline !important;
    color: ${themeGet('colors.black.800')};
  }

  h4 {
    font-size: 13px;
    margin: 0 0 8px 0;
    font-weight: 700;
  }

  display: flex;
  align-items: center;

  box-shadow: 0px 1px 4px 1px #3132331a;

  ${borders}
  ${shadow}
  ${display}
  ${layout}
  ${space}
  ${typography}
  ${color}
  ${flexbox}
  ${whiteSpace}

  ${messageType}

  svg[data-type="message-icon"] {
    vertical-align: text-bottom;
  }
`;

const icons = {
  info: <Image width="32" height="32" src="/static/images/lock.png" />,
  success: <Image width="32" height="32" src="/static/images/lock.png" />,
  warning: <Image width="32" height="32" src="/static/images/lock.png" />,
  error: <Image width="32" height="32" src="/static/images/lock.png" />,
};

// const icons = {
//   info: <InfoCircle data-type="message-icon" size="1em" color="#5CA3FF" />,
//   success: <CheckCircle data-type="message-icon" size="1em" color="#25B869" />,
//   warning: <ExclamationTriangle data-type="message-icon" size="1em" color="#CCCC18" />,
//   error: <ExclamationCircle data-type="message-icon" size="1em" color="#E03F6A" />,
// };

/**
 * Display messages in a box contextualized for message type (error, success...etc)
 */
const MessageBox = ({ withIcon, isLoading, children, title, action, ...props }) => {
  const icon = withIcon && icons[props.type];
  return (
    <Message {...props}>
      {isLoading ? (
        <Box flexShrink={0} mr={3} style={{ display: 'inline-block' }}>
          <StyledSpinner size="1.5em" />
        </Box>
      ) : (
        icon && (
          <Box flexShrink={0} mr={3} style={{ display: 'inline-block', verticalAlign: 'text-bottom' }}>
            {icon}
          </Box>
        )
      )}
      <div>
        {title && <h4> {title}</h4>}

        {children}

        {action && <Box mt={2}>{action}</Box>}
      </div>
    </Message>
  );
};

MessageBox.propTypes = {
  /** Type of the message */
  type: PropTypes.oneOf(['white', 'dark', 'info', 'success', 'warning', 'error']),
  /** Whether icon should be hidden. Icons are only set for info, success, warning and error messages. */
  withIcon: PropTypes.bool,
  /** If true, a `StyledSpinner` will be displayed instead of the normal icon */
  isLoading: PropTypes.bool,
  /** Message */
  children: PropTypes.node,
  /** All props from `StyledCard` */
  ...StyledCard.propTypes,
};

MessageBox.defaultProps = {
  type: 'white',
  withIcon: false,
};

export default MessageBox;
