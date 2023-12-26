import React from 'react';
import PropTypes from 'prop-types';
import { isNil } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { capitalize } from '../../lib/utils';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledHr from '../StyledHr';
import StyledTag from '../StyledTag';
import StyledTooltip from '../StyledTooltip';
import { P, Span } from '../Text';
import { withUser } from '../UserProvider';

const ContributorCardWithTier = ({ contribution, ...props }) => {
  const collective = contribution.toAccount;
  const pendingOrder = contribution.status === ORDER_STATUS.PENDING;

  const tagMessages = {
    [ORDER_STATUS.PENDING]: (
      <FormattedMessage id="NewContributionFlow.PendingContribution" defaultMessage="Pending contribution" />
    ),
    [ORDER_STATUS.PROCESSING]: (
      <FormattedMessage id="NewContributionFlow.ProcessingContribution" defaultMessage="Processing Payment" />
    ),
  };

  return (
    <StyledCollectiveCard
      {...props}
      collective={collective}
      tag={
        tagMessages[contribution.status] ? (
          <StyledTag display="inline-block" textTransform="uppercase" my={2} type="warning">
            {tagMessages[contribution.status]}
          </StyledTag>
        ) : null
      }
      bodyHeight={306}
    >
      <Flex flexDirection="column" flexGrow={1} justifyContent="space-around">
        <Box px={3}>
          <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.900">
            <FormattedMessage
              id="NewContributionFlow.NumberOfFinancialContributors"
              defaultMessage="{contributors} financial contributors"
              values={{
                contributors: (
                  <span style={{ color: 'black.900' }}>
                    <b>{collective.stats?.contributorsCount || 1}</b>
                  </span>
                ),
              }}
            />
          </P>
        </Box>
        <StyledHr width="100%" mt={3} />
        <Container
          display="flex"
          flexDirection="column"
          height={150}
          flexGrow={pendingOrder ? 1 : 0}
          justifyContent="center"
          px={3}
        >
          <Box mb={3}>
            <P textTransform="uppercase" fontSize="11px" lineHeight="14px" fontWeight="400" color="black.700" mb={1}>
              <FormattedMessage id="membership.totalDonations.title" defaultMessage="Amount contributed" />
            </P>
            <Flex flexWrap="wrap" gridGap="4px">
              <P fontSize="14px" lineHeight="20px" fontWeight="bold">
                <FormattedMoneyAmount
                  amount={
                    !isNil(contribution.platformTipAmount?.valueInCents)
                      ? contribution.amount.valueInCents + contribution.platformTipAmount.valueInCents
                      : contribution.amount.valueInCents
                  }
                  currency={contribution.amount.currency}
                  frequency={contribution.frequency}
                  currencyCodeStyles={{ color: 'black.800' }}
                />
              </P>
              {Boolean(contribution.platformTipAmount?.valueInCents) && (
                <StyledTooltip
                  content={() => (
                    <FormattedMessage
                      id="Subscriptions.FeesOnTopTooltip"
                      defaultMessage="Contribution plus Platform Tip"
                    />
                  )}
                >
                  <P display="flex" fontSize="12px" lineHeight="20px" color="black.700">
                    (
                    <FormattedMoneyAmount
                      amount={contribution.amount.valueInCents}
                      currency={contribution.amount.currency}
                      showCurrencyCode={false}
                      precision={2}
                      amountStyles={{ fontWeight: 'normal', color: 'black.700' }}
                    />
                    <Span mx="1px"> + </Span>
                    <FormattedMoneyAmount
                      amount={contribution.platformTipAmount.valueInCents}
                      currency={contribution.amount.currency}
                      showCurrencyCode={false}
                      precision={2}
                      amountStyles={{ fontWeight: 'normal', color: 'black.700' }}
                    />
                    )
                  </P>
                </StyledTooltip>
              )}
            </Flex>
          </Box>
          <Box mb={3}>
            <P textTransform="uppercase" fontSize="11px" lineHeight="14px" fontWeight="400" color="black.700" mb={1}>
              <FormattedMessage id="To" defaultMessage="To" />
            </P>
            <P fontSize="13px" fontWeight="bold" color="black.900">
              <FormattedMessage
                id="NewContributionFlow.CollectiveAndTier"
                defaultMessage="{collective} - {tier}"
                values={{
                  collective: collective.name,
                  tier: capitalize(contribution.tier?.name) || (
                    <FormattedMessage id="Contributor" defaultMessage="Contributor" />
                  ),
                }}
              />
            </P>
          </Box>
        </Container>
      </Flex>
    </StyledCollectiveCard>
  );
};

ContributorCardWithTier.propTypes = {
  contribution: PropTypes.object.isRequired,
};

export default withUser(ContributorCardWithTier);
