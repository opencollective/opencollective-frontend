import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { RecurringIntervalOptions } from '../../lib/i18n/expense';

import { Box, Flex } from '../Grid';
import StyledCard from '../StyledCard';
import StyledCheckbox from '../StyledCheckbox';
import StyledInput from '../StyledInput';
import StyledSelect from '../StyledSelect';
import { P, Span } from '../Text';

const ExpenseRecurringForm = ({ recurring, onChange, ...props }) => {
  const [isRecurring, setRecurring] = React.useState(false);

  const handleSetRecurring = isRecurring => {
    if (!isRecurring) {
      onChange(null);
    }
    setRecurring(isRecurring);
  };

  return (
    <StyledCard p={[16, 24, 32]} mt={4} borderStyle={'solid'} {...props}>
      <Box>
        <P color="black.800" fontWeight="700" fontSize="13px" lineHeight="20px">
          <FormattedMessage
            id="Expense.Summary.Recurring.CheckboxTitle"
            defaultMessage="Is this a recurring expense?"
          />
        </P>
        <P color="black.800" fontWeight="400" fontSize="13px" lineHeight="20px" mt={1}>
          <FormattedMessage
            id="Expense.Summary.Recurring.CheckboxDescription"
            defaultMessage="Choose this option to automatically submit a copy of this invoice on a periodic basis."
          />
        </P>

        <P mt={1}>
          <StyledCheckbox
            name="tos"
            label={
              <Span color="black.800" fontWeight="500" lineHeight="16px">
                <FormattedMessage
                  id="Expense.Summary.Recurring.CheckboxLabel"
                  defaultMessage="This is a recurring expense."
                />
              </Span>
            }
            size="13px"
            fontSize="13px"
            checked={isRecurring}
            onChange={({ checked }) => handleSetRecurring(checked)}
          />
        </P>

        {isRecurring && (
          <Flex flexDirection={['column', 'row']}>
            <Box mr={[0, 3]}>
              <P color="black.700" fontWeight="600" fontSize="13px" lineHeight="16px" mt={2} mb={1}>
                <FormattedMessage id="Frequency" defaultMessage="Frequency" />
              </P>
              <StyledSelect
                inputId="recurring-frequency"
                options={RecurringIntervalOptions}
                onChange={({ value: interval }) => onChange({ ...recurring, interval })}
                menuPlacement="auto"
                isSearchable={false}
              />
            </Box>
            <Box>
              <P color="black.700" fontWeight="600" fontSize="13px" lineHeight="16px" mt={2} mb={1}>
                <FormattedMessage id="EndDate" defaultMessage="End Date" />
              </P>
              <StyledInput
                type="date"
                inputId="recurring-end-date"
                onChange={event => onChange({ ...recurring, endsAt: event.target.value })}
                menuPlacement="auto"
                isSearchable={false}
                height="38px"
                width="100%"
              />
            </Box>
          </Flex>
        )}
      </Box>
    </StyledCard>
  );
};

ExpenseRecurringForm.propTypes = {
  onChange: PropTypes.func,
  recurring: PropTypes.shape({
    interval: PropTypes.string,
    endDate: PropTypes.endDate,
  }),
};

export default ExpenseRecurringForm;
