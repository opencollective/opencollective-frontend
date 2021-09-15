import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { formatCurrency } from '../../../lib/currency-utils';

import PeriodFilter from '../../budget/filters/PeriodFilter';
import CollectivePickerAsync from '../../CollectivePickerAsync';
import Container from '../../Container';
import { Flex } from '../../Grid';
import { P, Span } from '../../Text';

const FilterLabel = styled.label`
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #4e5052;
`;

const FundAmounts = styled.div`
  width: 100%;
  height: 48px;
  border-radius: 10px;
  background-color: #29cc75;
  border-right: 360px solid #e03f6a;
  padding-top: 10px;
  padding-left: 5px;
  @media (max-width: 1025px) {
    height: 130px;
    background-color: #29cc75;
    border-right: 0px;
    border-bottom: 40px solid #e03f6a;
  }
`;

const TotalFundsLabel = styled(Container)`
  display: table-cell;
  padding-left: 10px;
  height: 26px;
  border-radius: 5px;
  background-color: white;
  opacity: 80%;
  vertical-align: middle;
`;

const Square = styled(Container)`
  width: 8px;
  height: 8px;
  display: inline-block;
  background-color: ${props => props.color};
`;

const TransactionsOverviewSection = ({ currency, filters, onChange }) => {
  const numberOfContributions = 8459;
  const numberOfExpenses = 956;
  const dailyAvgContributions = 1959.59;
  const dailyAvgExpenses = 1959.59;
  const numOneTime = 56;
  const numRecurring = 33;
  const numInvoices = 33;
  const numReimbursed = 33;
  const numGrants = 33;

  const getFilterProps = name => ({
    inputId: `transactions-filter-${name}`,
    value: filters?.[name],
    onChange: value => {
      onChange({ ...filters, [name]: value === 'ALL' ? null : value });
    },
  });

  return (
    <React.Fragment>
      <Flex flexWrap="wrap">
        <Container width={[1, 1, 1 / 2]} pr={2} mb={[3, 3, 0, 0]}>
          <FilterLabel htmlFor="transactions-period-filter">
            <FormattedMessage id="TransactionsOverviewSection.PeriodFilter" defaultMessage="Filter by Date" />
          </FilterLabel>
          <PeriodFilter {...getFilterProps('period')} />
        </Container>
        <Container width={[1, 1, 1 / 2]}>
          <FilterLabel htmlFor="transactions-collective-filter">
            <FormattedMessage id="TransactionsOverviewSection.CollectiveFilter" defaultMessage="Filter by Collective" />
          </FilterLabel>
          <CollectivePickerAsync
            inputId="TransactionsCollectiveFilter"
            data-cy="transactions-collective-filter"
            types={['COLLECTIVE']}
            isMulti
            {...getFilterProps('collective')}
          />
        </Container>
      </Flex>
      <Flex flexWrap="wrap" mt={18} mb={12}>
        <FundAmounts>
          <TotalFundsLabel minWidth="280px">
            <P>
              <Span fontWeight="500">
                {numberOfContributions} <FormattedMessage id="Contributions" defaultMessage="Contributions" />
              </Span>{' '}
              | <FormattedMessage id="DailyAverage" defaultMessage="Daily avg" />
              {': '}
              <Span fontWeight="700">{formatCurrency(dailyAvgContributions, currency)}</Span>
            </P>
          </TotalFundsLabel>
          <TotalFundsLabel
            minWidth="250px"
            position="relative"
            left={['-280px', '-280px', '-280px', '300px']}
            top={['85px', '85px', '85px', '0px']}
          >
            <P>
              <Span fontWeight="500">
                {numberOfExpenses} <FormattedMessage id="section.expenses.title" defaultMessage="Expenses" />
              </Span>{' '}
              | <FormattedMessage id="DailyAverage" defaultMessage="Daily avg" />
              {': '}
              <Span fontWeight="700">{formatCurrency(dailyAvgExpenses, currency)}</Span>
            </P>
          </TotalFundsLabel>
        </FundAmounts>
        <Container mt={2} flexWrap>
          <Span mr={3}>
            <Square color="#51E094" />
            {` ${numOneTime} `}
            <FormattedMessage id="Frequency.OneTime" defaultMessage="One time" />
          </Span>
          <Span mr={['20px', '20px', '20px', '380px']}>
            <Square color="#BEFADA" />
            {` ${numRecurring} `}
            <FormattedMessage id="TransactionsOverviewSection.Recurring" defaultMessage="Recurring" />
          </Span>
          <Span mr={3}>
            <Square color="#CC2955" />
            {` ${numInvoices} `}
            <FormattedMessage id="TransactionsOverviewSection.Invoices" defaultMessage="Invoices" />
          </Span>
          <Span mr={3}>
            <Square color="#F55882" />
            {` ${numReimbursed} `}
            <FormattedMessage id="TransactionsOverviewSection.Reimbursements" defaultMessage="Reimbursements" />
          </Span>
          <Span mr={3}>
            <Square color="#FFC2D2" />
            {` ${numGrants} `}
            <FormattedMessage id="TransactionsOverviewSection.Grants" defaultMessage="Grants" />
          </Span>
        </Container>
      </Flex>
    </React.Fragment>
  );
};

TransactionsOverviewSection.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  currency: PropTypes.string,
};

export default TransactionsOverviewSection;
