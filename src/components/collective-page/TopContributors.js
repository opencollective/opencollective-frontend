import React from 'react';
import { FormattedMessage, FormattedDate } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex } from '@rebass/grid';
import styled from 'styled-components';
import { layout } from 'styled-system';
import { truncate } from 'lodash';

import { CollectiveType } from '../../constants/collectives';
import { formatCurrency } from '../../lib/utils';
import withViewport from '../../lib/withViewport';
import Link from '../Link';
import { H4, P, Span } from '../Text';
import { ContributorAvatar } from '../Avatar';

import TopContributorsBackgroundSVG from './TopContributorsBackground.svg';
import ContainerSectionContent from './ContainerSectionContent';

/** The container for Top Contributors view */
const TopContributorsContainer = styled.div`
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
  ${layout}
`;

const AvatarWithRank = styled.div`
  width: 75px;
  height: 40px;
  margin-right: 8px;
  background: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-left: 14px;
  font-size: 10px;
  border-radius: 32px;
`;

const ContributorRow = ({ rank, currency, contributor }) => {
  const route = contributor.type === CollectiveType.COLLECTIVE ? 'new-collective-page' : 'collective';

  return (
    <Flex my={3} mr={3}>
      <AvatarWithRank>
        <span>{rank}</span>
        <Link route={route} params={{ slug: contributor.collectiveSlug }}>
          <ContributorAvatar contributor={contributor} radius={38} borderRadius="25%" />
        </Link>
      </AvatarWithRank>
      <div>
        <Link route={route} params={{ slug: contributor.collectiveSlug }}>
          <P fontWeight="bold" color="black.700">
            {truncate(contributor.name, { length: 20 })}
          </P>
        </Link>
        <P color="black.500">
          <FormattedMessage
            id="TotalDonatedSince"
            defaultMessage="{totalDonated} since {date}"
            values={{
              totalDonated: <Span fontWeight="bold">{formatCurrency(contributor.totalAmountDonated, currency)}</Span>,
              date: <FormattedDate value={contributor.since} month="long" year="numeric" />,
            }}
          />
        </P>
      </div>
    </Flex>
  );
};

ContributorRow.propTypes = {
  rank: PropTypes.number.isRequired,
  currency: PropTypes.string.isRequired,
  contributor: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
    collectiveSlug: PropTypes.string.isRequired,
    totalAmountDonated: PropTypes.number.isRequired,
    since: PropTypes.string.isRequired,
  }).isRequired,
};

/**
 * Shows two columns as leaderboards for organizations and individuals
 * financial contributions.
 */
const TopContributors = ({ topOrganizations, topIndividuals, currency }) => {
  const hasBothTypes = Boolean(topOrganizations.length && topIndividuals.length);
  return (
    <TopContributorsContainer>
      <ContainerSectionContent m="0 auto">
        <H4 fontWeight="normal" mb={3}>
          <FormattedMessage id="SectionContribute.TopContributors" defaultMessage="Top Contributors" />
        </H4>
        <Flex mt={2} justifyContent="space-between" flexWrap="wrap">
          {topOrganizations && topOrganizations.length > 0 && (
            <div>
              {hasBothTypes && (
                <P fontSize="LeadParagraph">
                  <FormattedMessage id="TopContributors.Organizations" defaultMessage="Organizations" />
                </P>
              )}
              <Flex>
                <ContributorsList>
                  {topOrganizations.slice(0, 5).map((contributor, idx) => (
                    <ContributorRow key={contributor.id} rank={idx + 1} contributor={contributor} currency={currency} />
                  ))}
                </ContributorsList>
                <ContributorsList display={['none', null, 'flex']}>
                  {topOrganizations.slice(5, 10).map((contributor, idx) => (
                    <ContributorRow key={contributor.id} rank={idx + 6} contributor={contributor} currency={currency} />
                  ))}
                </ContributorsList>
              </Flex>
            </div>
          )}
          {topIndividuals && topIndividuals.length > 0 && (
            <div>
              {hasBothTypes && (
                <P fontSize="LeadParagraph">
                  <FormattedMessage id="TopContributors.Individuals" defaultMessage="Individuals" />
                </P>
              )}
              <Flex>
                <ContributorsList>
                  {topIndividuals.slice(0, 5).map((contributor, idx) => (
                    <ContributorRow key={contributor.id} rank={idx + 1} contributor={contributor} currency={currency} />
                  ))}
                </ContributorsList>
                <ContributorsList display={['none', null, 'flex']}>
                  {topIndividuals.slice(5, 10).map((contributor, idx) => (
                    <ContributorRow key={contributor.id} rank={idx + 6} contributor={contributor} currency={currency} />
                  ))}
                </ContributorsList>
              </Flex>
            </div>
          )}
        </Flex>
      </ContainerSectionContent>
    </TopContributorsContainer>
  );
};

TopContributors.propTypes = {
  currency: PropTypes.string.isRequired,
  topOrganizations: PropTypes.arrayOf(PropTypes.object).isRequired,
  topIndividuals: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default withViewport(TopContributors);
