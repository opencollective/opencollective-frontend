import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import ReactDOM from 'react-dom';
import { useIntl } from 'react-intl';
import { Manager, Popper, Reference } from 'react-popper';
import styled from 'styled-components';
import { v4 as uuid } from 'uuid';

import expenseStatus from '../../lib/constants/expense-status';
import { i18nExpenseStatus } from '../../lib/i18n/expense';

import { Box, Flex } from '../Grid';
import StyledTag from '../StyledTag';

import { getExpenseStatusMsgType } from './ExpenseStatusTag';
import ProcessExpenseButtons from './ProcessExpenseButtons';

const ExpenseStatusTag = styled(StyledTag)`
  cursor: pointer;
  font-weight: bold;
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const StyledTooltipContainer = styled(`div`)`
  z-index: 2;
  border-radius: 5px;
  opacity: 1;
  box-shadow: 0px 3px 6px 1px rgba(20, 20, 20, 0.08);
  font-size: 12px;
  text-transform: initial;
  white-space: normal;
  background: #ffffff;
  box-shadow: 0px 4px 8px rgba(20, 20, 20, 0.16);
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
  const [showPopup, setShowPopup] = React.useState(false);
  const [id, setId] = React.useState(false);

  const onClick = () => {
    setShowPopup(true);
  };

  const onMouseLeave = () => {
    setShowPopup(false);
  };

  React.useEffect(() => {
    setId(`popup-${uuid()}`);
  });

  const isMounted = Boolean(id);

  return (
    <React.Fragment>
      <Manager>
        <Reference>
          {({ ref }) => (
            <Box ref={ref} onClick={onClick} onMouseLeave={onMouseLeave}>
              <ExpenseStatusTag
                type={getExpenseStatusMsgType(expense.status)}
                data-cy="admin-expense-status-msg"
                {...props}
              >
                <Flex>
                  {i18nExpenseStatus(intl, expense.status)}
                  <ChevronDownIcon />
                </Flex>
              </ExpenseStatusTag>
            </Box>
          )}
        </Reference>

        {showPopup &&
          isMounted &&
          ReactDOM.createPortal(
            <Popper placement="bottom">
              {({ ref, style, arrowProps }) => (
                <StyledTooltipContainer ref={ref} style={style} onMouseEnter={onClick} onMouseLeave={onMouseLeave}>
                  <Flex justifyContent="center" flexDirection="column" p={2}>
                    {[expenseStatus.REJECTED, expenseStatus.PAID].includes(expense.status) && (
                      <ProcessExpenseButtons
                        host={host}
                        buttonProps={{ mx: 1, py: 2, isBorderless: true }}
                        collective={collective}
                        expense={expense}
                        permissions={expense.permissions}
                      />
                    )}
                  </Flex>
                  <Arrow ref={arrowProps.ref} style={arrowProps.style} />
                </StyledTooltipContainer>
              )}
            </Popper>,
            document.body,
          )}
      </Manager>
    </React.Fragment>
  );
};

AdminExpenseStatusTag.propTypes = {
  expense: PropTypes.object.isRequired,
  collective: PropTypes.object.isRequired,
  host: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default AdminExpenseStatusTag;
