import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Calendar } from '@styled-icons/feather/Calendar';
import { Expand } from '@styled-icons/ionicons-solid/Expand';
import { ShowChart } from '@styled-icons/material/ShowChart';
import { FormattedMessage } from 'react-intl';
import styled, { css } from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency-utils';

import Container from '../Container';
import DefinedTerm, { Terms } from '../DefinedTerm';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box } from '../Grid';
import { P } from '../Text';

const StatTitle = props => (
  <P fontSize="11px" lineHeight="12px" fontWeight="500" color="black.700" textTransform="uppercase" mb={2} {...props} />
);

const StatAmount = ({ amount, ...props }) => (
  <P fontSize="16px" lineHeight="24px" color="black.700">
    {/* Pass null instead of 0 to make sure we display `--.--` */}
    <FormattedMoneyAmount amount={amount || null} {...props} />
  </P>
);

StatAmount.propTypes = {
  amount: PropTypes.number,
};

const StatContainer = styled.div`
  flex: 1;
  padding: 16px 32px;

  svg {
    margin-right: 5px;
    vertical-align: bottom;
  }

  ${props =>
    props.$isMain &&
    css`
      background: #f7f8fa;
    `}

  ${props =>
    !props.$isFirst &&
    css`
      border-top: 1px solid #dcdee0;
    `}
`;

const BudgetStats = ({ collective, stats }) => {
  const monthlyRecurring =
    (stats.activeRecurringContributions?.monthly || 0) + (stats.activeRecurringContributions?.yearly || 0) / 12;
  const isFund = collective.type === CollectiveType.FUND;
  const isProject = collective.type === CollectiveType.PROJECT;

  return (
    <Fragment>
      <StatContainer data-cy="budgetSection-today-balance" $isFirst>
        <StatTitle>
          <Container display="inline-block" fontSize="11px" mr="5px" fontWeight="500" width="12px" textAlign="center">
            {getCurrencySymbol(collective.currency)}
          </Container>
          <FormattedMessage id="CollectivePage.SectionBudget.Balance" defaultMessage="Today’s balance" />
        </StatTitle>
        <StatAmount amount={stats.balance} currency={collective.currency} />
      </StatContainer>
      <StatContainer>
        <StatTitle>
          <ShowChart size="12px" />

          <DefinedTerm
            term={Terms.TOTAL_RAISED}
            textTransform="uppercase"
            color="black.700"
            extraTooltipContent={
              <Box mt={2}>
                <FormattedMessage
                  id="budgetSection-raised-total"
                  defaultMessage="Total contributed before fees: {amount}"
                  values={{ amount: formatCurrency(stats?.totalAmountRaised || 0, collective.currency) }}
                />
              </Box>
            }
          />
        </StatTitle>
        <StatAmount amount={stats.totalNetAmountRaised} currency={collective.currency} />
      </StatContainer>
      <StatContainer>
        <StatTitle>
          <Expand size="12px" />
          <FormattedMessage id="budgetSection-disbursed" defaultMessage="Total disbursed" />
        </StatTitle>
        <StatAmount amount={stats.totalNetAmountRaised - stats.balance} currency={collective.currency} />
      </StatContainer>
      {!isFund && !isProject && (
        <StatContainer data-cy="budgetSection-estimated-budget" $isMain>
          <StatTitle>
            <Calendar size="12px" />
            <DefinedTerm
              term={Terms.ESTIMATED_BUDGET}
              textTransform="uppercase"
              color="black.700"
              extraTooltipContent={
                <Box mt={2}>
                  <FormattedMessage
                    id="CollectivePage.SectionBudget.MonthlyRecurringAmount"
                    defaultMessage="Monthly recurring: {amount}"
                    values={{ amount: formatCurrency(monthlyRecurring, collective.currency) }}
                  />
                  <br />
                  <FormattedMessage
                    id="CollectivePage.SectionBudget.TotalAmountReceived"
                    defaultMessage="Total received in the last 12 months: {amount}"
                    values={{ amount: formatCurrency(stats?.totalAmountReceived || 0, collective.currency) }}
                  />
                </Box>
              }
            />
          </StatTitle>
          <StatAmount amount={stats.yearlyBudget} currency={collective.currency} />
        </StatContainer>
      )}
    </Fragment>
  );
};

BudgetStats.propTypes = {
  /** Collective */
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    isArchived: PropTypes.bool,
    settings: PropTypes.object,
    host: PropTypes.object,
  }).isRequired,

  /** Stats */
  stats: PropTypes.shape({
    balance: PropTypes.number.isRequired,
    yearlyBudget: PropTypes.number.isRequired,
    activeRecurringContributions: PropTypes.object,
    totalAmountReceived: PropTypes.number,
    totalAmountRaised: PropTypes.number,
    totalNetAmountRaised: PropTypes.number,
  }),

  isLoading: PropTypes.bool,
};

export default React.memo(BudgetStats);
