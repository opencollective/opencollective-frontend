import { defineMessages } from 'react-intl';

import expenseTypes from '../../lib/constants/expenseTypes';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { formatCurrency } from '../../lib/currency-utils';
import { ExpenseStatusFilter } from '../../lib/graphql/types/v2/graphql';
import { i18nExpenseStatus, i18nExpenseType } from '../../lib/i18n/expense';
import i18nPayoutMethodType from '../../lib/i18n/payout-method-type';
import { sortSelectOptions } from '../../lib/utils';

import { FilterOptions, FilterType, OptionType } from '../filters/types';

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

export const getExpensesFilterOptions = ({
  intl,
  collective,
  displayOnHoldPseudoStatus = false,
  ignoredExpenseStatus = IGNORED_EXPENSE_STATUS,
}) => {
  // const getFilterProps = (name, valueModifier) => ({
  //   inputId: `expenses-filter-${name}`,
  //   value: filters?.[name],
  //   onChange: value => {
  //     const preparedValue = valueModifier ? valueModifier(value) : value;
  //     const shouldNullValue = value === 'ALL' && !(explicitAllForStatus && name === 'status');
  //     onChange({ ...filters, [name]: shouldNullValue ? null : preparedValue });
  //   },
  // });

  const chargeHasReceiptFilterOptions = [
    {
      value: true,
      label: intl.formatMessage(I18nMessages.HAS_RECEIPTS),
    },
    {
      value: false,
      label: intl.formatMessage(I18nMessages.HAS_NO_RECEIPTS),
    },
  ];
  let ignoredExpenseStatuses = ignoredExpenseStatus || [];

  if (!displayOnHoldPseudoStatus) {
    ignoredExpenseStatuses = [...ignoredExpenseStatuses, ExpenseStatusFilter.ON_HOLD];
    // ignoredExpenseStatus.push(ExpenseStatusFilter.ON_HOLD);
  }

  const filterOptions: FilterOptions = [
    {
      key: 'searchTerm',
      static: true,
      filterType: FilterType.TEXT_INPUT,
      label: intl.formatMessage({ id: 'Search', defaultMessage: 'Search...' }),
    },
    {
      key: 'type',
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
      static: true,
      filterType: FilterType.SELECT,
      label: intl.formatMessage({ id: 'expense.status', defaultMessage: 'Status' }),
      options: Object.values(ExpenseStatusFilter)
        .filter(s => !ignoredExpenseStatuses.includes(s))
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
            minAmount: formatCurrency(minAmount * 100, collective?.currency, { precision: 0, locale: intl.locale }),
            maxAmount: formatCurrency(maxAmount * 100, collective?.currency, { precision: 0, locale: intl.locale }),
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
  ];

  return filterOptions;
};
