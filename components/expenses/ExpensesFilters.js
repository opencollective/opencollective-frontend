import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { encodeDateInterval } from '../../lib/date-utils';
import { ExpenseStatus } from '../../lib/graphql/types/v2/graphql';

import AmountFilter from '../budget/filters/AmountFilter';
import PeriodFilter from '../filters/PeriodFilter';
import { Flex } from '../Grid';
import { StyledSelectFilter } from '../StyledSelectFilter';

import ExpensesOrder from './filters/ExpensesOrder';
import ExpensesPayoutTypeFilter from './filters/ExpensesPayoutTypeFilter';
import ExpensesStatusFilter from './filters/ExpensesStatusFilter';
import ExpensesTypeFilter from './filters/ExpensesTypeFilter';

const FilterContainer = styled.div`
  margin-bottom: 8px;
  flex: 1 1 120px;
`;

const FilterLabel = styled.label`
  font-weight: 600;
  font-size: 9px;
  line-height: 14px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #9d9fa3;
`;

const I18nMessages = defineMessages({
  ALL: { id: 'VirtualCard.AllTypes', defaultMessage: 'All' },
  HAS_RECEIPTS: { id: 'VirtualCard.WithReceiptsFilter', defaultMessage: 'Has receipts' },
  HAS_NO_RECEIPTS: { id: 'VirtualCard.WithoutReceiptsFilter', defaultMessage: 'Has no receipts' },
});

const ExpensesFilters = ({
  collective,
  filters,
  onChange,
  explicitAllForStatus = false,
  showOrderFilter = true,
  wrap = true,
  displayOnHoldPseudoStatus = false,
  showChargeHasReceiptFilter = false,
  ...props
}) => {
  const intl = useIntl();
  const getFilterProps = (name, valueModifier) => ({
    inputId: `expenses-filter-${name}`,
    value: filters?.[name],
    onChange: value => {
      const preparedValue = valueModifier ? valueModifier(value) : value;
      const shouldNullValue = value === 'ALL' && !(explicitAllForStatus && name === 'status');
      onChange({ ...filters, [name]: shouldNullValue ? null : preparedValue });
    },
  });

  const chargeHasReceiptFilterValue = React.useMemo(
    () =>
      isNil(props.chargeHasReceiptFilter)
        ? {
            value: null,
            label: intl.formatMessage(I18nMessages.ALL),
          }
        : props.chargeHasReceiptFilter === true
          ? {
              value: true,
              label: intl.formatMessage(I18nMessages.HAS_RECEIPTS),
            }
          : {
              value: false,
              label: intl.formatMessage(I18nMessages.HAS_NO_RECEIPTS),
            },
    [intl, props.chargeHasReceiptFilter],
  );

  const chargeHasReceiptFilterOptions = React.useMemo(
    () => [
      {
        value: null,
        label: intl.formatMessage(I18nMessages.ALL),
      },
      {
        value: true,
        label: intl.formatMessage(I18nMessages.HAS_RECEIPTS),
      },
      {
        value: false,
        label: intl.formatMessage(I18nMessages.HAS_NO_RECEIPTS),
      },
    ],
    [intl],
  );

  return (
    <Flex flexWrap={['wrap', null, wrap ? 'wrap' : 'nowrap']} gap="18px">
      <FilterContainer>
        <FilterLabel htmlFor="expenses-filter-type">
          <FormattedMessage id="expense.type" defaultMessage="Type" />
        </FilterLabel>
        <ExpensesTypeFilter {...getFilterProps('type')} />
      </FilterContainer>
      <FilterContainer>
        <FilterLabel htmlFor="expenses-filter-payout">
          <FormattedMessage id="Payout" defaultMessage="Payout" />
        </FilterLabel>
        <ExpensesPayoutTypeFilter {...getFilterProps('payout')} />
      </FilterContainer>
      <FilterContainer>
        <FilterLabel htmlFor="expenses-filter-period">
          <FormattedMessage id="Period" defaultMessage="Period" />
        </FilterLabel>
        <PeriodFilter {...getFilterProps('period', encodeDateInterval)} minDate={collective.createdAt} />
      </FilterContainer>
      <FilterContainer>
        <FilterLabel htmlFor="expenses-filter-amount">
          <FormattedMessage id="Fields.amount" defaultMessage="Amount" />
        </FilterLabel>
        <AmountFilter currency={collective.currency} {...getFilterProps('amount')} />
      </FilterContainer>
      <FilterContainer>
        <FilterLabel htmlFor="expenses-filter-status">
          <FormattedMessage id="expense.status" defaultMessage="Status" />
        </FilterLabel>
        <ExpensesStatusFilter
          {...getFilterProps('status')}
          ignoredExpenseStatus={props.ignoredExpenseStatus}
          displayOnHoldPseudoStatus={displayOnHoldPseudoStatus}
        />
      </FilterContainer>
      {showOrderFilter && (
        <FilterContainer>
          <FilterLabel htmlFor="expenses-order">
            <FormattedMessage id="expense.order" defaultMessage="Order" />
          </FilterLabel>
          <ExpensesOrder {...getFilterProps('orderBy')} />
        </FilterContainer>
      )}
      {showChargeHasReceiptFilter && (
        <FilterContainer>
          <FilterLabel htmlFor="expenses-charge-has-receipts">
            <FormattedMessage id="expenses.chargeHasReceiptsFilter" defaultMessage="Charge Receipts" />
          </FilterLabel>
          <StyledSelectFilter
            inputId="expenses-charge-has-receipts"
            onChange={newValue => props.onChargeHasReceiptFilterChange(newValue.value)}
            value={chargeHasReceiptFilterValue}
            options={chargeHasReceiptFilterOptions}
          />
        </FilterContainer>
      )}
    </Flex>
  );
};

ExpensesFilters.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  showOrderFilter: PropTypes.bool,
  explicitAllForStatus: PropTypes.bool,
  collective: PropTypes.shape({
    currency: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
  }).isRequired,
  wrap: PropTypes.bool,
  ignoredExpenseStatus: PropTypes.arrayOf(PropTypes.oneOf(Object.values(ExpenseStatus))),
  displayOnHoldPseudoStatus: PropTypes.bool,
  showChargeHasReceiptFilter: PropTypes.bool,
  chargeHasReceiptFilter: PropTypes.bool,
  onChargeHasReceiptFilterChange: PropTypes.func,
};

export default React.memo(ExpensesFilters);
