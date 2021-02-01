import React from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';

import { TransactionTypes } from '../../../lib/constants/transactions';
import { i18nTransactionType } from '../../../lib/i18n/transaction';

import { StyledSelectFilter } from '../../StyledSelectFilter';

const TransactionTypeFilter = ({ onChange, value, ...props }) => {
  const intl = useIntl();
  const getOption = value => ({ label: i18nTransactionType(intl, value), value });

  return (
    <StyledSelectFilter
      isSearchable={false}
      onChange={({ value }) => onChange(value)}
      value={getOption(value || 'ALL')}
      options={[
        getOption('ALL'),
        getOption(TransactionTypes.CREDIT),
        getOption(TransactionTypes.DEBIT),
        getOption(TransactionTypes.GIFT_CARDS),
      ]}
      {...props}
    />
  );
};

TransactionTypeFilter.propTypes = {
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string,
};

export default TransactionTypeFilter;
