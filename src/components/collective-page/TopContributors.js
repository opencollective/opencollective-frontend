import React from 'react';
import { FormattedMessage, FormattedDate } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import styled from 'styled-components';

import { CollectiveType } from '../../constants/collectives';
import roles from '../../constants/roles';
import { formatCurrency } from '../../lib/utils';
import withViewport from '../../lib/withViewport';
import Container from '../Container';
import { H4, P, Span } from '../Text';
import Avatar from '../Avatar';

import TopContributorsBackgroundSVG from './TopContributorsBackground.svg';

/** The container for Top Contributors view */
const TopContributorsContainer = styled.div`
  min-height: 425px;
  padding: 32px 16px;
  margin-top: 48px;
  background: url(${TopContributorsBackgroundSVG}) no-repeat center;
  background-color: #f5f7fa;
`;

const ContributorsList = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  max-height: 400px;

  /** Limit to 10 items on mobile */
  @media (max-width: 40em) {
    & > *:nth-child(1n + 6) {
      display: none;
    }
  }
`;

const AvatarWithRank = styled.div`
  width: 63px;
  height: 32px;
  margin-right: 8px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 14px;
  font-size: 10px;
  border-radius: 32px;
  border: 1px solid #dcdee0;
`;

const ContributorRow = ({ rank, member: { since, collective, stats }, currency }) => (
  <Flex my={3} mr={3}>
    <AvatarWithRank>
      <span>{rank}</span>
      <Avatar type={collective.type} radius={32} src={collective.image} name={collective.name} />
    </AvatarWithRank>
    <div>
      <P fontWeight="bold">{collective.name}</P>
      <P color="black.500">
        <Span fontWeight="bold">{formatCurrency(stats.totalDonations, currency)}</Span> since{' '}
        <FormattedDate value={since} month="long" year="numeric" />
      </P>
    </div>
  </Flex>
);

ContributorRow.propTypes = {
  rank: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  member: PropTypes.shape({
    since: PropTypes.string,
    collective: PropTypes.object,
    stats: PropTypes.shape({
      totalDonations: PropTypes.number,
    }),
  }),
};

/**
 * Shows two columns as leaderboards for organizations and individuals
 * financial contributions.
 */
const TopContributors = ({ topOrganizations, topIndividuals, currency }) => {
  if (!topOrganizations && !topIndividuals) {
    return null;
  }

  return (
    <TopContributorsContainer>
      <Container maxWidth={900} m="0 auto">
        <H4 fontWeight="normal" mb={3}>
          <FormattedMessage id="SectionContribute.TopContributors" defaultMessage="Top Contributors" />
        </H4>
        <Flex mt={2} justifyContent="space-between" flexWrap="wrap">
          {topOrganizations && (
            <div>
              <P fontSize="LeadParagraph">Organizations</P>
              <ContributorsList>
                {topOrganizations.map((member, idx) => (
                  <ContributorRow key={member.id} rank={idx + 1} member={member} currency={currency} />
                ))}
              </ContributorsList>
            </div>
          )}
          {topIndividuals && (
            <div>
              <P fontSize="LeadParagraph">Individuals</P>
              <ContributorsList>
                {topIndividuals.map((member, idx) => (
                  <ContributorRow key={member.id} rank={idx + 1} member={member} currency={currency} />
                ))}
              </ContributorsList>
            </div>
          )}
        </Flex>
      </Container>
    </TopContributorsContainer>
  );
};

TopContributors.propTypes = {
  currency: PropTypes.string.isRequired,

  topOrganizations: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      role: PropTypes.oneOf(Object.values(roles)).isRequired,
      collective: PropTypes.shape({
        id: PropTypes.number.isRequired,
        type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
        slug: PropTypes.string.isRequired,
        name: PropTypes.string,
        image: PropTypes.string,
      }).isRequired,
    }),
  ),

  topIndividuals: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      role: PropTypes.oneOf(Object.values(roles)).isRequired,
      collective: PropTypes.shape({
        id: PropTypes.number.isRequired,
        type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
        slug: PropTypes.string.isRequired,
        name: PropTypes.string,
        image: PropTypes.string,
      }).isRequired,
    }),
  ),
};

export default withViewport(TopContributors);
