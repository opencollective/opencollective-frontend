import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, defineMessages } from 'react-intl';
import styled from 'styled-components';
import { Flex, Box } from '@rebass/grid';
import { truncate } from 'lodash';

import Link from '../Link';
import StyledCard from '../StyledCard';
import StyledTag from '../StyledTag';
import { P, Span } from '../Text';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import StyledProgressBar from '../StyledProgressBar';

import { ContributionTypes } from './_constants';
import tierCardDefaultImage from './ContributeCardDefaultImage.svg';

/** The main container */
const StyledContributeCard = styled(StyledCard)`
  display: flex;
  flex-direction: column;
  width: 264px;
  flex: 0 0 264px;
  height: 100%;
`;

/** Tier card banner */
const CoverImage = styled.div`
  background-color: #f5f7fa;
  background-image: url(${tierCardDefaultImage});
  height: 135px;
  background-repeat: no-repeat;
  background-size: cover;
  padding: 16px;
`;

/** Translations */
const I18nContributionType = defineMessages({
  [ContributionTypes.FINANCIAL_CUSTOM]: {
    id: 'ContributionType.Custom',
    defaultMessage: 'Custom contribution',
  },
  [ContributionTypes.FINANCIAL_ONE_TIME]: {
    id: 'ContributionType.OneTime',
    defaultMessage: 'One time contribution',
  },
  [ContributionTypes.FINANCIAL_RECURRING]: {
    id: 'ContributionType.Recurring',
    defaultMessage: 'Recurring contribution',
  },
  [ContributionTypes.FINANCIAL_GOAL]: {
    id: 'ContributionType.Goal',
    defaultMessage: 'Goal',
  },
  [ContributionTypes.EVENT_PARTICIPATE]: {
    id: 'ContributionType.Event',
    defaultMessage: 'Event',
  },
});

const messages = defineMessages({
  fallbackDescription: {
    id: 'ContributeCard.Description.Fallback',
    defaultMessage: 'Join us and help us sustain our activities!',
  },
});

const getContributeCTA = type => {
  if (type === ContributionTypes.FINANCIAL_GOAL) {
    return <FormattedMessage id="ContributeCard.BtnGoal" defaultMessage="Contribute with this goal" />;
  } else if (type === ContributionTypes.EVENT_PARTICIPATE) {
    return <FormattedMessage id="ContributeCard.BtnEvent" defaultMessage="Get tickets" />;
  } else {
    return <FormattedMessage id="ContributeCard.Btn" defaultMessage="Contribute" />;
  }
};

/**
 * A contribute card with a "Contribute" call to action
 */
const ContributeCard = ({ intl, contribution }) => {
  const { type, title, contributeRoute } = contribution;
  const { description, interval, raised, goal, currency, detailsRoute } = contribution;
  let prettyDescription = description && truncate(description, { length: detailsRoute ? 60 : 256 });

  if (!prettyDescription) {
    prettyDescription = intl.formatMessage(messages.fallbackDescription);
  }

  return (
    <StyledContributeCard>
      <CoverImage />
      <Flex px={3} py={3} flexDirection="column" justifyContent="space-between" flex="1">
        <div>
          <Box mb={3}>
            <StyledTag>{intl.formatMessage(I18nContributionType[type])}</StyledTag>
          </Box>
          {title && (
            <P fontSize="H5" mt={1} mb={3} fontWeight="bold" textTransform="capitalize">
              {title}
            </P>
          )}
          {goal && (
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
                        amount={goal}
                        interval={interval}
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
                      <FormattedMoneyAmount fontWeight="bold" amount={raised} currency={currency} interval={interval} />
                    ),
                  }}
                />
                {goal && ` (${Math.round((raised / goal) * 100)}%)`}
              </P>
              <Box mt={1}>
                <StyledProgressBar percentage={raised / goal} />
              </Box>
            </Box>
          )}
          <P mb={4} mt={2}>
            {prettyDescription}{' '}
            {detailsRoute && (
              <StyledLink as={Link} route={detailsRoute}>
                <Span textTransform="capitalize" whiteSpace="nowrap">
                  <FormattedMessage id="ContributeCard.ReadMore" defaultMessage="Read more" />
                </Span>
              </StyledLink>
            )}
          </P>
        </div>
        <Link route={contributeRoute}>
          <StyledButton width={1} mb={2} mt={3}>
            {getContributeCTA(type)}
          </StyledButton>
        </Link>
      </Flex>
    </StyledContributeCard>
  );
};

ContributeCard.propTypes = {
  /** intl object */
  intl: PropTypes.object.isRequired,
  /** Defines the contribution */
  contribution: PropTypes.shape({
    /** Tier title */
    title: PropTypes.node.isRequired,
    /** Type of the contribution */
    type: PropTypes.oneOf(Object.values(ContributionTypes)).isRequired,
    /** Route for the contribute button */
    contributeRoute: PropTypes.string.isRequired,
    /** Route for the contribute button */
    detailsRoute: PropTypes.string,
    /** Description */
    description: PropTypes.node,
    /** Min amount in cents */
    minAmount: PropTypes.number,
    /** Defines if the amount is fixed or flexible */
    amounType: PropTypes.oneOf(['FIXED', 'FLEXIBLE']),
    /** Interval */
    interval: PropTypes.oneOf(['month', 'year']),
    /** Total amount raised in cents */
    raised: PropTypes.number,
    /** Goal in cents */
    goal: PropTypes.number,
    /** Currency */
    currency: PropTypes.string,
  }),
};

export default ContributeCard;
