import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, defineMessages } from 'react-intl';
import { Box } from '@rebass/grid';
import { truncate } from 'lodash';

import { formatCurrency } from '../../../lib/utils';
import Link from '../../Link';
import { P, Span } from '../../Text';
import FormattedMoneyAmount from '../../FormattedMoneyAmount';
import StyledProgressBar from '../../StyledProgressBar';

import { ContributionTypes } from '../_constants';
import Contribute from './Contribute';

const messages = defineMessages({
  fallbackDescription: {
    id: 'TierCard.DefaultDescription',
    defaultMessage:
      '{tierName, select, backer {Become a backer} sponsor {Become a sponsor} other {Join us}} {minAmount, select, 0 {} other {for {minAmountWithCurrency} {interval, select, month {per month} year {per year} other {}}}} and help us sustain our activities!',
  },
});

const getContributionTypeFromTier = tier => {
  if (tier.goal) {
    return ContributionTypes.FINANCIAL_GOAL;
  } else if (tier.interval) {
    return ContributionTypes.FINANCIAL_RECURRING;
  } else {
    return ContributionTypes.FINANCIAL_ONE_TIME;
  }
};

const ContributeTier = ({ intl, collective, tier }) => {
  const currency = tier.currency || collective.currency;
  const minAmount = tier.amountType === 'FLEXIBLE' ? tier.minAmount : tier.amount;
  const raised = tier.interval ? tier.stats.totalRecurringDonations : tier.stats.totalDonated;

  let description;
  if (tier.description) {
    description = truncate(tier.description, { length: tier.hasLongDescription ? 60 : 256 });
  } else {
    description = intl.formatMessage(messages.fallbackDescription, {
      minAmount,
      tierName: tier.name,
      minAmountWithCurrency: minAmount && formatCurrency(minAmount, currency),
      interval: tier.interval,
    });
  }

  return (
    <Contribute
      contributeRoute={`/${collective.slug}/contribute/${tier.slug}-${tier.id}`}
      type={getContributionTypeFromTier(tier)}
      title={tier.name}
    >
      {tier.goal && (
        <Box mb={3}>
          <P fontSize="Paragraph" color="black.500" mb={2}>
            <FormattedMessage
              id="TierPage.AmountGoal"
              defaultMessage="{amountWithInterval} goal"
              values={{
                amountWithInterval: (
                  <FormattedMoneyAmount
                    fontWeight="bold"
                    fontSize="H5"
                    color="black.900"
                    amount={tier.goal}
                    interval={tier.interval}
                    currency={currency}
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
                    fontWeight="bold"
                    amount={raised}
                    currency={currency}
                    interval={tier.interval}
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
      <P mb={4} mt={2}>
        {description}{' '}
        {tier.hasLongDescription && (
          <Link
            route="orderCollectiveTierNew"
            params={{
              collectiveSlug: collective.slug,
              verb: 'contribute',
              tierSlug: tier.slug,
              tierId: tier.id,
            }}
          >
            <Span textTransform="capitalize" whiteSpace="nowrap">
              <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
            </Span>
          </Link>
        )}
      </P>
    </Contribute>
  );
};

ContributeTier.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
  }),
  tier: PropTypes.shape({
    id: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    currency: PropTypes.string,
    hasLongDescription: PropTypes.bool,
    interval: PropTypes.string,
    amountType: PropTypes.string,
    goal: PropTypes.number,
    minAmount: PropTypes.number,
    amount: PropTypes.number,
    stats: PropTypes.shape({
      totalRecurringDonations: PropTypes.number,
      totalDonated: PropTypes.number,
    }).isRequired,
  }),
  /** @ignore */
  intl: PropTypes.object.isRequired,
};

export default injectIntl(ContributeTier);
