import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { display, layout, space, typography, shadow, color, flexbox } from 'styled-system';
import themeGet from '@styled-system/theme-get';

import { InfoCircle } from '@styled-icons/fa-solid/InfoCircle';
import { CheckCircle } from '@styled-icons/fa-solid/CheckCircle';
import { ExclamationCircle } from '@styled-icons/fa-solid/ExclamationCircle';
import { ExclamationTriangle } from '@styled-icons/fa-solid/ExclamationTriangle';

import { messageType } from '../lib/theme';
import { Span } from './Text';
import StyledCard from './StyledCard';
import StyledSpinner from './StyledSpinner';

const Message = styled.div`
  border: 1px solid;
  border-radius: 8px;
  padding: ${themeGet('space.3')}px;

  ${shadow}
  ${display}
  ${layout}
  ${space}
  ${typography}
  ${color}
  ${flexbox}

  ${messageType}
`;

const icons = {
  info: <InfoCircle size="1em" />,
  success: <CheckCircle size="1em" />,
  warning: <ExclamationTriangle size="1em" />,
  error: <ExclamationCircle size="1em" />,
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
        <Span mr={2} css={{ display: 'inline-block' }}>
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
  /** Weither icon should be hidden. Icons are only set for info, success, warning and error messages. */
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
