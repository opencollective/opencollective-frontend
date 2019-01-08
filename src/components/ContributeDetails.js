import React from 'react';
import PropTypes from 'prop-types';
import { compose, withHandlers, withState } from 'recompose';
import moment from 'moment';
import { pick } from 'lodash';
import { FormattedMessage } from 'react-intl';

import Container from './Container';
import { Flex } from '@rebass/grid';
import StyledButtonSet from './StyledButtonSet';
import StyledInputField from './StyledInputField';
import StyledInput from './StyledInput';
import StyledSelect from './StyledSelect';
import { P, Span } from './Text';
import Currency from './Currency';

const frequencyOptions = {
  year: 'Yearly',
  month: 'Monthly',
};

const enhance = compose(
  withState('state', 'setState', ({ amountOptions, showFrequency, totalAmount, interval }) => ({
    amount: (totalAmount || amountOptions[0]) / 100,
    totalAmount: totalAmount || amountOptions[0],
    interval: showFrequency ? interval || Object.keys(frequencyOptions)[0] : undefined,
  })),
  withHandlers({
    onChange: ({ state, setState, onChange }) => newState => {
      newState = { ...state, ...newState };
      setState(newState);
      onChange(pick(newState, ['totalAmount', 'interval']));
    },
  }),
);

const ContributeDetails = enhance(({ amountOptions, currency, showFrequency, onChange, state }) => (
  <Container as="fieldset" border="none">
    <Flex>
      <StyledInputField
        label={
          <FormattedMessage
            id="contribution.amount.currency.label"
            values={{ currency }}
            defaultMessage="Amount ({currency})"
          />
        }
        htmlFor="totalAmount"
      >
        {fieldProps => (
          <StyledButtonSet
            {...fieldProps}
            combo
            items={amountOptions}
            selected={state.totalAmount}
            onChange={totalAmount => onChange({ totalAmount, amount: totalAmount / 100 })}
          >
            {({ item }) => <Currency value={item} currency={currency} />}
          </StyledButtonSet>
        )}
      </StyledInputField>
      <Container maxWidth={100}>
        <StyledInputField
          label={<FormattedMessage id="contribution.amount.other.label" defaultMessage="Other" />}
          htmlFor="totalAmount"
        >
          {fieldProps => (
            <StyledInput
              type="number"
              step="any"
              {...fieldProps}
              value={state.amount}
              fontSize="Paragraph"
              lineHeight="Paragraph"
              width={1}
              borderRadius="0 4px 4px 0"
              ml="-1px"
              onChange={({ target }) => onChange({ amount: target.value, totalAmount: Number(target.value) * 100 })}
            />
          )}
        </StyledInputField>
      </Container>
    </Flex>
    {showFrequency && (
      <Flex mt={3} alignItems="flex-end" width={0.5}>
        <StyledInputField
          label={<FormattedMessage id="contribution.interval.label" defaultMessage="Frequency" />}
          htmlFor="interval"
        >
          {fieldProps => (
            <StyledSelect
              {...fieldProps}
              options={frequencyOptions}
              defaultValue={frequencyOptions[state.interval]}
              onChange={({ key }) => onChange({ interval: key })}
            >
              {({ value }) => <Container minWidth={100}>{value}</Container>}
            </StyledSelect>
          )}
        </StyledInputField>
        <P color="black.500" ml={3} pb={2}>
          <FormattedMessage id="contribution.subscription.next.label" defaultMessage="Next contribution: " />
          <Span color="primary.500">
            {moment()
              .add(1, state.interval)
              .format('MMM d, YYYY')}
          </Span>
        </P>
      </Flex>
    )}
  </Container>
));

ContributeDetails.propTypes = {
  amountOptions: PropTypes.arrayOf(PropTypes.number).isRequired,
  currency: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  /** initial value for frequency select, defatuls to the first option */
  interval: PropTypes.string,
  showFrequency: PropTypes.bool,
  /** initial value for amount Options, defaults to the first option */
  totalAmount: PropTypes.number,
};

ContributeDetails.defaultProps = {
  onChange: () => {},
  showFrequency: false,
};

export default ContributeDetails;
