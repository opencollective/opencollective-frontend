import React from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '@rebass/grid';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import expenseTypes from '../../lib/constants/expenseTypes';
import Container from '../Container';
import StyledCard from '../StyledCard';
import { P } from '../Text';

const ExpenseTypeLabels = defineMessages({
  [expenseTypes.INVOICE]: {
    id: 'Expense.Type.Invoice',
    defaultMessage: 'Invoice',
  },
  [expenseTypes.RECEIPT]: {
    id: 'ExpenseForm.ReceiptLabel',
    defaultMessage: 'Receipt(s)',
  },
});

const ExpenseTypeDescription = defineMessages({
  [expenseTypes.RECEIPT]: {
    id: 'ExpenseForm.InvoiceDescription',
    defaultMessage: 'Get paid back for a purchase already made.',
  },
  [expenseTypes.INVOICE]: {
    id: 'ExpenseForm.ReceiptDescription',
    defaultMessage: 'Charge for your time or get paid in advance.',
  },
});

const ExpenseTypeOptionContainer = styled.label`
  display: flex;
  align-items: center;
  padding: 24px 16px;
  margin-bottom: 0;
  cursor: pointer;
  background: white;
  justify-content: flex-start;
  flex: 1 1 45%;
  min-width: 250px;

  &:hover {
    background: #f9f9f9;
  }

  // The following adds a border on top and left to separate items. Because parent has overflow=hidden,
  // only the required one will actually be displayed
  border-top: 1px solid #dcdee0;
  border-left: 1px solid #dcdee0;
  margin-top: -1px;
  margin-left: -1px;
`;

const ExpenseTypeOption = ({ name, type, defaultChecked }) => {
  const { formatMessage } = useIntl();
  return (
    <ExpenseTypeOptionContainer data-cy={`radio-expense-type-${type}`}>
      <input type="radio" name={name} value={type} defaultChecked={defaultChecked} />
      <Container background="#F7F8FA" border="1px dashed #C4C7CC" flex="0 0 64px" height={64} borderRadius={8} mx={3} />
      <Box maxWidth={250}>
        <P fontSize="LeadParagraph" fontWeight="bold" mb={2}>
          {formatMessage(ExpenseTypeLabels[type])}
        </P>
        <P fontSize="Caption" color="black.600" fontWeight="normal">
          {formatMessage(ExpenseTypeDescription[type])}
        </P>
      </Box>
    </ExpenseTypeOptionContainer>
  );
};

ExpenseTypeOption.propTypes = {
  name: PropTypes.string.isRequired,
  type: PropTypes.oneOf(Object.values(expenseTypes)).isRequired,
  defaultChecked: PropTypes.bool,
};

const Fieldset = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0;
`;

/**
 * To select expense's type.
 *
 * Using `StyledRadioList` should have been the default choice, but unfortunatelly
 * IE & Chrome don't support using `flex` on fieldset yet, so we have to create a custom
 * layout. See https://github.com/w3c/csswg-drafts/issues/321
 */
const ExpenseTypeRadioSelect = ({ name, onChange, value }) => {
  return (
    <StyledCard>
      <Fieldset onChange={onChange}>
        <Flex flexWrap="wrap" overflow="hidden">
          <ExpenseTypeOption name={name} type={expenseTypes.RECEIPT} defaultChecked={value === expenseTypes.RECEIPT} />
          <ExpenseTypeOption name={name} type={expenseTypes.INVOICE} defaultChecked={value === expenseTypes.INVOICE} />
        </Flex>
      </Fieldset>
    </StyledCard>
  );
};

ExpenseTypeRadioSelect.propTypes = {
  /** The name of the input in the DOM */
  name: PropTypes.string.isRequired,
  /** Default value */
  value: PropTypes.oneOf(Object.values(expenseTypes)),
  /** A function called with the new value when it changes */
  onChange: PropTypes.func,
};

ExpenseTypeRadioSelect.defaultProps = {
  name: 'expense-type',
};

export default React.memo(ExpenseTypeRadioSelect);
