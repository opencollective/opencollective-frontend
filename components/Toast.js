import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/fa-solid/Check';
import { Times } from '@styled-icons/fa-solid/Times';
import { Close } from '@styled-icons/material/Close';
import { defineMessages, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';
import { variant } from 'styled-system';

import { Flex } from './Grid';
import StyledRoundButton from './StyledButton';
import { TOAST_TYPE } from './ToastProvider';

const CloseButton = styled(StyledRoundButton).attrs({
  'data-cy': 'dismiss-toast-btn',
  buttonSize: 'tiny',
  isBorderless: true,
})``;

const ToastTitle = styled.span`
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const ToastMessage = styled.span`
  font-size: 13px;
  line-height: 20px;
  font-weight: 500;
  letter-spacing: 0;
  margin-top: 8px;
  word-break: break-word;
`;

const IconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  min-width: 28px;
  width: 28px;
  height: 28px;
  color: #ffffff;
`;

const Separator = styled.div`
  width: 4px;
  height: 100%;
  min-height: 40px;
  margin: 0 12px;
`;

const variantType = variant({
  variants: {
    light: {
      bg: '#ffffff',
      borderColor: '#FFFFFF',

      [ToastTitle]: { color: 'black.800' },
      [ToastMessage]: { color: 'black.600' },
      [CloseButton]: { color: 'black.500' },

      '&[data-type="INFO"]': {
        [IconContainer]: { bg: 'blue.600' },
        [Separator]: { bg: 'blue.600' },
      },
      '&[data-type="ERROR"]': {
        [IconContainer]: { bg: '#E03F6A' },
        [Separator]: { bg: '#E03F6A' },
      },
      '&[data-type="SUCCESS"]': {
        [IconContainer]: { bg: '#29CC75' },
        [Separator]: { bg: '#29CC75' },
      },
    },

    dark: {
      bg: '#5a5b5c',
      borderColor: 'black.700',

      [ToastTitle]: { color: '#FFFFFF' },
      [ToastMessage]: { color: 'black.300' },
      [CloseButton]: {
        color: 'black.200',
        '&:hover': { color: 'black.800', boxShadow: '4px 4px 4px #505050' },
      },

      '&[data-type="INFO"]': {
        [IconContainer]: { bg: 'blue.500' },
        [Separator]: { bg: 'blue.500' },
      },
      '&[data-type="ERROR"]': {
        [IconContainer]: { bg: 'red.400' },
        [Separator]: { bg: 'red.400' },
      },
      '&[data-type="SUCCESS"]': {
        [IconContainer]: { bg: '#29CC75' },
        [Separator]: { bg: '#29CC75' },
      },
      a: {
        color: 'white.full',
        textDecoration: 'underline',
      },
    },
  },
});

const StyledToast = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  padding: 24px;
  border-radius: 8px;
  border: 1px solid #efefef;
  opacity: 1;
  /** Above modals */
  z-index: 1000000;

  ${props =>
    !props.isClosing &&
    css`
      box-shadow: 0px 3px 7px -3px #bfbfbfa8;
      transition: box-shadow 0.2s;
      &:hover {
        box-shadow: 0px 3px 7px 0px #bfbfbfa8;
      }
    `}

  &:not(:hover) {
    ${props => {
      if (props.timeLeft <= 1000) {
        return css`
          opacity: 0.25;
          transition: opacity 2s;
        `;
      } else if (props.timeLeft <= 2500) {
        return css`
          opacity: 0.8;
          transition: opacity 2s;
        `;
      }
    }}
  }

  ${variantType}
`;

const DEFAULT_TITLES = defineMessages({
  [TOAST_TYPE.SUCCESS]: {
    id: 'Success',
    defaultMessage: 'Success',
  },
  [TOAST_TYPE.ERROR]: {
    id: 'Error',
    defaultMessage: 'Error',
  },
});

const getDefaultTitle = (intl, toastType) => {
  return DEFAULT_TITLES[toastType] ? intl.formatMessage(DEFAULT_TITLES[toastType]) : null;
};

const getIcon = toast => {
  if (toast.icon) {
    return toast.icon;
  }

  switch (toast.type) {
    case TOAST_TYPE.ERROR:
      return <Times size={12} />;
    default:
      return <Check size={12} />;
  }
};

const Toast = ({ toast, timeLeft, onClose, variant }) => {
  const intl = useIntl();
  const [isClosing, setClosing] = React.useState(false);

  return (
    <StyledToast
      timeLeft={timeLeft}
      isClosing={isClosing}
      data-type={toast.type}
      variant={variant}
      data-cy="toast-notification"
    >
      <Flex alignItems="center">
        <IconContainer>{getIcon(toast)}</IconContainer>
        <Separator />
        <Flex flexDirection="column" justifyContent="center">
          <ToastTitle>{toast.title || getDefaultTitle(intl, toast.type)}</ToastTitle>
          {toast.message && <ToastMessage>{toast.message}</ToastMessage>}
        </Flex>
      </Flex>
      <Flex alignItems="center">
        <CloseButton
          size={42}
          onClick={() => {
            setClosing(true);
            onClose();
          }}
        >
          <Close size={12} />
        </CloseButton>
      </Flex>
    </StyledToast>
  );
};

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(Object.values(TOAST_TYPE)).isRequired,
    title: PropTypes.node,
    icon: PropTypes.node,
    message: PropTypes.node,
    createdAt: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func,
  /** The time left before the toast disappears */
  timeLeft: PropTypes.number,
  variant: PropTypes.oneOf(['light', 'dark']),
};

Toast.defaultProps = {
  timeLeft: 6000,
  variant: 'dark',
};

export default Toast;
