import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { Collective, VirtualCardStatus } from '../lib/graphql/types/v2/graphql';
import { VirtualCardStatusI18n } from '../lib/virtual-cards/constants';

import AmountRangeFilter from './filters/AmountRangeFilter';
import PeriodFilter from './filters/PeriodFilter';
import Container from './Container';
import { Flex } from './Grid';
import StyledCheckbox from './StyledCheckbox';
import StyledSelect from './StyledSelect';

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

  currency: string;
  totalSpent?: { fromAmount: number; toAmount?: number };
  onTotalSpentChange: (amount?: { fromAmount: number; toAmount?: number }) => void;
};

export default function VirtualCardFilters(props: VirtualCardFiltersProps) {
  const intl = useIntl();
  return (
    <Flex flexWrap={'wrap'} gap="18px">
      <FilterContainer>
        <FilterLabel htmlFor="virtual-card.collectives.filter">
          <FormattedMessage id="virtual-card.collectives.filter" defaultMessage="Assigned Collective" />
        </FilterLabel>
        <StyledSelect
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
        <StyledSelect
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
          <FormattedMessage id="virtual-card.missingReceipts.filter" defaultMessage="Missing Receipts" />
        </FilterLabel>
        <Container height="38px" position="relative" display="flex" alignItems="center">
          <StyledCheckbox
            inputId="virtual-card.missingReceipts.filter"
            checked={props.missingReceipts}
            onChange={p => props.onMissingReceiptsChange(p.checked)}
          />
        </Container>
      </FilterContainer>
    </Flex>
  );
}
