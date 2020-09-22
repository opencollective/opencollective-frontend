import React from 'react';
import PropTypes from 'prop-types';
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
import { P } from '../Text';
import { withUser } from '../UserProvider';

const ContributorCardWithTier = ({ contribution, ...props }) => {
  const collective = contribution.toAccount;
  const contributors = collective.isHost ? collective.host.contributors : collective.contributors;
  const pendingOrder = contribution.status === ORDER_STATUS.PENDING;
  return (
    <StyledCollectiveCard
      {...props}
      collective={collective}
      tag={
        pendingOrder ? (
          <StyledTag display="inline-block" textTransform="uppercase" my={2} type="warning">
            <FormattedMessage id="NewContributionFlow.PendingContribution" defaultMessage="Pending contribution" />
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
                    <b>{contributors.totalCount || 1}</b>
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
            <P textTransform="uppercase" fontSize="10px" lineHeight="14px" fontWeight="400" color="black.500">
              <FormattedMessage id="membership.totalDonations.title" defaultMessage="Amount contributed" />
            </P>
            <Flex>
              <P fontSize="14px" lineHeight="20px" fontWeight="bold">
                <FormattedMoneyAmount
                  amount={(contribution.amount.value + (contribution.platformContributionAmount?.value || 0)) * 100}
                  currency={contribution.amount.currency}
                  frequency={contribution.frequency}
                />
              </P>
              {contribution.platformContributionAmount?.value && (
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
                      amount={contribution.platformContributionAmount?.value * 100}
                      currency={contribution.amount.currency}
                      showCurrencyCode={false}
                      precision={0}
                      amountStyles={{ fontWeight: 'normal', color: 'primary.600' }}
                    />
                    )
                  </P>
                </StyledTooltip>
              )}
            </Flex>
          </Box>
          <Box mb={3}>
            <P textTransform="uppercase" fontSize="10px" lineHeight="14px" fontWeight="400" color="black.500">
              <FormattedMessage id="To" defaultMessage="To" />
            </P>
            <P fontSize="12px" fontWeight="bold">
              <FormattedMessage
                id="NewContributionFlow.CollectiveAndTier"
                defaultMessage="{collective} - {tier}"
                values={{
                  collective: collective.name,
                  tier: capitalize(contribution.tier?.name) || (
                    <FormattedMessage id="Member.Role.CONTRIBUTOR" defaultMessage="Contributor" />
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
