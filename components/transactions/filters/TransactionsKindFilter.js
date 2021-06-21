import React from 'react';
import PropTypes from 'prop-types';
import { omit, size } from 'lodash';
import { useIntl } from 'react-intl';
import styled from 'styled-components';

import { TransactionKind } from '../../../lib/constants/transactions';
import { i18nTransactionKind } from '../../../lib/i18n/transaction';

import { StyledSelectFilter } from '../../StyledSelectFilter';

const DISPLAYED_TRANSACTION_KINDS = omit(TransactionKind, [
  'PLATFORM_FEE',
  'PREPAID_PAYMENT_METHOD',
  'PAYMENT_PROCESSOR_FEE',
]);

export const getDefaultKinds = () => {
  return [
    TransactionKind.ADDED_FUNDS,
    TransactionKind.CONTRIBUTION,
    TransactionKind.EXPENSE,
    TransactionKind.PLATFORM_TIP,
  ];
};

const optionsToQueryString = options => {
  if (!options || options.length === size(TransactionKind)) {
    return null;
  } else {
    return !options ? null : options.map(({ value }) => value).join(',');
  }
};

export const parseTransactionKinds = str => {
  const result = str?.split(',');
  if (!result?.length || result.length === size(TransactionKind)) {
    return null;
  } else {
    return result?.length ? result : null;
  }
};

const MultiKindSelect = styled(StyledSelectFilter)`
  div[class$='ValueContainer'] {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 70%;
    display: block;
  }
`;

const REACT_SELECT_COMPONENT_OVERRIDE = {
  MultiValue: ({ data, selectProps }) => {
    const totalItems = selectProps.value.length;
    if (data.idx === totalItems - 1) {
      return data.label;
    } else {
      return `${data.label}, `;
    }
  },
};

const TransactionsKindFilter = ({ onChange, value, ...props }) => {
  const intl = useIntl();
  const getOption = (value, idx) => ({ label: i18nTransactionKind(intl, value), value, idx });
  const options = React.useMemo(() => Object.values(DISPLAYED_TRANSACTION_KINDS).map(getOption), [intl]);
  const selectedOptions = React.useMemo(
    () => (!value ? getDefaultKinds() : parseTransactionKinds(value)).map(getOption),
    [value],
  );
  return (
    <MultiKindSelect
      isSearchable={false}
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

TransactionsKindFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default TransactionsKindFilter;
