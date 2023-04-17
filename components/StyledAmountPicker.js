import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@styled-system/css';
import { isNil } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import Currency from './Currency';
import { Flex } from './Grid';
import StyledButtonSet from './StyledButtonSet';

const getButtonDisplay = (index, options, isSelected) => {
  if (index === 0 || index === options.length - 1 || isSelected) {
    // Ensure first, last and selected values are always displayed
    return 'inline-block';
  } else if (index < 2) {
    // Limit to 4 on medium screens
    return ['none', 'inline-block'];
  } else if (index < 4) {
    // Limit to 3 on small screens
    return ['none', null, 'inline-block'];
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

/**
 * A money amount picker that shows a button set to pick between presets.
 */
const StyledAmountPicker = ({ presets, currency, value, onChange }) => {
  const [isOtherSelected, setOtherSelected] = React.useState(() => !isNil(value) && !presets?.includes(value));
  const hasPresets = presets?.length > 0;
  const options = hasPresets ? [...presets, OTHER_AMOUNT_KEY] : [OTHER_AMOUNT_KEY];

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
          role="group"
          aria-label="Contribution amount"
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
                    <Currency value={item} currency={currency} formatWithSeparators precision="auto" />
                  </ButtonText>
                );
            }
          }}
        </StyledButtonSet>
      )}
    </Flex>
  );
};

StyledAmountPicker.propTypes = {
  currency: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  presets: PropTypes.arrayOf(PropTypes.number),
};

export default StyledAmountPicker;
