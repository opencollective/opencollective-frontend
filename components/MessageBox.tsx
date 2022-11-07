import React from 'react';
import { CheckCircle } from '@styled-icons/fa-solid/CheckCircle';
import { ExclamationCircle } from '@styled-icons/fa-solid/ExclamationCircle';
import { ExclamationTriangle } from '@styled-icons/fa-solid/ExclamationTriangle';
import { InfoCircle } from '@styled-icons/fa-solid/InfoCircle';
import { themeGet } from '@styled-system/theme-get';
import styled from 'styled-components';
import {
  borders,
  BordersProps,
  color,
  display,
  DisplayProps,
  flexbox,
  FlexboxProps,
  layout,
  LayoutProps,
  shadow,
  ShadowProps,
  space,
  SpaceProps,
  typography,
  TypographyProps,
} from 'styled-system';

import { whiteSpace, WhiteSpaceProps } from '../lib/styled-system-custom-properties';
import { MessageType, messageType } from '../lib/theme/variants/message';

import StyledSpinner from './StyledSpinner';
import { Span } from './Text';

type MessageProps = BordersProps &
  ShadowProps &
  DisplayProps &
  LayoutProps &
  SpaceProps &
  TypographyProps &
  FlexboxProps &
  WhiteSpaceProps & {
    type: MessageType;
  };

type MessageBoxProps = MessageProps & {
  isLoading?: boolean;
  withIcon?: boolean;
  children: React.ReactNode;
};

const Message = styled.div<MessageProps>`
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
  ${whiteSpace}

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
const MessageBox = ({ type = 'white', withIcon = false, isLoading, children, ...props }: MessageBoxProps) => {
  const icon = withIcon && icons[type];
  return (
    <Message type={type} {...props}>
      {isLoading && (
        <Span mr={2} style={{ display: 'inline-block' }}>
          <StyledSpinner size="1.5em" />
        </Span>
      )}
      {icon && !isLoading && (
        <Span mr={2} style={{ display: 'inline-block', verticalAlign: 'text-bottom' }}>
          {icon}
        </Span>
      )}
      {children}
    </Message>
  );
};

export default MessageBox;
