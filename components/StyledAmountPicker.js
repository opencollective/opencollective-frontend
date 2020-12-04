import React from 'react';
import PropTypes from 'prop-types';
import css from '@styled-system/css';
import { isNil } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { getCurrencySymbol } from '../lib/currency-utils';

import Container from './Container';
import Currency from './Currency';
import { Flex } from './Grid';
import StyledButtonSet from './StyledButtonSet';
import StyledInputAmount from './StyledInputAmount';
import StyledInputField from './StyledInputField';

const getButtonDisplay = (index, options, isSelected) => {
  if (index === 0 || index === options.length - 1 || isSelected) {
    // Ensure first, last and selected values are always displayed
    return 'block';
  } else if (index < 2) {
    // Limit to 4 on medium screens
    return ['none', 'block'];
  } else if (index < 4) {
    // Limit to 3 on small screens
    return ['none', null, 'block'];
  } else {
    // Never show more than 5 options
    return 'none';
  }
};

const FONT_SIZES = ['15px', null, '20px'];
const LINE_HEIGHTS = ['23px', null, '28px'];

const ButtonText = styled.span(props =>
  css({
    lineHeight: LINE_HEIGHTS,
    fontSize: props.isSelected ? FONT_SIZES : ['15px', null, '18px'],
    fontWeight: props.isSelected ? 500 : 400,
  }),
);

export const OTHER_AMOUNT_KEY = 'other';

const prepareButtonSetOptions = (presets, otherAmountDisplay) => {
  if (otherAmountDisplay === 'button') {
    return [...presets, OTHER_AMOUNT_KEY];
  } else {
    return presets;
  }
};

/**
 * A money amount picker that shows a button set to pick between presets.
 */
const StyledAmountPicker = ({ presets, currency, value, otherAmountDisplay, onChange }) => {
  const [isOtherSelected, setOtherSelected] = React.useState(() => !isNil(value) && !presets?.includes(value));
  const hasPresets = presets?.length > 0;
  const options = hasPresets ? prepareButtonSetOptions(presets, otherAmountDisplay) : [OTHER_AMOUNT_KEY];

  React.useEffect(() => {
    if (value && !presets?.includes(value) && !isOtherSelected) {
      setOtherSelected(true);
    }
  }, [presets, value, isOtherSelected]);

  return (
    <Flex width="100%">
      {options.length > 0 && (
        <StyledButtonSet
          id="amount"
          data-cy="amount-picker"
          width="100%"
          justifyContent="center"
          items={options}
          buttonProps={{ px: 2, py: '5px' }}
          selected={value}
          buttonPropsBuilder={({ index, isSelected }) => ({
            display: getButtonDisplay(index, options, isSelected),
          })}
          onChange={value => {
            onChange(value);
            setOtherSelected(false);
          }}
        >
          {({ item, isSelected }) => {
            switch (item) {
              case OTHER_AMOUNT_KEY:
                return (
                  <ButtonText isSelected={isSelected} data-cy="amount-picker-btn-other">
                    <FormattedMessage id="contribution.amount.other.label" defaultMessage="Other" />
                  </ButtonText>
                );
              case 0:
                return (
                  <ButtonText isSelected={isSelected}>
                    <FormattedMessage id="Amount.Free" defaultMessage="Free" />
                  </ButtonText>
                );
              default:
                return (
                  <ButtonText isSelected={isSelected}>
                    <Currency value={item} currency={currency} abbreviate precision="auto" />
                  </ButtonText>
                );
            }
          }}
        </StyledButtonSet>
      )}
      {otherAmountDisplay === 'input' && (
        <Container minWidth={75} maxWidth={125} ml="-3px" height="100%">
          <StyledInputField
            htmlFor="custom-amount"
            labelColor="black.600"
            labelFontSize="14px"
            labelProps={{ mb: 1, pt: '10px', lineHeight: '18px' }}
            label={
              hasPresets ? (
                <FormattedMessage id="contribution.amount.other.label" defaultMessage="Other" />
              ) : (
                <FormattedMessage
                  id="contribution.amount.currency.label"
                  defaultMessage="Amount ({currency})"
                  values={{ currency: `${getCurrencySymbol(currency)}${currency}` }}
                />
              )
            }
          >
            {fieldProps => (
              <StyledInputAmount
                {...fieldProps}
                type="number"
                currency={currency}
                value={value || null}
                isEmpty={!isOtherSelected}
                placeholder="---"
                width={1}
                fontSize={FONT_SIZES}
                lineHeight={['21px', null, '26px']}
                px="2px"
                containerProps={{
                  borderRadius: hasPresets ? '0 4px 4px 0' : '4px',
                }}
                prependProps={{
                  pr: 1,
                  bg: '#FFFFFF',
                  fontSize: FONT_SIZES,
                  lineHeight: ['21px', null, '26px'],
                  color: isOtherSelected ? 'black.800' : 'black.400',
                }}
                onChange={value => {
                  onChange(value);
                  setOtherSelected(true);
                }}
                onBlur={() => setOtherSelected(!presets?.includes(value))}
              />
            )}
          </StyledInputField>
        </Container>
      )}
    </Flex>
  );
};

StyledAmountPicker.propTypes = {
  currency: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  presets: PropTypes.arrayOf(PropTypes.number),
  /** Whether to use a button rather than an input for "Other" */
  otherAmountDisplay: PropTypes.oneOf(['none', 'input', 'button']),
};

export default StyledAmountPicker;
