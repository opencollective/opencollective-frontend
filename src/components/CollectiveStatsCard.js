import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import { defaultImage, defaultBackgroundImage } from '../constants/collectives';

import { Flex } from 'grid-styled';
import Container from './Container';
import { P, Span } from './Text';
import { Link } from '../server/pages';
import StyledLink from './StyledLink';

const hasGoals = (settings = {}) => get(settings, 'goals', []).length > 0 && get(settings, 'goals', [])[0] !== {};

const getGoalPercentage = ({ type, amount}, { balance, yearlyBudget }) => type === 'balance' ?  (balance / amount) : (yearlyBudget / amount);

const CollectiveStatsCard = ({
  backgroundImage,
  currency,
  description,
  image,
  name,
  settings,
  slug,
  stats,
  type,
}) => (
  <Container bg="white" borderRadius="8px" border="1px solid rgba(18,19,20,0.2)" overflow="hidden">
    <Container
      backgroundImage={backgroundImage || defaultBackgroundImage[type]}
      backgroundSize="cover"
      backgroundRepeat="no-repeat"
      backgroundPosition="center center"
      height={['9rem', null, '12rem']}
      position="relative"
    >

      <Container position="absolute" display="flex" alignItems="flex-end" justifyContent="center" height="100%" width="100%" top={10} left={0}>
        <Container
          bg="#2877ED"
          backgroundImage={image || defaultImage[type]}
          backgroundSize="contain"
          backgroundRepeat="no-repeat"
          backgroundPosition="center center"
          borderRadius={12}
          border="2px solid white"
          height={[52, null, 65]}
          width={[52, null, 65]}
        />
      </Container>
    </Container>

    <P fontSize="1.4rem" textAlign="center" fontWeight="bold" mt={3}>
      <Link href={`/${slug}`}><StyledLink color="#2E3033">{name}</StyledLink></Link>
    </P>

    <P fontSize="1.2rem" textAlign="center" p={2}>{description}</P>

    <Container bg="#E8E9EB" height={4} borderRadius={2} mx={3} position="relative" mt={3}>
      {hasGoals(settings) && (
        <Container bg="#3385FF" height={4} borderRadius={2} position="absolute" top={0} left={0} width={getGoalPercentage(settings.goals[0], stats)} />
      )}
    </Container>

    {!hasGoals(settings) && (
      <P fontSize="1rem" textAlign="center" color="#9399A3" mt={2} mb={5}>No budget goals yet.</P>
    )}

    {hasGoals(settings) && [
      <P key="progress" textAlign="center" fontSize="1.2rem" my={2}>
        <Span fontWeight="bold">{(getGoalPercentage(settings.goals[0], stats) * 100).toFixed(2)}%</Span> progress to:
      </P>,
      <P key="goal" textAlign="center" fontSize="1.2rem" px={2} color="#3385FF">{settings.goals[0].title}</P>
    ]}

    <Container display="flex" borderTop="1px solid #E3E4E6" py={2} mt={3}>
      {(get(stats, 'backers.users', 0) || get(stats, 'backers.users', 0)) ? [
        <Flex w={0.5} alignItems="center" flexDirection="column" key="backers">
          <P fontSize="1.2rem" fontWeight="bold">{get(stats, 'backers.users', 0)}</P>
          <P fontSize="1.2rem">backers</P>
        </Flex>,
        <Flex w={0.5} alignItems="center" flexDirection="column" key="sponsors">
          <P fontSize="1.2rem" fontWeight="bold">{get(stats, 'backers.organizations', 0)}</P>
          <P fontSize="1.2rem">sponsors</P>
        </Flex>
      ] : (
        <Link href={`/${slug}#contribute`}><StyledLink fontSize="1.2rem" width="100%" textAlign="center">Be the first to contribute!</StyledLink></Link>
      )}
    </Container>
  </Container>
);

CollectiveStatsCard.propTypes = {
  backgroundImage: PropTypes.string,
  description: PropTypes.string,
  image: PropTypes.string,
  name: PropTypes.isRequired,
  settings: PropTypes.shape({
    goals: PropTypes.arrayOf(PropTypes.shape({
      amount: PropTypes.number.isRequired,
      title: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['balance', 'yearlyBudget']).isRequired,
    })),
  }),
  slug: PropTypes.string.isRequired,
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
