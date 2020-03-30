import React from 'react';
import PropTypes from 'prop-types';
import { Box, Flex } from '@rebass/grid';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import expenseTypes from '../../lib/constants/expenseTypes';
import StyledCard from '../StyledCard';
import { P } from '../Text';

import receiptIllustration from '../../public/static/images/receipt-animation.gif';
import receiptIllustrationStatic from '../../public/static/images/receipt-animation-static.jpg';
import invoiceIllustration from '../../public/static/images/invoice-animation.gif';
import invoiceIllustrationStatic from '../../public/static/images/invoice-animation-static.jpg';

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

const TypeIllustration = styled.img.attrs({ alt: '' })`
  width: 64px;
  height: 64px;
`;

const StaticTypeIllustration = styled(TypeIllustration).attrs(props => ({
  src: props.expenseType === expenseTypes.RECEIPT ? receiptIllustrationStatic : invoiceIllustrationStatic,
}))`
  position: absolute;
  background: white;
`;

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

  // The following adds a border on top and left to separate items. Because parent has overflow=hidden,
  // only the required one will actually be displayed
  border-top: 1px solid #dcdee0;
  border-left: 1px solid #dcdee0;
  margin-top: -1px;
  margin-left: -1px;

  // Animate gif on hover by hidding the static illustration
  &:hover {
    ${StaticTypeIllustration} {
      opacity: 0;
    }
  }
`;

const ExpenseTypeOption = ({ name, type, defaultChecked }) => {
  const { formatMessage } = useIntl();
  return (
    <ExpenseTypeOptionContainer data-cy={`radio-expense-type-${type}`}>
      <input type="radio" name={name} value={type} defaultChecked={defaultChecked} />
      <Box mr={3}>
        <StaticTypeIllustration expenseType={type} />
        <TypeIllustration src={type === expenseTypes.RECEIPT ? receiptIllustration : invoiceIllustration} />
      </Box>
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
 * Using `StyledRadioList` should have been the default choice, but unfortunately
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
