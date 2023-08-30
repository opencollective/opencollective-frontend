import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import ReactDOM from 'react-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { Manager, Popper, Reference } from 'react-popper';
import styled from 'styled-components';

import { ExpenseStatus } from '../../lib/graphql/types/v2/graphql';
import useGlobalBlur from '../../lib/hooks/useGlobalBlur';
import useKeyboardKey, { ESCAPE_KEY } from '../../lib/hooks/useKeyboardKey';
import { i18nExpenseStatus } from '../../lib/i18n/expense';

import { Box, Flex } from '../Grid';
import StyledButton from '../StyledButton';
import StyledSpinner from '../StyledSpinner';
import StyledTag from '../StyledTag';

import ConfirmProcessExpenseModal from './ConfirmProcessExpenseModal';
import { getExpenseStatusMsgType } from './ExpenseStatusTag';
import ProcessExpenseButtons, { ButtonLabel } from './ProcessExpenseButtons';

const ExpenseStatusTag = styled(StyledTag)`
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;
  line-height: 16px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const PopupContainer = styled(`div`)`
  z-index: 2;
  border-radius: 5px;
  font-size: 12px;
  text-transform: initial;
  white-space: normal;
  min-width: 200px;
  background: #ffffff;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);

  svg {
    display: none;
  }

  ${StyledSpinner} {
    display: block;
    margin: auto;
  }
`;

const Arrow = styled('div')`
  position: absolute;
  font-size: 8px;
  width: 3em;
  height: 3em;
  top: 0;
  left: 0;
  margin-top: -0.9em;
  &::before {
    content: '';
    margin: auto;
    display: block;
    border-style: solid;
    border-width: 0 1.5em 1em 1.5em;
    border-color: transparent transparent #ffffff transparent;
    filter: drop-shadow(0px -3px 3px rgba(20, 20, 20, 0.1));
  }
`;

const ChevronDownIcon = styled(ChevronDown)`
  width: 15px;
  height: 15px;
  cursor: pointer;
  color: inherit;
`;

const AdminExpenseStatusTag = ({ expense, host, collective, ...props }) => {
  const intl = useIntl();
  const wrapperRef = React.useRef();
  const [showPopup, setShowPopup] = React.useState(false);
  const [isClosable, setClosable] = React.useState(true);
  const [processModal, setProcessModal] = React.useState(false);
  const hideProcessExpenseButtons = expense?.status === ExpenseStatus.APPROVED;
  const buttonProps = { px: 2, py: 2, isBorderless: true, width: '100%', textAlign: 'left' };
  const status = expense.onHold ? 'ON_HOLD' : expense.status;

  const onClick = () => {
    setShowPopup(true);
  };

  // Close when clicking outside
  useGlobalBlur(wrapperRef, outside => {
    if (outside && isClosable && showPopup && !document.getElementById('mark-expense-as-unpaid-modal')) {
      setShowPopup(false);
    }
  });

  // Closes the modal upon the `ESC` key press.
  useKeyboardKey({
    callback: () => {
      if (isClosable) {
        setShowPopup(false);
      }
    },
    keyMatch: ESCAPE_KEY,
  });

  return (
    <React.Fragment>
      <Manager>
        <Reference>
          {({ ref }) => (
            <Box ref={ref} onClick={onClick}>
              <ExpenseStatusTag type={getExpenseStatusMsgType(status)} data-cy="admin-expense-status-msg" {...props}>
                <Flex>
                  {i18nExpenseStatus(intl, status)}
                  <ChevronDownIcon />
                </Flex>
              </ExpenseStatusTag>
            </Box>
          )}
        </Reference>

        {showPopup &&
          ReactDOM.createPortal(
            <Popper placement="bottom">
              {({ ref, style, arrowProps }) => (
                <PopupContainer ref={ref} style={style} onMouseEnter={onClick}>
                  <Flex alignItems="center" ref={wrapperRef} flexDirection="column" p={2}>
                    {!hideProcessExpenseButtons && (
                      <ProcessExpenseButtons
                        host={host}
                        buttonProps={buttonProps}
                        collective={collective}
                        expense={expense}
                        permissions={expense.permissions}
                        onModalToggle={isOpen => setClosable(!isOpen)}
                        onSuccess={() => setShowPopup(false)}
                        displaySecurityChecks={false}
                      />
                    )}
                    {expense?.permissions?.canMarkAsIncomplete && (
                      <StyledButton
                        {...buttonProps}
                        onClick={() => {
                          setProcessModal('MARK_AS_INCOMPLETE');
                        }}
                      >
                        <ButtonLabel>
                          <FormattedMessage id="actions.markAsIncomplete" defaultMessage="Mark as Incomplete" />
                        </ButtonLabel>
                      </StyledButton>
                    )}
                    {expense.permissions?.canHold && (
                      <StyledButton
                        {...buttonProps}
                        onClick={() => {
                          setProcessModal('HOLD');
                        }}
                      >
                        <ButtonLabel>
                          <FormattedMessage id="actions.hold" defaultMessage="Put On Hold" />
                        </ButtonLabel>
                      </StyledButton>
                    )}
                    {expense.permissions?.canRelease && (
                      <StyledButton
                        {...buttonProps}
                        onClick={() => {
                          setProcessModal('RELEASE');
                        }}
                      >
                        <ButtonLabel>
                          <FormattedMessage id="actions.release" defaultMessage="Release Hold" />
                        </ButtonLabel>
                      </StyledButton>
                    )}
                  </Flex>
                  <Arrow ref={arrowProps.ref} style={arrowProps.style} />
                </PopupContainer>
              )}
            </Popper>,
            document.body,
          )}
      </Manager>
      {processModal && (
        <ConfirmProcessExpenseModal type={processModal} expense={expense} onClose={() => setProcessModal(false)} />
      )}
    </React.Fragment>
  );
};

AdminExpenseStatusTag.propTypes = {
  collective: PropTypes.object.isRequired,
  expense: PropTypes.object.isRequired,
  host: PropTypes.object,
};

export default AdminExpenseStatusTag;
