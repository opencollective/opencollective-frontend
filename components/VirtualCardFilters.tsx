import React from 'react';
import { isNil } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { Collective, Currency, VirtualCardStatus } from '../lib/graphql/types/v2/graphql';
import { VirtualCardStatusI18n } from '../lib/virtual-cards/constants';

import AmountRangeFilter from './filters/AmountRangeFilter';
import PeriodFilter from './filters/PeriodFilter';
import { Flex } from './Grid';
import { StyledSelectFilter } from './StyledSelectFilter';

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

type Period = {
  from: Date;
  to: Date;
  timezoneType: 'UTC' | 'local';
};

type VirtualCardFiltersProps = {
  collectivesWithVirtualCards: Collective[];
  collectivesFilter: string[];
  onCollectivesFilterChange: (c: string[]) => void;

  virtualCardStatusFilter: string[];
  onVirtualCardStatusFilter: (c: string[]) => void;

  expensePeriod?: Period;
  onExpensePeriodChange: (p: Period) => void;

  missingReceipts?: boolean;
  onMissingReceiptsChange: (v: boolean) => void;

  currency: Currency;
  totalSpent?: { fromAmount: number; toAmount?: number };
  onTotalSpentChange: (amount?: { fromAmount: number; toAmount?: number }) => void;
};

const I18nMessages = defineMessages({
  RECEIPT_MISSING: { defaultMessage: 'Receipt missing' },
  NO_RECEIPT_MISSING: { defaultMessage: 'No receipt missing' },
  ALL: { defaultMessage: 'All' },
});

export default function VirtualCardFilters(props: VirtualCardFiltersProps) {
  const intl = useIntl();

  const missingReceiptOptions = React.useMemo(
    () => [
      {
        value: null,
        label: intl.formatMessage(I18nMessages.ALL),
      },
      {
        value: true,
        label: intl.formatMessage(I18nMessages.RECEIPT_MISSING),
      },
      {
        value: false,
        label: intl.formatMessage(I18nMessages.NO_RECEIPT_MISSING),
      },
    ],
    [intl],
  );

  const missingReceiptValue = React.useMemo(
    () =>
      isNil(props.missingReceipts)
        ? {
            value: null,
            label: intl.formatMessage(I18nMessages.ALL),
          }
        : props.missingReceipts === true
        ? {
            value: true,
            label: intl.formatMessage(I18nMessages.RECEIPT_MISSING),
          }
        : {
            value: false,
            label: intl.formatMessage(I18nMessages.NO_RECEIPT_MISSING),
          },
    [intl, props.missingReceipts],
  );

  return (
    <Flex flexWrap={'wrap'} gap="18px">
      <FilterContainer>
        <FilterLabel htmlFor="virtual-card.collectives.filter">
          <FormattedMessage id="virtual-card.collectives.filter" defaultMessage="Assigned Collective" />
        </FilterLabel>
        <StyledSelectFilter
          intl={intl}
          inputId="virtual-card.collectives.filter"
          onChange={newValue => props.onCollectivesFilterChange(newValue.map(v => v.value))}
          isMulti={true}
          value={props.collectivesFilter
            .map(f => props.collectivesWithVirtualCards.find(o => o.slug === f))
            .map(c => ({
              value: c.slug,
              label: c.parentAccount ? `${c.parentAccount.name} - ${c.name}` : c.name,
            }))}
          options={props.collectivesWithVirtualCards.map(c => ({
            value: c.slug,
            label: c.parentAccount ? `${c.parentAccount.name} - ${c.name}` : c.name,
          }))}
        />
      </FilterContainer>
      <FilterContainer>
        <FilterLabel htmlFor="virtual-card.status.filter">
          <FormattedMessage id="virtual-card.status.filter" defaultMessage="Status" />
        </FilterLabel>
        <StyledSelectFilter
          intl={intl}
          inputId="virtual-card.status.filter"
          onChange={newValue => props.onVirtualCardStatusFilter(newValue.map(v => v.value))}
          isMulti={true}
          value={props.virtualCardStatusFilter.map(c => ({
            value: c,
            label: intl.formatMessage(VirtualCardStatusI18n[c]),
          }))}
          options={Object.values(VirtualCardStatus).map(c => ({
            value: c,
            label: intl.formatMessage(VirtualCardStatusI18n[c]),
          }))}
        />
      </FilterContainer>
      <FilterContainer>
        <FilterLabel htmlFor="virtual-card.expensePeriod.filter">
          <FormattedMessage id="virtual-card.expensePeriod.filter" defaultMessage="Expense Period" />
        </FilterLabel>
        <PeriodFilter
          inputId="virtual-card.expensePeriod.filter"
          value={props.expensePeriod}
          onChange={p => props.onExpensePeriodChange(p)}
        />
      </FilterContainer>
      <FilterContainer>
        <FilterLabel htmlFor="virtual-card.amount.filter">
          <FormattedMessage id="virtual-card.amount.filter" defaultMessage="Amount Charged" />
        </FilterLabel>
        <AmountRangeFilter
          currency={props.currency}
          value={props.totalSpent}
          inputId="virtual-card.amount.filter"
          onChange={props.onTotalSpentChange}
        />
      </FilterContainer>
      <FilterContainer>
        <FilterLabel htmlFor="virtual-card.missingReceipts.filter">
          <FormattedMessage id="virtual-card.missingReceipts.filter" defaultMessage="Receipts" />
        </FilterLabel>
        <StyledSelectFilter
          intl={intl}
          inputId="virtual-card.missingReceipts.filter"
          onChange={newValue => props.onMissingReceiptsChange(newValue.value)}
          value={missingReceiptValue}
          options={missingReceiptOptions}
        />
      </FilterContainer>
    </Flex>
  );
}
