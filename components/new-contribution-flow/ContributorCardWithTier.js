import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledHr from '../StyledHr';
import StyledTooltip from '../StyledTooltip';
import { P } from '../Text';
import { withUser } from '../UserProvider';

const ContributorCardWithTier = ({ collective, contribution, ...props }) => {
  return (
    <StyledCollectiveCard {...props} collective={collective} tag={null}>
      <Box px={3}>
        <P fontSize="14px" lineHeight="20px" fontWeight="400" color="black.900">
          <FormattedMessage
            id="NewContributionFlow.NumberOfFinancialContributors"
            defaultMessage="{contributors} financial contributors"
            values={{
              contributors: (
                <span style={{ color: 'black.900' }}>
                  <b>{collective.contributors.totalCount || 1}</b>
                </span>
              ),
            }}
          />
        </P>
      </Box>
      <StyledHr width="100%" />
      <Container display="flex" flexDirection="column" justifyContent="center" px={3} height={150}>
        <Box mb={3}>
          <P textTransform="uppercase" fontSize="10px" fontWeight="400" color="black.500">
            <FormattedMessage
              id="NewContributionFlow.AmountContributedToDate"
              defaultMessage="Amount contributed to date"
            />
          </P>
          <Flex>
            <P fontSize="14px" lineHeight="20px" fontWeight="bold">
              <FormattedMoneyAmount
                amount={(contribution.amount.value + contribution.platformFee.value) * 100}
                currency={contribution.amount.currency}
              />
            </P>
            <StyledTooltip
              content={() => (
                <FormattedMessage
                  id="Subscriptions.FeesOnTopTooltip"
                  defaultMessage="Contribution to collective plus contribution to the platform"
                />
              )}
            >
              <P fontSize="12px" lineHeight="20px" color="primary.600" ml={1}>
                (
                <FormattedMoneyAmount
                  amount={contribution.amount.value * 100}
                  currency={contribution.amount.currency}
                  showCurrencyCode={false}
                  precision={0}
                  amountStyles={{ fontWeight: 'normal', color: 'primary.600' }}
                />{' '}
                +{' '}
                <FormattedMoneyAmount
                  amount={contribution.platformFee.value * 100}
                  currency={contribution.amount.currency}
                  showCurrencyCode={false}
                  precision={0}
                  amountStyles={{ fontWeight: 'normal', color: 'primary.600' }}
                />
                )
              </P>
            </StyledTooltip>
          </Flex>
        </Box>
        <Box mb={3}>
          <P textTransform="uppercase" fontSize="10px" fontWeight="400" color="black.500">
            <FormattedMessage id="To" defaultMessage="To" />
          </P>
          <P fontSize="12px" fontWeight="bold">
            <FormattedMessage
              id="NewContributionFlow.CollectiveAndTier"
              defaultMessage="{collective} - {tier}"
              values={{ collective: collective.name, tier: contribution.exampleTier }}
            />
          </P>
        </Box>
      </Container>
    </StyledCollectiveCard>
  );
};

ContributorCardWithTier.propTypes = {
  collective: PropTypes.object.isRequired,
  contribution: PropTypes.object.isRequired,
};

export default withUser(ContributorCardWithTier);
