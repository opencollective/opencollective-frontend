import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { getDateFromValue, toIsoDateStr } from '../../lib/date-utils';
import { RecurringIntervalOptions } from '../../lib/i18n/expense';

import { Box, Flex } from '../Grid';
import StyledCheckbox from '../StyledCheckbox';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';
import StyledSelect from '../StyledSelect';
import { P, Span } from '../Text';

const ExpenseRecurringForm = ({ recurring, onChange }) => {
  const [isRecurring, setRecurring] = React.useState(!!recurring);

  const handleSetRecurring = isRecurring => {
    if (!isRecurring) {
      onChange(null);
    }
    setRecurring(isRecurring);
  };

  return (
    <Box mt="50px">
      <StyledHr flex="1 1" borderColor="black.300" mb={4} />

      <P color="black.800" fontWeight="700" fontSize="13px" lineHeight="20px">
        <FormattedMessage id="Expense.Summary.Recurring.CheckboxTitle" defaultMessage="Is this a recurring expense?" />
      </P>

      <Box mt={2}>
        <StyledCheckbox
          name="tos"
          label={
            <Span color="black.800" fontWeight="500" lineHeight="16px">
              <FormattedMessage
                id="Expense.Summary.Recurring.CheckboxDescription"
                defaultMessage="Choose this option to automatically submit a copy of this invoice on a periodic basis."
              />
            </Span>
          }
          size="13px"
          fontSize="13px"
          checked={isRecurring}
          onChange={({ checked }) => handleSetRecurring(checked)}
        />
      </Box>

      {isRecurring && (
        <Flex flexDirection={['column', 'row']} mt={2}>
          <Box mr={[0, 3]} mb={[2, 0]}>
            <StyledInputField
              name="frequency"
              htmlFor="frequency"
              label={<FormattedMessage id="Frequency" defaultMessage="Frequency" />}
              labelFontSize="13px"
              labelFontWeight={600}
              required
            >
              {inputProps => (
                <StyledSelect
                  {...inputProps}
                  options={RecurringIntervalOptions}
                  onChange={({ value: interval }) => onChange({ ...recurring, interval })}
                  menuPlacement="auto"
                  value={RecurringIntervalOptions.find(i => i.value === recurring?.interval)}
                  isSearchable={false}
                />
              )}
            </StyledInputField>
          </Box>
          <Box>
            <StyledInputField
              name="endsAt"
              htmlFor="endsAt"
              label={<FormattedMessage id="EndDate" defaultMessage="End Date" />}
              labelFontSize="13px"
              labelFontWeight={600}
              required={false}
            >
              {inputProps => (
                <StyledInput
                  {...inputProps}
                  type="date"
                  onChange={event => onChange({ ...recurring, endsAt: getDateFromValue(event.target.value) })}
                  menuPlacement="auto"
                  height="38px"
                  width="100%"
                  value={recurring?.endsAt && toIsoDateStr(recurring.endsAt)}
                  min={toIsoDateStr(new Date())}
                />
              )}
            </StyledInputField>
          </Box>
        </Flex>
      )}
    </Box>
  );
};

ExpenseRecurringForm.propTypes = {
  onChange: PropTypes.func,
  recurring: PropTypes.shape({
    interval: PropTypes.string,
    endsAt: PropTypes.Date,
  }),
};

export default ExpenseRecurringForm;
