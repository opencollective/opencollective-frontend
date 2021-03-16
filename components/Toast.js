import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/fa-solid/Check';
import { Info } from '@styled-icons/fa-solid/Info';
import { Times } from '@styled-icons/fa-solid/Times';
import { Close } from '@styled-icons/material/Close';
import { defineMessages, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import Container from './Container';
import { Flex } from './Grid';
import StyledButton from './StyledButton';
import { Span } from './Text';
import { TOAST_TYPE } from './ToastProvider';

const StyledToast = styled.div`
  position: relative;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  padding: 24px;
  background: white;
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

const getColor = toast => {
  switch (toast.type) {
    case TOAST_TYPE.SUCCESS:
      return 'green.500';
    case TOAST_TYPE.ERROR:
      return 'red.500';
    default:
      return 'blue.500';
  }
};

const getDefaultTitle = (intl, toastType) => {
  return DEFAULT_TITLES[toastType] ? intl.formatMessage(DEFAULT_TITLES[toastType]) : null;
};

const getIcon = toast => {
  if (toast.icon) {
    return toast.icon;
  }

  switch (toast.type) {
    case TOAST_TYPE.SUCCESS:
      return <Check size={12} />;
    case TOAST_TYPE.ERROR:
      return <Times size={12} />;
    default:
      return <Info size={12} />;
  }
};

const Toast = ({ toast, timeLeft, onClose }) => {
  const intl = useIntl();
  const [isClosing, setClosing] = React.useState(false);
  const color = getColor(toast);
  return (
    <StyledToast timeLeft={timeLeft} isClosing={isClosing} data-cy="toast-notification">
      <Flex alignItems="center">
        <Container
          bg={color}
          height={28}
          width={28}
          minWidth={28}
          borderRadius="50%"
          display="flex"
          justifyContent="center"
          alignItems="center"
          color="#ffffff"
        >
          {getIcon(toast)}
        </Container>
        <Container width="4px" height="100%" minHeight="40px" mx="12px" bg={color} />
        <Flex flexDirection="column" justifyContent="center">
          <Span
            fontSize="11px"
            lineHeight="12px"
            fontWeight="500"
            textTransform="uppercase"
            letterSpacing="0.06em"
            color="black.800"
          >
            {toast.title || getDefaultTitle(intl, toast.type)}
          </Span>
          {toast.message && (
            <Span fontSize="12px" lineHeight="16px" fontWeight="500" letterSpacing="0.06em" color="black.600" mt={2}>
              {toast.message}
            </Span>
          )}
        </Flex>
      </Flex>
      <StyledButton
        data-cy="dismiss-toast-btn"
        buttonSize="tiny"
        isBorderless
        onClick={() => {
          setClosing(true);
          onClose();
        }}
      >
        <Close size={12} />
      </StyledButton>
    </StyledToast>
  );
};

Toast.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.string.isRequired,
    type: PropTypes.oneOf(Object.values(TOAST_TYPE)).isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    createdAt: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func,
  timeLeft: PropTypes.number,
};

Toast.defaultProps = {
  timeLeft: 6000,
};

export default Toast;
