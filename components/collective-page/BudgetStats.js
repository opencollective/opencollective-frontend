import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Calendar } from '@styled-icons/feather/Calendar';
import { ShowChart } from '@styled-icons/material/ShowChart';
import { Expand } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';
import { border } from 'styled-system';

import { isIndividualAccount } from '../../lib/collective';
import { CollectiveType } from '../../lib/constants/collectives';
import { formatCurrency, getCurrencySymbol } from '../../lib/currency-utils';
import { AmountPropTypeShape } from '../../lib/prop-types';

import Container from '../Container';
import DefinedTerm, { Terms } from '../DefinedTerm';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box } from '../Grid';
import StyledCard from '../StyledCard';
import { P, Span } from '../Text';

const StatTitle = styled(Container)`
  font-size: 12px;
  line-height: 16px;
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
`;

StatTitle.defaultProps = {
  color: 'black.700',
};

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

  border-color: #dcdee0;
  ${border}
`;

const BudgetStats = ({ collective, stats, horizontal }) => {
  const { locale } = useIntl();
  const isFund = collective.type === CollectiveType.FUND;
  const isIndividual = !collective.isHost && isIndividualAccount(collective);
  const borderTop = ['1px solid #dcdee0', 'none', horizontal ? null : '1px solid #dcdee0'];

  if (!stats) {
    return null;
  }

  return (
    <StyledCard
      display="flex"
      flex={[null, null, '1 1 300px']}
      width="100%"
      flexDirection={['column', 'row', horizontal ? null : 'column']}
      mb={2}
    >
      {!isIndividual ? (
        <React.Fragment>
          <StatContainer data-cy="budgetSection-today-balance" $isMain>
            <StatTitle>
              <Container
                display="inline-block"
                fontSize="11px"
                mr="5px"
                fontWeight="500"
                width="12px"
                textAlign="center"
              >
                {getCurrencySymbol(collective.currency)}
              </Container>
              {![CollectiveType.PROJECT, CollectiveType.EVENT].includes(collective.type) ? (
                <DefinedTerm
                  term={Terms.BALANCE}
                  textTransform="uppercase"
                  color="black.700"
                  extraTooltipContent={
                    stats.consolidatedBalance?.valueInCents && (
                      <Fragment>
                        <Box mt={2}>
                          <FormattedMessage
                            id="budgetSection-balance-consolidated"
                            defaultMessage="Total consolidated including Projects and Events: {amount}"
                            values={{
                              amount: formatCurrency(stats.consolidatedBalance.valueInCents || 0, collective.currency, {
                                locale,
                              }),
                            }}
                          />
                        </Box>
                      </Fragment>
                    )
                  }
                />
              ) : (
                <Span textTransform="uppercase" color="black.700">
                  <FormattedMessage id="CollectivePage.SectionBudget.Balance" defaultMessage="Today’s balance" />
                </Span>
              )}
            </StatTitle>
            <StatAmount amount={stats.balance.valueInCents} currency={collective.currency} />
          </StatContainer>
          <StatContainer borderTop={borderTop}>
            <StatTitle>
              <ShowChart size="12px" />
              {collective.isHost ? (
                <DefinedTerm term={Terms.TOTAL_INCOME} textTransform="uppercase" color="black.700" />
              ) : (
                <DefinedTerm
                  term={Terms.TOTAL_RAISED}
                  textTransform="uppercase"
                  color="black.700"
                  extraTooltipContent={
                    <Box mt={2}>
                      <FormattedMessage
                        id="budgetSection-raised-total"
                        defaultMessage="Total contributed before fees: {amount}"
                        values={{
                          amount: formatCurrency(stats.totalAmountRaised.valueInCents || 0, collective.currency, {
                            locale,
                          }),
                        }}
                      />
                    </Box>
                  }
                />
              )}
            </StatTitle>
            <StatAmount amount={stats.totalNetAmountRaised.valueInCents} currency={collective.currency} />
          </StatContainer>
          <StatContainer borderTop={borderTop}>
            <StatTitle>
              <Expand size="12px" />
              <FormattedMessage id="budgetSection-disbursed" defaultMessage="Total disbursed" />
            </StatTitle>
            <StatAmount
              amount={stats.totalNetAmountRaised.valueInCents - stats.balance.valueInCents}
              currency={collective.currency}
            />
          </StatContainer>
          {!isFund &&
            stats.totalAmountReceived?.valueInCents &&
            stats.yearlyBudget?.valueInCents &&
            stats.activeRecurringContributions && (
              <StatContainer data-cy="budgetSection-estimated-budget" borderTop={borderTop}>
                <StatTitle>
                  <Calendar size="12px" />
                  <DefinedTerm
                    term={Terms.ESTIMATED_BUDGET}
                    textTransform="uppercase"
                    color="black.700"
                    extraTooltipContent={
                      <Fragment>
                        <Box mt={2}>
                          <FormattedMessage
                            id="CollectivePage.SectionBudget.MonthlyRecurringAmount"
                            defaultMessage="Monthly recurring: {amount}"
                            values={{
                              amount: formatCurrency(
                                (stats.activeRecurringContributions?.monthly || 0) +
                                  (stats.activeRecurringContributions?.yearly || 0) / 12,
                                collective.currency,
                                { locale },
                              ),
                            }}
                          />
                        </Box>
                        <Box mt={2}>
                          <FormattedMessage
                            id="CollectivePage.SectionBudget.TotalAmountReceived"
                            defaultMessage="Total received in the last 12 months: {amount}"
                            values={{
                              amount: formatCurrency(stats.totalAmountReceived.valueInCents || 0, collective.currency, {
                                locale,
                              }),
                            }}
                          />
                        </Box>
                      </Fragment>
                    }
                  />
                </StatTitle>
                <StatAmount amount={stats.yearlyBudget.valueInCents} currency={collective.currency} />
              </StatContainer>
            )}
        </React.Fragment>
      ) : (
        <React.Fragment>
          <StatContainer data-cy="budgetSection-total-contributed">
            <StatTitle>
              ↑&nbsp;
              <FormattedMessage defaultMessage="Total contributed" />
            </StatTitle>
            <StatAmount
              amount={Math.abs(stats.totalAmountSpent.valueInCents)}
              currency={stats.totalAmountSpent.currency}
            />
          </StatContainer>
          <StatContainer data-cy="budgetSection-total-paid-expenses" borderTop={borderTop}>
            <StatTitle>
              ↓&nbsp;
              <FormattedMessage defaultMessage="Total received with expenses" />
            </StatTitle>
            <StatAmount amount={stats.totalPaidExpenses.valueInCents} currency={stats.totalPaidExpenses.currency} />
          </StatContainer>
        </React.Fragment>
      )}
    </StyledCard>
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
    isHost: PropTypes.bool,
  }).isRequired,

  /** Stats */
  stats: PropTypes.shape({
    balance: AmountPropTypeShape,
    consolidatedBalance: AmountPropTypeShape,
    yearlyBudget: AmountPropTypeShape,
    activeRecurringContributions: PropTypes.object,
    totalAmountReceived: AmountPropTypeShape,
    totalAmountRaised: AmountPropTypeShape,
    totalNetAmountRaised: AmountPropTypeShape,
    totalAmountSpent: AmountPropTypeShape,
    totalPaidExpenses: AmountPropTypeShape,
  }),

  horizontal: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default React.memo(BudgetStats);
