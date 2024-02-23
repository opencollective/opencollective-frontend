import React from 'react';
import { css } from '@styled-system/css';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import type { Currency as CurrencyEnum } from '../lib/graphql/types/v2/graphql';

import Currency from './Currency';
import { Flex } from './Grid';
import StyledButtonSet from './StyledButtonSet';

const getButtonDisplay = (index: number, options: (number | string)[], isSelected: boolean) => {
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

type ButtonTextProps = {
  isSelected: boolean;
};

const ButtonText = styled.span<ButtonTextProps>(props =>
  css({
    lineHeight: LINE_HEIGHTS,
    fontSize: props.isSelected ? FONT_SIZES : ['15px', null, '18px'],
    fontWeight: props.isSelected ? 500 : 400,
  }),
);

export const OTHER_AMOUNT_KEY = 'other';

type StyledAmountPickerProps = {
  currency: CurrencyEnum;
  value?: number | string;
  onChange?: (value: string | number) => void;
  presets?: number[];
};

/**
 * A money amount picker that shows a button set to pick between presets.
 */
const StyledAmountPicker = ({ presets, currency, value, onChange }: StyledAmountPickerProps) => {
  const hasPresets = presets?.length > 0;
  const options: Array<number | string> = hasPresets ? [...presets, OTHER_AMOUNT_KEY] : [OTHER_AMOUNT_KEY];

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
          onChange={onChange}
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
                    <Currency value={item as number} currency={currency} formatWithSeparators precision="auto" />
                  </ButtonText>
                );
            }
          }}
        </StyledButtonSet>
      )}
    </Flex>
  );
};

export default StyledAmountPicker;
