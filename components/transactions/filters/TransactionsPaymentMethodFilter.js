import React from 'react';
import PropTypes from 'prop-types';
import { intersection, size } from 'lodash';
import { useIntl } from 'react-intl';
import { components as ReactSelectComponents } from 'react-select';
import styled from 'styled-components';
import { maxWidth } from 'styled-system';

import { PAYMENT_METHOD_TYPE } from '../../../lib/constants/payment-methods';
import { i18nPaymentMethodType } from '../../../lib/i18n/payment-method-type';

import { StyledSelectFilter } from '../../StyledSelectFilter';
import { Span } from '../../Text';

// (!) Remember that any changes made here should be applied to the cache in API > `getCacheKeyForBudgetOrTransactionsSections`
export const getDefaultPaymentMethods = () => {
  return [
    PAYMENT_METHOD_TYPE.ALIPAY,
    PAYMENT_METHOD_TYPE.CREDITCARD,
    PAYMENT_METHOD_TYPE.PREPAID,
    PAYMENT_METHOD_TYPE.PAYMENT,
    PAYMENT_METHOD_TYPE.SUBSCRIPTION,
    PAYMENT_METHOD_TYPE.COLLECTIVE,
    PAYMENT_METHOD_TYPE.HOST,
    PAYMENT_METHOD_TYPE.ADAPTIVE,
    PAYMENT_METHOD_TYPE.GIFTCARD,
    PAYMENT_METHOD_TYPE.MANUAL,
    PAYMENT_METHOD_TYPE.CRYPTO,
  ];
};

const optionsToQueryString = options => {
  if (!options || options.length === size(PAYMENT_METHOD_TYPE)) {
    return null;
  } else {
    return !options ? null : options.map(({ value }) => value).join(',');
  }
};

export const parseTransactionPaymentMethods = str => {
  const result = str?.split(',');
  if (!result?.length || result.length === size(PAYMENT_METHOD_TYPE)) {
    return null;
  } else {
    return result?.length ? result : null;
  }
};

const TruncatedItemsList = styled(Span).attrs({
  truncateOverflow: true,
  pl: 2,
  maxWidth: ['calc(100vw - 135px)', '75px', '175px', '200px'],
})`
  display: inline-block;
  max-width: 75px;
  ${maxWidth}
`;

const TruncatedValueContainer = props => {
  const { selectProps, children } = props;
  const itemsList = (selectProps.value || []).map(({ label }) => label);
  const itemsListStr = itemsList.join(', ');

  return (
    <ReactSelectComponents.SelectContainer {...props}>
      <TruncatedItemsList title={itemsListStr}>{itemsListStr}</TruncatedItemsList>
      {children}
    </ReactSelectComponents.SelectContainer>
  );
};

TruncatedValueContainer.propTypes = {
  selectProps: PropTypes.object,
  children: PropTypes.node,
};

const REACT_SELECT_COMPONENT_OVERRIDE = {
  ValueContainer: TruncatedValueContainer,
  MultiValue: () => null, // Items will be displayed as a truncated string in `TruncatedValueContainer `
};

const TransactionsPaymentMethodFilter = ({ onChange, value, paymentMethod, ...props }) => {
  const intl = useIntl();
  const getOption = (value, idx) => ({ label: i18nPaymentMethodType(intl, value), value, idx });
  const displayedPaymentMethods = paymentMethod && paymentMethod.length ? paymentMethod : getDefaultPaymentMethods();
  const options = displayedPaymentMethods.map(getOption);
  const selectedOptions = React.useMemo(
    () =>
      (!value
        ? intersection(getDefaultPaymentMethods(), displayedPaymentMethods)
        : parseTransactionPaymentMethods(value)
      ).map(getOption),
    [value],
  );
  return (
    <StyledSelectFilter
      isSearchable={false}
      isClearable={false}
      onChange={options => onChange(optionsToQueryString(options))}
      value={selectedOptions}
      options={options}
      components={REACT_SELECT_COMPONENT_OVERRIDE}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      isMulti
      maxWidth={['100%', 200, 300]}
      minWidth={150}
      {...props}
    />
  );
};

TransactionsPaymentMethodFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  paymentMethod: PropTypes.array,
};

export default TransactionsPaymentMethodFilter;
