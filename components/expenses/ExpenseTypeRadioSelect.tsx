import React from 'react';
import PropTypes from 'prop-types';
import { defineMessages, useIntl } from 'react-intl';
import styled from 'styled-components';

import expenseTypes from '../../lib/constants/expenseTypes';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Image from '../Image';
import StyledCard from '../StyledCard';
import { P } from '../Text';

const ExpenseTypeLabels = defineMessages({
  [expenseTypes.INVOICE]: {
    id: 'Expense.Type.Invoice',
    defaultMessage: 'Invoice',
  },
  [expenseTypes.RECEIPT]: {
    id: 'ExpenseForm.ReceiptLabel',
    defaultMessage: 'Reimbursement',
  },
  [expenseTypes.GRANT]: {
    id: 'ExpenseForm.Type.Request',
    defaultMessage: 'Request Grant',
  },
});

const ExpenseTypeDescription = defineMessages({
  [expenseTypes.RECEIPT]: {
    id: 'ExpenseForm.ReceiptDescription',
    defaultMessage: 'Get reimbursed for a purchase already made.',
  },
  [expenseTypes.INVOICE]: {
    id: 'ExpenseForm.InvoiceDescription',
    defaultMessage: 'Bill for your time or a service.',
  },
  [expenseTypes.GRANT]: {
    id: 'ExpenseForm.FundingRequestDescription',
    defaultMessage: 'Request a grant for your project or initiative.',
  },
});

const TypeIllustration = styled(Container)`
  position: absolute;
  background: white;
`;

const StaticTypeIllustration = styled(TypeIllustration)``;

const AnimatedTypeIllustration = styled(TypeIllustration)``;

const ExpenseTypeOptionContainer = styled.label`
  display: flex;
  align-items: baseline;
  padding: 15px 16px;
  margin-bottom: 0;
  cursor: pointer;
  background: white;
  justify-content: flex-start;
  flex: 1;

  // The following adds a border on top and left to separate items. Because parent has overflow=hidden,
  // only the required one will actually be displayed
  border-top: 1px solid #dcdee0;
  border-left: 1px solid #dcdee0;
  margin-top: -1px;
  margin-left: -1px;

  input[type='radio'] {
    margin-right: 4px;
  }

  // Animate gif on hover by hiding the static illustration
  &:hover {
    ${StaticTypeIllustration} {
      display: none;
    }
  }
  &:not(:hover) {
    ${AnimatedTypeIllustration} {
      display: none;
    }
  }
`;

const illustrations = {
  [expenseTypes.INVOICE]: '/static/images/invoice-animation.gif',
  [expenseTypes.RECEIPT]: '/static/images/receipt-animation.gif',
  [expenseTypes.GRANT]: '/static/images/grant-animation.gif',
};

const staticIllustrations = {
  [expenseTypes.INVOICE]: '/static/images/invoice-animation-static.jpg',
  [expenseTypes.RECEIPT]: '/static/images/receipt-animation-static.jpg',
  [expenseTypes.GRANT]: '/static/images/grant.gif',
};

const ExpenseTypeOption = ({ name, type, isChecked, onChange }) => {
  const { formatMessage } = useIntl();
  const illustrationSrc = illustrations[type] || '/static/images/receipt-animation.gif';
  const staticIllustrationSrc = staticIllustrations[type] || '/static/images/receipt-animation-static.jpg';
  return (
    <ExpenseTypeOptionContainer data-cy={`radio-expense-type-${type}`}>
      <Box alignSelf={['center', 'baseline', null, 'center']}>
        <input type="radio" name={name} value={type} checked={isChecked} onChange={onChange} />
      </Box>
      <Box flexShrink={0} mx={2} size={48} alignSelf="center" display={['block', 'none', null, 'block']}>
        <StaticTypeIllustration src={staticIllustrationSrc} />
        <TypeIllustration src={illustrationSrc} />
      </Box>
      <Box>
        <P fontSize="16px" fontWeight="bold" mb={2}>
          {formatMessage(ExpenseTypeLabels[type])}
        </P>
        <Flex alignItems="center">
          <Box flexShrink={0} mr={1} size={48} alignSelf="center" display={['none', 'block', null, 'none']}>
            <StaticTypeIllustration src={staticIllustrationSrc} />
            <TypeIllustration src={illustrationSrc} />
          </Box>
          <P fontSize="12px" color="black.600" fontWeight="normal">
            {formatMessage(ExpenseTypeDescription[type])}
          </P>
        </Flex>
      </Box>
    </ExpenseTypeOptionContainer>
  );
};

ExpenseTypeOption.propTypes = {
  name: PropTypes.string.isRequired,
  type: PropTypes.oneOf(Object.values(expenseTypes)).isRequired,
  isChecked: PropTypes.bool,
  onChange: PropTypes.func,
};

const Fieldset = styled.fieldset`
  border: none;
  padding: 0;
  margin: 0;
`;

const BASE_EXPENSE_TYPES = [expenseTypes.INVOICE, expenseTypes.RECEIPT, expenseTypes.GRANT];

/**
 * To select expense's type.
 *
 * Using `StyledRadioList` should have been the default choice, but unfortunately
 * IE & Chrome don't support using `flex` on fieldset yet, so we have to create a custom
 * layout. See https://github.com/w3c/csswg-drafts/issues/321
 */
const ExpenseTypeRadioSelect = ({ name, onChange, value, supportedExpenseTypes }) => {
  return (
    <StyledCard>
      <Fieldset onChange={onChange}>
        <Flex flexDirection={['column', 'row']} overflow="hidden">
          {BASE_EXPENSE_TYPES.filter(type => supportedExpenseTypes.includes(type)).map(type => (
            <ExpenseTypeOption key={type} name={name} type={type} isChecked={value === type} onChange={onChange} />
          ))}
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
  /** Supported expense types */
  supportedExpenseTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
};

ExpenseTypeRadioSelect.defaultProps = {
  name: 'expense-type',
};

export default React.memo(ExpenseTypeRadioSelect);
