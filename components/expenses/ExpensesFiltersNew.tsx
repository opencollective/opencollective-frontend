import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import expenseTypes from '../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { formatCurrency } from '../../lib/currency-utils';
import { encodeDateInterval } from '../../lib/date-utils';
import { ExpenseStatus, ExpenseStatusFilter } from '../../lib/graphql/types/v2/graphql';
import { i18nExpenseStatus, i18nExpenseType } from '../../lib/i18n/expense';
import i18nPayoutMethodType from '../../lib/i18n/payout-method-type';
import { sortSelectOptions } from '../../lib/utils';

import AmountFilter from '../budget/filters/AmountFilter';
import { FilterOptions, FilterType, OptionType } from '../filters/FilterCombo';
import PeriodFilter from '../filters/PeriodFilter';
import { Flex } from '../Grid';
import { StyledSelectFilter } from '../StyledSelectFilter';

import ExpensesOrder from './filters/ExpensesOrder';
import ExpensesPayoutTypeFilter from './filters/ExpensesPayoutTypeFilter';
import ExpensesStatusFilter from './filters/ExpensesStatusFilter';
import ExpensesTypeFilter from './filters/ExpensesTypeFilter';
import Filterbar from '../filters';
import { useRouter } from 'next/router';
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

const OPTION_LABELS = defineMessages({
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

const IGNORED_EXPENSE_STATUS = [ExpenseStatusFilter.UNVERIFIED];

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
  ignoredExpenseStatus = IGNORED_EXPENSE_STATUS,
  pageRoute,
  ...props
}) => {
  const router = useRouter();

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
  ignoredExpenseStatus = ignoredExpenseStatus || [];

  if (!displayOnHoldPseudoStatus) {
    ignoredExpenseStatus = [...ignoredExpenseStatus, ExpenseStatusFilter.ON_HOLD];
    // ignoredExpenseStatus.push(ExpenseStatusFilter.ON_HOLD);
  }

  const filterOptions: FilterOptions = React.useMemo(
    () => [
      {
        key: 'searchTerm',
        static: true,
        filterType: FilterType.TEXT_INPUT,
        label: intl.formatMessage({ id: 'Search', defaultMessage: 'Search...' }),
      },
      {
        key: 'type',
        static: true,
        filterType: FilterType.SELECT,
        label: intl.formatMessage({ id: 'expense.type', defaultMessage: 'Type' }),
        options: Object.keys(expenseTypes)
          .map(value => ({ label: i18nExpenseType(intl, value), value }))
          .sort(sortSelectOptions),
      },
      {
        key: 'payout',
        filterType: FilterType.SELECT,
        label: intl.formatMessage({ id: 'Payout', defaultMessage: 'Payout' }),
        options: Object.keys(PayoutMethodType).map(value => ({
          label: i18nPayoutMethodType(intl, value),
          value,
        })),
      },
      {
        key: 'period',
        filterType: FilterType.DATE,
        label: intl.formatMessage({ id: 'Period', defaultMessage: 'Period' }),
        options: [
          {
            label: 'Today',
            value: 'TODAY',
          },
          {
            label: 'Yesterday',
            value: 'YESTERDAY',
            type: OptionType.PERIOD,
          },
          { label: 'Date range', value: 'DATE_RANGE', type: OptionType.CUSTOM_DATE_RANGE },
        ],
      },

      {
        key: 'status',
        static: false,
        filterType: FilterType.SELECT,
        label: intl.formatMessage({ id: 'expense.status', defaultMessage: 'Status' }),
        options: Object.values(ExpenseStatusFilter)
          .filter(s => !ignoredExpenseStatus.includes(s))
          .map(value => ({ label: i18nExpenseStatus(intl, value), value }))
          .sort(sortSelectOptions),
      },
      {
        key: 'amount',
        filterType: FilterType.SELECT,
        label: intl.formatMessage({ id: 'Fields.amount', defaultMessage: 'Amount' }),
        options: [0, 50, 500, 5000].map((step, i, steps) => {
          const maxAmount = steps[i + 1];
          const minAmount = step;
          return {
            value: maxAmount ? `${minAmount}-${maxAmount}` : `${minAmount}+`,
            label: intl.formatMessage(OPTION_LABELS[maxAmount ? 'rangeFromTo' : 'rangeFrom'], {
              minAmount: formatCurrency(minAmount * 100, collective.currency, { precision: 0, locale: intl.locale }),
              maxAmount: formatCurrency(maxAmount * 100, collective.currency, { precision: 0, locale: intl.locale }),
            }),
          };
        }),
      },
      {
        key: 'chargeHasReceipts',
        filterType: FilterType.SELECT,
        label: intl.formatMessage({ id: 'expenses.chargeHasReceiptsFilter', defaultMessage: 'Charge Receipts' }),
        options: chargeHasReceiptFilterOptions,
      },
    ],
    [intl, ignoredExpenseStatus],
  );
  return (
    <Filterbar
      query={filters}
      filterOptions={filterOptions}
      // views={views}
      onChange={query => {
        router.push(
          {
            pathname: pageRoute,
            query,
          },
          undefined,
          { scroll: false },
        );
      }}
    />
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
  ignoredExpenseStatus: PropTypes.arrayOf(PropTypes.oneOf(Object.values(ExpenseStatusFilter))),
  displayOnHoldPseudoStatus: PropTypes.bool,
  showChargeHasReceiptFilter: PropTypes.bool,
  chargeHasReceiptFilter: PropTypes.bool,
  onChargeHasReceiptFilterChange: PropTypes.func,
};

export default React.memo(ExpensesFilters);
