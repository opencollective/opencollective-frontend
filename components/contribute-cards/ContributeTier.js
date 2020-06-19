import React from 'react';
import PropTypes from 'prop-types';
import { truncate } from 'lodash';
import { defineMessages, FormattedMessage, injectIntl } from 'react-intl';

import { ContributionTypes } from '../../lib/constants/contribution-types';
import { TierTypes } from '../../lib/constants/tiers-types';
import { formatCurrency, getPrecisionFromAmount } from '../../lib/currency-utils';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import StyledLink from '../StyledLink';
import StyledProgressBar from '../StyledProgressBar';
import { P } from '../Text';

import Contribute from './Contribute';

const messages = defineMessages({
  fallbackDescription: {
    id: 'TierCard.DefaultDescription',
    defaultMessage:
      '{tierName, select, backer {Become a backer} sponsor {Become a sponsor} other {Join us}}{minAmount, select, 0 {} other { for {minAmountWithCurrency} {interval, select, month {per month} year {per year} other {}}}} and help us sustain our activities!',
  },
});

const getContributionTypeFromTier = (tier, isPassed) => {
  if (isPassed) {
    return ContributionTypes.TIER_PASSED;
  } else if (tier.goal) {
    return ContributionTypes.FINANCIAL_GOAL;
  } else if (tier.type === TierTypes.PRODUCT) {
    return ContributionTypes.PRODUCT;
  } else if (tier.type === TierTypes.TICKET) {
    return ContributionTypes.TICKET;
  } else if (tier.type === TierTypes.MEMBERSHIP) {
    return ContributionTypes.MEMBERSHIP;
  } else if (tier.interval) {
    return ContributionTypes.FINANCIAL_RECURRING;
  } else {
    return ContributionTypes.FINANCIAL_ONE_TIME;
  }
};

const ContributeTier = ({ intl, collective, tier, ...props }) => {
  const currency = tier.currency || collective.currency;
  const isFlexibleAmount = tier.amountType === 'FLEXIBLE';
  const minAmount = isFlexibleAmount ? tier.minimumAmount : tier.amount;
  const raised = tier.interval ? tier.stats.totalRecurringDonations : tier.stats.totalDonated;
  const isPassed = tier.endsAt && new Date() > new Date(tier.endsAt);
  const tierType = getContributionTypeFromTier(tier, isPassed);

  let description;
  let isTruncated = false;
  if (!tier.description) {
    description = intl.formatMessage(messages.fallbackDescription, {
      minAmount: minAmount || 0,
      tierName: tier.name,
      minAmountWithCurrency: minAmount && formatCurrency(minAmount, currency),
      interval: tier.interval,
    });
  } else if (tier.description.length > 100) {
    description = truncate(tier.description, { length: 100 });
    isTruncated = true;
  } else {
    description = tier.description;
  }

  let route, routeParams;
  if (tierType === ContributionTypes.TICKET) {
    route = 'orderEventTier';
    routeParams = {
      collectiveSlug: collective.parentCollective.slug,
      verb: 'events',
      slug: collective.slug,
      tierId: tier.id,
    };
  } else {
    route = 'orderCollectiveTierNew';
    routeParams = { collectiveSlug: collective.slug, verb: 'contribute', tierSlug: tier.slug, tierId: tier.id };
  }

  return (
    <Contribute
      route={route}
      routeParams={routeParams}
      title={tier.name}
      type={tierType}
      buttonText={tier.button}
      contributors={tier.contributors}
      stats={tier.stats.contributors}
      data-cy="contribute-card-tier"
      disableCTA={isPassed}
      {...props}
    >
      <Flex flexDirection="column" justifyContent="space-between" height="100%">
        <div>
          {tier.goal && (
            <Box mb={3}>
              <P fontSize="Paragraph" color="black.600" mb={2}>
                <FormattedMessage
                  id="TierPage.AmountGoal"
                  defaultMessage="{amountWithInterval} goal"
                  values={{
                    amountWithInterval: (
                      <FormattedMoneyAmount
                        amount={tier.goal}
                        interval={tier.interval}
                        currency={currency}
                        amountStyles={{ fontWeight: 'bold', fontSize: 'H5', color: 'black.900' }}
                        precision={getPrecisionFromAmount(tier.goal)}
                      />
                    ),
                  }}
                />
              </P>
              <P fontSize="Caption" color="black.500">
                <FormattedMessage
                  id="TierPage.AmountRaised"
                  defaultMessage="{amountWithInterval} raised"
                  values={{
                    amountWithInterval: (
                      <FormattedMoneyAmount
                        amountStyles={{ fontWeight: 'bold' }}
                        amount={raised}
                        currency={currency}
                        interval={tier.interval}
                        precision={getPrecisionFromAmount(raised)}
                      />
                    ),
                  }}
                />
                {tier.goal && ` (${Math.round((raised / tier.goal) * 100)}%)`}
              </P>
              <Box mt={1}>
                <StyledProgressBar percentage={raised / tier.goal} />
              </Box>
            </Box>
          )}
          {tier.maxQuantity > 0 && (
            <P fontSize="1.1rem" color="#e69900" textTransform="uppercase" fontWeight="500" letterSpacing="1px" mb={2}>
              <FormattedMessage
                id="tier.limited"
                values={{
                  maxQuantity: tier.maxQuantity,
                  availableQuantity: tier.stats && tier.stats.availableQuantity,
                }}
                defaultMessage="LIMITED: {availableQuantity} LEFT OUT OF {maxQuantity}"
              />
            </P>
          )}
          <P mb={4} lineHeight="20px">
            {description}{' '}
            {(isTruncated || tier.hasLongDescription) && (
              <StyledLink
                as={Link}
                whiteSpace="nowrap"
                route="tier"
                params={{
                  collectiveSlug: collective.slug,
                  verb: 'contribute',
                  tierSlug: tier.slug,
                  tierId: tier.id,
                }}
              >
                <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
              </StyledLink>
            )}
          </P>
        </div>
        {!isPassed && minAmount > 0 && (
          <div>
            {isFlexibleAmount && (
              <P fontSize="Tiny" color="black.600" textTransform="uppercase" mb={1}>
                <FormattedMessage id="ContributeTier.StartsAt" defaultMessage="Starts at" />
              </P>
            )}
            <P color="black.700" data-cy="amount">
              <FormattedMoneyAmount
                amount={minAmount}
                interval={tier.interval}
                currency={currency}
                amountStyles={{ fontSize: 'H5', fontWeight: 'bold', color: 'black.900' }}
                precision={getPrecisionFromAmount(minAmount)}
              />
            </P>
          </div>
        )}
      </Flex>
    </Contribute>
  );
};

ContributeTier.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    parentCollective: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
  }),
  tier: PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    currency: PropTypes.string,
    hasLongDescription: PropTypes.bool,
    interval: PropTypes.string,
    amountType: PropTypes.string,
    endsAt: PropTypes.string,
    button: PropTypes.string,
    goal: PropTypes.number,
    minimumAmount: PropTypes.number,
    amount: PropTypes.number,
    maxQuantity: PropTypes.number,
    stats: PropTypes.shape({
      totalRecurringDonations: PropTypes.number,
      totalDonated: PropTypes.number,
      contributors: PropTypes.object,
      availableQuantity: PropTypes.number,
    }).isRequired,
    contributors: PropTypes.arrayOf(PropTypes.object),
  }),
  /** @ignore */
  intl: PropTypes.object.isRequired,
};

export default injectIntl(ContributeTier);
