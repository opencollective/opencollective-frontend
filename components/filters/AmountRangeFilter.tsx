import React from 'react';
import { ChevronDown } from '@styled-icons/boxicons-regular/ChevronDown';
import { isNil } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';
import type { Currency } from '../../lib/graphql/types/v2/graphql';

import { Box, Flex } from '../Grid';
import PopupMenu from '../PopupMenu';
import StyledButton from '../StyledButton';
import StyledCheckbox from '../StyledCheckbox';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';

import FilterButtonContainer from './FilterButtonContainer';

const I18N_LABELS = defineMessages({
  ALL: {
    id: 'Amount.AllShort',
    defaultMessage: 'All',
  },
  rangeFrom: {
    id: 'Amount.RangeFrom',
    defaultMessage: '{minAmount} and above',
  },
  rangeFromTo: {
    id: 'Amount.RangeFromTo',
    defaultMessage: '{minAmount} to {maxAmount}',
  },
});

type AmountRangeFilterProps = {
  inputId?: string;
  value?: {
    fromAmount: number;
    toAmount?: number;
  };
  currency: Currency;
  onChange(value?: { fromAmount: number; toAmount?: number });
};

export default function AmountRangeFilter(props: AmountRangeFilterProps) {
  const intl = useIntl();

  const [hasUpperLimit, setHasUpperLimit] = React.useState(!isNil(props.value?.toAmount));
  const [tempValue, setTempValue] = React.useState(props.value ?? { fromAmount: 0, toAmount: null });

  React.useEffect(() => {
    setTempValue(props.value);
    setHasUpperLimit(!isNil(props.value?.toAmount));
  }, [props.value]);

  const onClose = React.useCallback(() => {
    setTempValue(props.value);
    setHasUpperLimit(!isNil(props.value?.toAmount));
  }, [props.value]);

  const resetValue = React.useCallback(
    ({ closePopup }) => {
      setTempValue(null);
      setHasUpperLimit(false);
      props.onChange(null);
      closePopup();
    },
    [props.onChange],
  );

  const applyValue = React.useCallback(
    ({ closePopup }) => {
      props.onChange({ fromAmount: tempValue?.fromAmount ?? 0, toAmount: hasUpperLimit ? tempValue?.toAmount : null });

      closePopup();
    },
    [props.onChange, tempValue, hasUpperLimit],
  );

  const label = React.useMemo(() => {
    if (!props.value || (isNil(props.value.fromAmount) && isNil(props.value.toAmount))) {
      return intl.formatMessage(I18N_LABELS.ALL);
    }

    if (isNil(props.value.toAmount)) {
      return intl.formatMessage(I18N_LABELS.rangeFrom, {
        minAmount: formatCurrency(props.value.fromAmount, props.currency, { precision: 0, locale: intl.locale }),
      });
    }

    if (props.value?.toAmount === props.value?.fromAmount) {
      return formatCurrency(props.value?.fromAmount ?? 0, props.currency, { precision: 0, locale: intl.locale });
    }

    return intl.formatMessage(I18N_LABELS.rangeFromTo, {
      minAmount: formatCurrency(props.value?.fromAmount ?? 0, props.currency, { precision: 0, locale: intl.locale }),
      maxAmount: formatCurrency(props.value?.toAmount, props.currency, { precision: 0, locale: intl.locale }),
    });
  }, [intl, props.value?.fromAmount, props.value?.toAmount, props.currency]);

  return (
    <PopupMenu
      placement="bottom-start"
      onClose={onClose}
      Button={({ onClick }) => (
        <FilterButtonContainer onClick={onClick} id={props.inputId} data-cy="amount-filter">
          <Flex justifyContent="space-between" alignItems="center">
            {label}
            <ChevronDown size={25} color="#cccccc" />
          </Flex>
        </FilterButtonContainer>
      )}
    >
      {({ setOpen }) => (
        <Box mx="8px" my="8px" width="190px">
          <Flex flexDirection="column">
            <StyledInputField
              label={<FormattedMessage defaultMessage="From" />}
              labelFontWeight="700"
              labelProps={{ fontWeight: 'bold', fontSize: '16px' }}
              name="amountFrom"
              mt="12px"
              labelFontSize="16px"
            >
              {inputProps => (
                <StyledInputAmount
                  {...inputProps}
                  placeholder="0"
                  currencyDisplay="CODE"
                  currency={props.currency}
                  type="number"
                  maxWidth="100%"
                  precision={0}
                  lineHeight={1}
                  fontSize="13px"
                  value={tempValue?.fromAmount}
                  min={0}
                  step={1}
                  onChange={fromAmount => {
                    setTempValue({
                      ...tempValue,
                      fromAmount,
                    });
                  }}
                />
              )}
            </StyledInputField>
            <StyledInputField
              label={<FormattedMessage id="To" defaultMessage="To" />}
              labelFontWeight="700"
              labelProps={{ fontWeight: 'bold', fontSize: '16px', display: 'flex' }}
              name="amountTo"
              mt="12px"
              labelFontSize="16px"
            >
              {inputProps => (
                <Flex alignItems="center">
                  <StyledInputAmount
                    {...inputProps}
                    placeholder="0"
                    disabled={!hasUpperLimit}
                    currencyDisplay="CODE"
                    currency={props.currency}
                    type="number"
                    flexGrow={1}
                    precision={0}
                    lineHeight={1}
                    fontSize="13px"
                    maxWidth={null}
                    value={tempValue?.toAmount}
                    min={hasUpperLimit ? tempValue?.fromAmount ?? 0 : 0}
                    step={1}
                    onChange={toAmount => {
                      setTempValue({
                        ...tempValue,
                        toAmount,
                      });
                    }}
                  />
                  <Box width="14px" mx={2}>
                    <StyledCheckbox checked={hasUpperLimit} onChange={e => setHasUpperLimit(e.target.checked)} />
                  </Box>
                </Flex>
              )}
            </StyledInputField>
          </Flex>
          <Flex mt={2}>
            <StyledButton
              buttonSize="medium"
              mr={2}
              mt="12px"
              flex="1"
              onClick={() => resetValue({ closePopup: () => setOpen(false) })}
            >
              <FormattedMessage id="Reset" defaultMessage="Reset" />
            </StyledButton>
            <StyledButton
              buttonSize="medium"
              buttonStyle="primary"
              mt="12px"
              data-cy="btn-apply-period-filter"
              flex="1"
              onClick={() => applyValue({ closePopup: () => setOpen(false) })}
            >
              <FormattedMessage id="Apply" defaultMessage="Apply" />
            </StyledButton>
          </Flex>
        </Box>
      )}
    </PopupMenu>
  );
}
