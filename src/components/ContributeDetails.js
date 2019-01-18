import React from 'react';
import PropTypes from 'prop-types';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import moment from 'moment';
import { FormattedMessage } from 'react-intl';
import { get, isNil } from 'lodash';

import Container from './Container';
import { Flex } from '@rebass/grid';
import StyledButtonSet from './StyledButtonSet';
import StyledInputField from './StyledInputField';
import StyledSelect from './StyledSelect';
import { P, Span } from './Text';
import Currency from './Currency';
import StyledInputAmount from './StyledInputAmount';

const frequencyOptions = {
  oneTime: 'One time',
  month: 'Monthly',
  year: 'Yearly',
};

const getChangeFromState = state => ({
  totalAmount: state.totalAmount,
  interval: state.interval === 'oneTime' ? null : state.interval,
});

const enhance = compose(
  withState('state', 'setState', ({ amountOptions, defaultAmount, defaultInterval }) => {
    let totalAmount = 500;
    if (!isNil(defaultAmount)) {
      totalAmount = defaultAmount;
    } else if (amountOptions && amountOptions.length > 0) {
      totalAmount = amountOptions[Math.floor(amountOptions.length / 2)];
    }

    return {
      totalAmount,
      amount: totalAmount / 100,
      interval: defaultInterval || Object.keys(frequencyOptions)[0],
    };
  }),
  lifecycle({
    componentDidMount() {
      this.props.onChange(getChangeFromState(this.props.state));
    },
  }),
  withHandlers({
    onChange: ({ state, setState, onChange }) => newState => {
      newState = { ...state, ...newState };
      setState(newState);
      onChange(getChangeFromState(newState));
    },
  }),
);

const ContributeDetails = enhance(
  ({ amountOptions, currency, disabledInterval, disabledAmount, minAmount, onChange, state, ...props }) => {
    const hasOptions = get(amountOptions, 'length', 0) > 0;
    return (
      <Flex width={1} flexDirection={hasOptions ? 'column' : 'row'} flexWrap="wrap" {...props}>
        <Flex mb={3}>
          {hasOptions && (
            <StyledInputField
              label={
                <FormattedMessage
                  id="contribution.amount.currency.label"
                  values={{ currency }}
                  defaultMessage="Amount ({currency})"
                />
              }
              htmlFor="totalAmount"
              css={{ flexGrow: 1 }}
              disabled={disabledAmount}
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
          )}
          <Container minWidth={100} maxWidth={120} mr={!hasOptions && 3}>
            <StyledInputField
              label={
                hasOptions ? (
                  <FormattedMessage id="contribution.amount.other.label" defaultMessage="Other" />
                ) : (
                  <FormattedMessage
                    id="contribution.amount.currency.label"
                    values={{ currency }}
                    defaultMessage="Amount ({currency})"
                  />
                )
              }
              htmlFor="totalAmount"
              disabled={disabledAmount}
            >
              {fieldProps => (
                <StyledInputAmount
                  type="number"
                  currency={currency}
                  min={minAmount / 100}
                  {...fieldProps}
                  value={state.amount}
                  width={1}
                  onChange={({ target }) => onChange({ amount: target.value, totalAmount: Number(target.value) * 100 })}
                  containerProps={{ borderRadius: hasOptions ? '0 4px 4px 0' : 3, ml: '-1px' }}
                  prependProps={{ pl: 2, pr: 0, bg: 'white.full', color: 'black.800' }}
                  px="2px"
                />
              )}
            </StyledInputField>
          </Container>
        </Flex>

        <StyledInputField
          label={<FormattedMessage id="contribution.interval.label" defaultMessage="Frequency" />}
          htmlFor="interval"
          disabled={disabledInterval}
        >
          {fieldProps => (
            <Flex alignItems="center">
              <StyledSelect
                {...fieldProps}
                options={frequencyOptions}
                defaultValue={frequencyOptions[state.interval]}
                onChange={({ key }) => onChange({ interval: key })}
              >
                {({ value }) => <Container minWidth={100}>{value}</Container>}
              </StyledSelect>
              {state.interval !== 'oneTime' && (
                <P color="black.500" ml={3}>
                  <FormattedMessage id="contribution.subscription.next.label" defaultMessage="Next contribution: " />
                  <Span color="primary.500">
                    {moment()
                      .add(1, state.interval)
                      .date(1)
                      .format('MMM D, YYYY')}
                  </Span>
                </P>
              )}
            </Flex>
          )}
        </StyledInputField>
      </Flex>
    );
  },
);

ContributeDetails.propTypes = {
  /**
   * The list of amounts that user can pick directly. If not provided, only the
   * custom input will be shown.
   */
  amountOptions: PropTypes.arrayOf(PropTypes.number),
  currency: PropTypes.string.isRequired,
  onChange: PropTypes.func,
  /** If true, the select for interval will be disabled */
  disabledInterval: PropTypes.bool,
  /** If true, the input for amount will be disabled */
  disabledAmount: PropTypes.bool,
  /** Initial value for frequency select, defaults to one time. */
  defaultInterval: PropTypes.string,
  /** initial value for amount options, defaults to the first option */
  defaultAmount: PropTypes.number,
  /** Min amount in cents */
  minAmount: PropTypes.number,
};

ContributeDetails.defaultProps = {
  onChange: () => {},
  disabledInterval: false,
  disabledAmount: false,
  interval: null,
  minAmount: 100,
};

export default ContributeDetails;
