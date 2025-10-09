import React from 'react';
import { FormattedMessage } from 'react-intl';

import { CurrencyPrecision } from '../../lib/constants/currency-precision';

import Container from '../Container';
import { DefinitionTooltip } from '../dashboard/sections/reports/DefinitionTooltip';
import CreateExpenseFAQ from '../faqs/CreateExpenseFAQ';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box } from '../Grid';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { H5, P, Span } from '../Text';

import ExpandableExpensePolicies from './ExpandableExpensePolicies';
/**
 * Provide some info (ie. collective balance, tags, policies, etc.) for the expense pages
 * in a sidebar.
 */
const ExpenseInfoSidebar = ({ isLoading, host, expenseHost = null, collective, children = undefined }) => {
  const balance = collective?.stats.balance;
  const balanceWithBlockedFunds = collective?.stats.balanceWithBlockedFunds;
  const blockedFundsAmount = {
    valueInCents: balance?.amount.valueInCents - balanceWithBlockedFunds?.amount.valueInCents,
    currency: balance?.currency,
  };
  return (
    <Box width="100%">
      <Box display={['none', 'block']}>
        <H5 mb={3} textTransform="capitalize">
          <FormattedMessage
            id="CollectiveBalance"
            defaultMessage="{type, select, COLLECTIVE {Collective balance} EVENT {Event balance} ORGANIZATION {Organization balance} FUND {Fund balance} PROJECT {Project balance} other {Account balance}}"
            values={{
              type: collective?.type || '', // collective can be null when it's loading
            }}
          />
        </H5>
        <Container
          borderLeft="1px solid"
          borderColor="black.300"
          pl={3}
          pb={1}
          fontSize="18px"
          color="black.500"
          data-cy="collective-balance"
        >
          {isLoading && !balance ? (
            <LoadingPlaceholder height={28} width={75} />
          ) : (
            <Box>
              {blockedFundsAmount.valueInCents > 0 ? (
                <DefinitionTooltip
                  definition={
                    <FormattedMessage
                      defaultMessage="This number accounts for {blockedFunds} currently not available to spend"
                      id="LWUmrm"
                      values={{
                        blockedFunds: (
                          <FormattedMoneyAmount
                            amount={blockedFundsAmount.valueInCents}
                            currency={balance?.currency}
                            precision={CurrencyPrecision.DEFAULT}
                          />
                        ),
                      }}
                    />
                  }
                >
                  <FormattedMoneyAmount
                    currency={balance.currency}
                    amount={balance.valueInCents}
                    amountClassName="text-foreground"
                    precision={CurrencyPrecision.DEFAULT}
                  />
                </DefinitionTooltip>
              ) : (
                <FormattedMoneyAmount
                  currency={balance.currency}
                  amount={balance.valueInCents}
                  amountClassName="text-foreground"
                  precision={CurrencyPrecision.DEFAULT}
                />
              )}

              {host && (
                <P fontSize="11px" color="black.700" mt={3}>
                  <Span
                    fontSize="9px"
                    fontWeight="600"
                    textTransform="uppercase"
                    color="black.700"
                    letterSpacing="0.06em"
                  >
                    <FormattedMessage defaultMessage="Current Fiscal Host" id="06GnOc" />
                  </Span>
                  <br />
                  <LinkCollective collective={host}>
                    {collective?.isActive ? (
                      host.name
                    ) : (
                      <FormattedMessage
                        id="Fiscalhost.pending"
                        defaultMessage="{host} (pending)"
                        values={{
                          host: host.name,
                        }}
                      />
                    )}
                  </LinkCollective>
                </P>
              )}
              {expenseHost && expenseHost.id !== host?.id && (
                <P fontSize="11px" color="black.700" mt={3}>
                  <Span
                    fontSize="9px"
                    fontWeight="600"
                    textTransform="uppercase"
                    color="black.700"
                    letterSpacing="0.06em"
                  >
                    <FormattedMessage defaultMessage="Expense Fiscal Host" id="r4sUYI" />
                  </Span>
                  <br />
                  <LinkCollective collective={expenseHost}>{expenseHost.name}</LinkCollective>
                </P>
              )}
            </Box>
          )}
        </Container>
      </Box>
      {children && <Box my={50}>{children}</Box>}
      <ExpandableExpensePolicies host={host} collective={collective} mt={50} />
      <Box mt={[0, 50]}>
        <CreateExpenseFAQ withBorderLeft withNewButtons titleProps={{ fontSize: '20px', fontWeight: 500, mb: 3 }} />
      </Box>
    </Box>
  );
};

export default React.memo(ExpenseInfoSidebar);
