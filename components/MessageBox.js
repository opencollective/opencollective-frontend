import React from 'react';
import PropTypes from 'prop-types';
import { CheckCircle } from '@styled-icons/fa-solid/CheckCircle';
import { ExclamationCircle } from '@styled-icons/fa-solid/ExclamationCircle';
import { ExclamationTriangle } from '@styled-icons/fa-solid/ExclamationTriangle';
import { InfoCircle } from '@styled-icons/fa-solid/InfoCircle';
import themeGet from '@styled-system/theme-get';
import styled from 'styled-components';
import { borders, color, display, flexbox, layout, shadow, space, typography } from 'styled-system';

import { messageType } from '../lib/theme/variants/message';

import StyledCard from './StyledCard';
import StyledSpinner from './StyledSpinner';
import { Span } from './Text';

const Message = styled.div`
  border: 1px solid;
  border-radius: 12px;
  padding: ${themeGet('space.3')}px;

  a {
    text-decoration: underline !important;
  }

  ${borders}
  ${shadow}
  ${display}
  ${layout}
  ${space}
  ${typography}
  ${color}
  ${flexbox}

  ${messageType}

  svg[data-type="message-icon"] {
    vertical-align: text-bottom;
  }
`;

const icons = {
  info: <InfoCircle data-type="message-icon" size="1em" color="#5CA3FF" />,
  success: <CheckCircle data-type="message-icon" size="1em" color="#25B869" />,
  warning: <ExclamationTriangle data-type="message-icon" size="1em" color="#CCCC18" />,
  error: <ExclamationCircle data-type="message-icon" size="1em" color="#E03F6A" />,
};

/**
 * Display messages in a box contextualized for message type (error, success...etc)
 */
const MessageBox = ({ withIcon, isLoading, children, ...props }) => {
  const icon = withIcon && icons[props.type];
  return (
    <Message {...props}>
      {isLoading && (
        <Span mr={2} css={{ display: 'inline-block' }}>
          <StyledSpinner size="1.5em" />
        </Span>
      )}
      {icon && !isLoading && (
        <Span mr={2} css={{ display: 'inline-block', verticalAlign: 'text-bottom' }}>
          {icon}
        </Span>
      )}
      {children}
    </Message>
  );
};

MessageBox.propTypes = {
  /** Type of the message */
  type: PropTypes.oneOf(['white', 'dark', 'info', 'success', 'warning', 'error']),
  /** Wether icon should be hidden. Icons are only set for info, success, warning and error messages. */
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
