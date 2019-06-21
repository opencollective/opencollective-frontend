import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import * as styledSystem from 'styled-system';
import themeGet from '@styled-system/theme-get';
import tag from 'clean-tag';
import { Box } from '@rebass/grid';

import { InfoCircle } from 'styled-icons/fa-solid/InfoCircle';
import { CheckCircle } from 'styled-icons/fa-solid/CheckCircle';
import { ExclamationCircle } from 'styled-icons/fa-solid/ExclamationCircle';
import { ExclamationTriangle } from 'styled-icons/fa-solid/ExclamationTriangle';

import { messageType } from '../constants/theme';
import StyledCard from './StyledCard';
import StyledSpinner from './StyledSpinner';

const Message = styled(Box)`
  border: 1px solid;
  border-radius: 8px;
  padding: ${themeGet('space.3')}px;

  ${styledSystem.display}
  ${styledSystem.height}
  ${styledSystem.maxHeight}
  ${styledSystem.maxWidth}
  ${styledSystem.minHeight}
  ${styledSystem.minWidth}

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
        <Box mr={2} css={{ display: 'inline-block' }}>
          <StyledSpinner size="1.5em" />
        </Box>
      )}
      {icon && !isLoading && (
        <Box mr={2} css={{ display: 'inline-block' }}>
          {icon}
        </Box>
      )}
      {children}
    </Message>
  );
};

MessageBox.propTypes = {
  /** @ignore */
  omitProps: PropTypes.arrayOf(PropTypes.string),
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
  omitProps: tag.defaultProps.omitProps.concat('type'),
};

export default MessageBox;
