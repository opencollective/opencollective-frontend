import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { defaultBackgroundImage } from '../../lib/constants/collectives';

import { imagePreview, getCollectiveImage } from '../../lib/image-utils';

import { Flex } from '@rebass/grid';
import Container from '../Container';
import { P, Span } from '../Text';
import { Link } from '../../server/pages';
import StyledLink from '../StyledLink';
import Currency from '../Currency';

const hasGoals = (settings = {}) => get(settings, 'goals[0].amount', 0) > 0;

const getGoalPercentage = ({ type, amount }, { balance, yearlyBudget }) =>
  type === 'balance' ? balance / amount : yearlyBudget / amount;

const CollectiveStatsCard = ({
  backgroundImage,
  description,
  imageUrl,
  name,
  settings,
  slug,
  stats,
  currency,
  type,
}) => (
  <Container
    bg="white"
    borderRadius="8px"
    border="1px solid rgba(18,19,20,0.2)"
    display="flex"
    flexDirection="column"
    justifyContent="space-between"
    minHeight="100%"
    overflow="hidden"
  >
    <Container
      backgroundSize="cover"
      backgroundRepeat="no-repeat"
      backgroundPosition="center center"
      height={['9rem', null, '12rem']}
      position="relative"
      style={{
        backgroundImage: `url(${imagePreview(backgroundImage, defaultBackgroundImage[type], { width: 224 })})`,
      }}
    >
      <Container
        position="absolute"
        display="flex"
        alignItems="flex-end"
        justifyContent="center"
        height="100%"
        width="100%"
        top={10}
        left={0}
      >
        <Link route={`/${slug}`} passHref>
          <a>
            <Container
              bg="#2877ED"
              backgroundSize="contain"
              backgroundRepeat="no-repeat"
              backgroundPosition="center center"
              borderRadius={12}
              border="2px solid white"
              height={[52, null, 65]}
              width={[52, null, 65]}
              style={{
                backgroundImage: `url(${getCollectiveImage({ imageUrl, slug }, { width: 65 })})`,
                backgroundColor: 'white',
              }}
            />
          </a>
        </Link>
      </Container>
    </Container>

    <P fontSize="1.4rem" textAlign="center" fontWeight="bold" mt={3}>
      <Link route={`/${slug}`} passHref>
        <StyledLink color="#2E3033">{name}</StyledLink>
      </Link>
    </P>

    <P fontSize="1.2rem" textAlign="center" p={2}>
      {description}
    </P>

    <Container bg="#E8E9EB" height={4} borderRadius={2} mx={3} position="relative" mt={3}>
      {hasGoals(settings) && (
        <Container
          bg="#3385FF"
          height={4}
          borderRadius={2}
          position="absolute"
          top={0}
          left={0}
          maxWidth="100%"
          width={`${getGoalPercentage(settings.goals[0], stats) * 100}%`}
        />
      )}
    </Container>

    {!hasGoals(settings) && (
      <P fontSize="1rem" textAlign="center" color="#9399A3" mt={2} mb={5} p={2}>
        <FormattedMessage id="collectiveStats.noBudget" defaultMessage="No budget goals yet." />
      </P>
    )}

    {hasGoals(settings) && [
      <P key="progress" textAlign="center" fontSize="1.2rem" my={2}>
        <Span fontWeight="bold">{Math.round(getGoalPercentage(settings.goals[0], stats) * 100)}%</Span>{' '}
        <FormattedMessage id="collectiveStats.progressTo" defaultMessage="progress to:" />
      </P>,
      <P key="goal" textAlign="center" fontSize="1.2rem" px={2} color="#3385FF">
        {settings.goals[0].title}
      </P>,
    ]}
    <Container display="flex" borderTop="1px solid #E3E4E6" py={2} mt={3} textAlign="center" alignItems="center">
      {get(stats, 'backers.all', 0) ? (
        <React.Fragment>
          <Flex flex="50% 1 0" alignItems="center" flexDirection="column" px={2}>
            <P fontSize="1.2rem" fontWeight="bold">
              {get(stats, 'backers.all', 0)}
            </P>
            <P fontSize="1.2rem">
              <FormattedMessage id="home.backers" defaultMessage="financial contributors" />
            </P>
          </Flex>
          {get(stats, 'monthlySpending', 0) > 0 && (
            <Flex flex="50% 1 0" justifyContent="center" px={2}>
              <P fontSize="1.2rem">
                <FormattedMessage
                  id="collectiveStats.monthlySpending"
                  defaultMessage="{amount} monthly spending"
                  values={{
                    amount: (
                      <Span fontWeight="bold">
                        <Currency
                          value={get(stats, 'monthlySpending') || 0}
                          currency={currency}
                          precision={0}
                          abbreviate
                        />
                      </Span>
                    ),
                  }}
                />
              </P>
            </Flex>
          )}
        </React.Fragment>
      ) : (
        <Link route={`/${slug}/contribute`} passHref>
          <StyledLink fontSize="1.2rem" width="100%" textAlign="center">
            <FormattedMessage id="collectiveStats.beFirstContribute" defaultMessage="Be the first to contribute!" />
          </StyledLink>
        </Link>
      )}
    </Container>
  </Container>
);

CollectiveStatsCard.propTypes = {
  backgroundImage: PropTypes.string,
  description: PropTypes.string,
  imageUrl: PropTypes.string,
  name: PropTypes.string.isRequired,
  settings: PropTypes.shape({
    goals: PropTypes.arrayOf(
      PropTypes.shape({
        amount: PropTypes.number,
        title: PropTypes.string,
        type: PropTypes.oneOf(['balance', 'yearlyBudget']),
      }),
    ),
  }),
  slug: PropTypes.string.isRequired,
  currency: PropTypes.string.isRequired,
  stats: PropTypes.shape({
    backers: PropTypes.shape({
      organizations: PropTypes.number,
      users: PropTypes.number,
    }),
    balance: PropTypes.number,
    yearlyBudget: PropTypes.number,
  }),
  type: PropTypes.string.isRequired,
};

export default CollectiveStatsCard;
