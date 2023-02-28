import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { components as ReactSelectComponents } from 'react-select';
import styled from 'styled-components';
import { maxWidth } from 'styled-system';

import { i18nPaymentMethodType } from '../../../lib/i18n/payment-method-type';
import { sortSelectOptions } from '../../../lib/utils';

import { StyledSelectFilter } from '../../StyledSelectFilter';
import { Span } from '../../Text';

const NO_PAYMENT_METHOD_TYPE = 'None';

const getQueryStringFromOptionChange = (options, availableTypes, event) => {
  if (event.action === 'select-option' && event.option.value === 'ALL') {
    return null; // Clicked "All"
  } else if (!options) {
    return null; // Unselected everything
  }

  // Remove unsupported types
  const possibleOptions = options.filter(({ value }) => availableTypes.includes(value));
  return possibleOptions.length === availableTypes.length
    ? null // We've selected everything, go back to "ALL"
    : possibleOptions.map(({ value }) => value || NO_PAYMENT_METHOD_TYPE).join(',');
};

export const parseTransactionPaymentMethodTypes = str => {
  const result = str?.split(',').map(type => (type === NO_PAYMENT_METHOD_TYPE ? null : type));
  return result?.length ? result : null;
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

const TransactionsPaymentMethodTypeFilter = ({ onChange, value, types, ...props }) => {
  const intl = useIntl();
  const getOption = (value, idx) => ({ label: i18nPaymentMethodType(intl, value), value: value, idx });
  const options = ['ALL', ...types].map(getOption).sort(sortSelectOptions);
  const selectedTypes = value?.split(',') || [];
  const selectedOptions = !value
    ? [options[0]]
    : options.filter(({ value }) => selectedTypes.includes(value ?? NO_PAYMENT_METHOD_TYPE));

  return (
    <StyledSelectFilter
      isSearchable={false}
      isClearable={false}
      onChange={(options, event) => onChange(getQueryStringFromOptionChange(options, types, event))}
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

TransactionsPaymentMethodTypeFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
  types: PropTypes.arrayOf(PropTypes.string),
};

export default TransactionsPaymentMethodTypeFilter;
