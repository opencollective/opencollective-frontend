import React from 'react';
import {Flex} from "../Grid";
import {FormattedMessage} from "react-intl";
import PeriodFilter from "../budget/filters/PeriodFilter";
import styled from "styled-components";
import PropTypes from "prop-types";
import CollectivePickerAsync from "../CollectivePickerAsync";
import Container from "../Container";
import {P, Span} from "../Text";
import {formatCurrency} from "../../lib/currency-utils";

const FilterContainer = styled.div`
  flex: 1 1 120px;
  &:not(:last-child) {
    margin-right: 18px;
  }
`;

const FilterLabel = styled.label`
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #4E5052;
`;


const FundAmounts = styled.div`
  width: 100%;
  height: 48px;
  border-radius: 10px;
  background-color: #29CC75;
  border-right: 400px solid #E03F6A;
  padding-top: 10px;
  padding-left: 5px;
  @media (max-width: 1025px) {
    height: 130px;
    background-color: #29CC75;
    border-right: 0px;
    border-bottom: 40px solid #E03F6A;
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

const TransactionsOverviewSection = ({currency, filters, onChange}) => {
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
    <Flex flexWrap="wrap">
      <FilterContainer>
        <FilterLabel htmlFor="transactions-period-filter">
          <FormattedMessage id="TransactionsOverviewSection.PeriodFilter" defaultMessage="Filter by Date" />
        </FilterLabel>
        <PeriodFilter {...getFilterProps('period')} />
      </FilterContainer>
      <FilterContainer>
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
      </FilterContainer>
      <Container mt={18} mb={12}>
        <FundAmounts>
          <TotalFundsLabel minWidth="300px">
            <P>
              <Span fontWeight="500">
                {numberOfContributions}{' '}
                <FormattedMessage id="Contributions" defaultMessage="Contributions" />
              </Span> |{' '}
              <FormattedMessage id="DailyAverage" defaultMessage="Daily avg" />{': '}
              <Span fontWeight="700">{formatCurrency(dailyAvgContributions, currency)}</Span>
            </P>
          </TotalFundsLabel>
          <TotalFundsLabel
            minWidth="230px"
            position="relative"
            left={['-300px', '-300px', '-300px', '240px']}
            top={['85px', '85px', '85px', '0px']}
          >
            <P>
              <Span fontWeight="500">
                {numberOfExpenses}{' '}
                <FormattedMessage id="section.expenses.title" defaultMessage="Expenses" />
              </Span> |{' '}
              <FormattedMessage id="DailyAverage" defaultMessage="Daily avg" />{': '}
              <Span fontWeight="700">{formatCurrency(dailyAvgExpenses, currency)}</Span>
            </P>
          </TotalFundsLabel>
        </FundAmounts>
        <Container mt={2} flexWrap>
          <Span mr={3}><Square color="#51E094"/>{` ${numOneTime} `}<FormattedMessage id="Frequency.OneTime" defaultMessage="One time" /></Span>
          <Span mr="340px"><Square color="#BEFADA"/>{` ${numOneTime} `}<FormattedMessage id="TransactionsOverviewSection.Recurring" defaultMessage="Recurring" /></Span>
          <Span mr={4}><Square color="#CC2955"/>{` ${numOneTime} `}<FormattedMessage id="TransactionsOverviewSection.Invoices" defaultMessage="Invoices" /></Span>
          <Span mr={4}><Square color="#F55882"/>{` ${numOneTime} `}<FormattedMessage id="TransactionsOverviewSection.Reimbursements" defaultMessage="Reimbursements" /></Span>
          <Span mr={4}><Square color="#FFC2D2"/>{` ${numOneTime} `}<FormattedMessage id="TransactionsOverviewSection.Grants" defaultMessage="Grants" /></Span>
        </Container>
      </Container>
    </Flex>
  );
};

TransactionsOverviewSection.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  currency: PropTypes.string,
};

export default TransactionsOverviewSection;
