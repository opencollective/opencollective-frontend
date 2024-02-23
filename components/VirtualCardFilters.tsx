import React from 'react';
import { debounce, isNil, sortBy } from 'lodash';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import type { Collective, Currency } from '../lib/graphql/types/v2/graphql';
import { VirtualCardStatus } from '../lib/graphql/types/v2/graphql';
import { VirtualCardStatusI18n } from '../lib/virtual-cards/constants';

import AmountRangeFilter from './filters/AmountRangeFilter';
import PeriodFilter from './filters/PeriodFilter';
import { Box, Flex } from './Grid';
import StyledButton from './StyledButton';
import StyledInput from './StyledInput';
import { StyledSelectFilter } from './StyledSelectFilter';

const FilterContainer = styled.div`
  min-width: 150px;
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
  loading?: boolean;

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

  searchTerm?: string;
  onSearchTermChange: (searchTerm: string) => void;

  onCreateCardClick?: () => void;
  onAssignCardClick?: () => void;
};

const I18nMessages = defineMessages({
  RECEIPT_MISSING: { defaultMessage: 'Receipt missing' },
  NO_RECEIPT_MISSING: { defaultMessage: 'No receipt missing' },
  ALL: { id: 'VirtualCard.AllTypes', defaultMessage: 'All' },
  SEARCH_PLACEHOLDER: { defaultMessage: 'Search by name or last four digits of the card' },
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

  const collectiveOptions = React.useMemo(() => {
    return sortBy(
      props.collectivesWithVirtualCards.map(c => ({
        value: c.slug,
        label: c.parentAccount ? `${c.parentAccount.name} - ${c.name}` : c.name,
      })),
      'label',
    );
  }, [props.collectivesWithVirtualCards]);

  const onSearchTermChange = React.useMemo(() => {
    return debounce(e => props.onSearchTermChange(e.target.value), 500);
  }, [props.onSearchTermChange]);

  return (
    <Box width="100%">
      <Flex alignItems="center" justifyContent="center" flexWrap="wrap" gap="16px">
        <Box flexGrow={1} minWidth="250px">
          <StyledInput
            borderRadius="20px"
            id="virtual-card.searchTerm.filter"
            width="100%"
            placeholder={intl.formatMessage(I18nMessages.SEARCH_PLACEHOLDER)}
            defaultValue={props.searchTerm}
            onChange={onSearchTermChange}
          />
        </Box>
        <Box>
          <StyledButton
            disabled={props.loading}
            buttonStyle="primary"
            buttonSize="small"
            onClick={props.onCreateCardClick}
          >
            <FormattedMessage defaultMessage="Create virtual card" />
          </StyledButton>
        </Box>
        <Box>
          <StyledButton disabled={props.loading} buttonSize="small" onClick={props.onAssignCardClick}>
            <FormattedMessage id="Host.VirtualCards.AssignCard" defaultMessage="Assign Card" />
          </StyledButton>
        </Box>
      </Flex>
      <Flex alignItems="center" justifyContent="center" flexWrap="wrap" gap="16px" mt="16px">
        <FilterContainer>
          <FilterLabel htmlFor="virtual-card.collectives.filter">
            <FormattedMessage id="virtual-card.collectives.filter" defaultMessage="Assigned Collective" />
          </FilterLabel>
          <StyledSelectFilter
            intl={intl}
            inputId="virtual-card.collectives.filter"
            isLoading={props.loading}
            onChange={(newValue: { value: string }[]) => props.onCollectivesFilterChange(newValue.map(v => v.value))}
            isMulti={true}
            isSearchable
            value={
              !props.loading &&
              props.collectivesFilter
                .map(f => props.collectivesWithVirtualCards.find(o => o.slug === f))
                .map(c => ({
                  value: c.slug,
                  label: c.parentAccount ? `${c.parentAccount.name} - ${c.name}` : c.name,
                }))
            }
            options={collectiveOptions}
          />
        </FilterContainer>
        <FilterContainer>
          <FilterLabel htmlFor="virtual-card.status.filter">
            <FormattedMessage id="virtual-card.status.filter" defaultMessage="Status" />
          </FilterLabel>
          <StyledSelectFilter
            intl={intl}
            inputId="virtual-card.status.filter"
            onChange={(newValue: { value: VirtualCardStatus }[]) =>
              props.onVirtualCardStatusFilter(newValue.map(v => v.value))
            }
            isMulti={true}
            isLoading={props.loading}
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
            isLoading={props.loading}
            onChange={(newValue: { value: boolean }) => props.onMissingReceiptsChange(newValue.value)}
            value={missingReceiptValue}
            options={missingReceiptOptions}
          />
        </FilterContainer>
      </Flex>
    </Box>
  );
}
