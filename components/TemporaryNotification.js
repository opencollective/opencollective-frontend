import React from 'react';
import PropTypes from 'prop-types';
import themeGet from '@styled-system/theme-get';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';
import { position } from 'styled-system';

import { Box } from './Grid';
import StyledButton from './StyledButton';

const Notification = styled.div`
  top: 0;
  box-sizing: border-box;
  width: 100%;
  padding: 12px 24px;
  font-size: 14px;
  line-height: 21px;
  color: white;
  display: flex;
  align-items: center;
  z-index: 99;
  background: ${props => (props.type === 'error' ? themeGet('colors.red.600') : '#1869f5')};
  ${position}
  ${props =>
    props.position === 'absolute' &&
    css`
      left: 0;
    `}
`;

const DismissButton = styled(StyledButton).attrs({
  buttonStyle: 'secondary',
  buttonSize: 'tiny',
  color: 'blue.100',
  borderColor: 'blue.100',
})`
  background: transparent;
  border: 1px solid white;
  font-weight: normal;

  &:hover:not(:active):not(:disabled) {
    background: rgba(245, 250, 255, 0.25);
  }
`;

/**
 * Displays a temporary notification that can be dismissed by the user.
 */
const TemporaryNotification = ({ children, position, onDismiss, type }) => {
  const [isDismissed, setDismissed] = React.useState(false);

  if (isDismissed) {
    return null;
  }

  return (
    <Notification position={position} type={type} data-cy="temporary-notification">
      <Box mr="auto" />
      <Box>{children}</Box>
      <Box ml="auto">
        <DismissButton
          ml={2}
          data-cy="dismiss-temporary-notification-btn"
          onClick={() => {
            setDismissed(true);
            if (onDismiss) {
              onDismiss();
            }
          }}
        >
          <FormattedMessage id="Dismiss" defaultMessage="Dismiss" />
        </DismissButton>
      </Box>
    </Notification>
  );
};

TemporaryNotification.propTypes = {
  /** Called when the notification is dismissed */
  onDismiss: PropTypes.func,
  position: PropTypes.string,
  /** The content of the notification */
  children: PropTypes.node,
  /** Default to make banner info blue, error to make it red */
  type: PropTypes.string,
};

TemporaryNotification.defaultProps = {
  position: 'fixed',
  type: 'default',
};

export default TemporaryNotification;
