import React from 'react';
import { FormattedMessage, FormattedDate } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { truncate, size } from 'lodash';

import { CollectiveType } from '../../constants/collectives';
import { formatCurrency } from '../../lib/utils';
import withViewport from '../../lib/withViewport';
import Link from '../Link';
import { H4, P, Span } from '../Text';
import { ContributorAvatar } from '../Avatar';

import ContainerSectionContent from './ContainerSectionContent';
import TopContributorsBackgroundSVG from './TopContributorsBackground.svg';

/** The container for Top Contributors view */
const TopContributorsContainer = styled.div`
  padding: 32px 16px;
  margin-top: 48px;
  background: url(${TopContributorsBackgroundSVG}) no-repeat center;
  background-color: #f5f7fa;
`;

const ContributorsList = styled(Flex)`
  flex-wrap: wrap;
  margin-bottom: 16px;
  flex-direction: row;

  @media (max-width: 52em) {
    // Only show 5 contributors on mobile/tablet
    & > *:nth-child(1n + 6) {
      display: none;
    }
  }

  @media (max-width: 64em) {
    // Only show 10 contributors on mobile/tablet
    & > *:nth-child(1n + 11) {
      display: none;
    }
  }
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

/**
 * Returns the flex-basis as a string in `px` based on the percentage of
 * contributors that belongs in this column.
 */
const getFlexBasisForCol = (nbContributors, totalContributors) => {
  const baseSpace = 0.1;
  return `${Math.trunc((nbContributors / totalContributors - baseSpace) * 100)}%`;
};

/**
 * Shows a list of contributors with the section title. Auto-size based on number
 * of contributors.
 */
const ContributorsBlock = ({ title, contributors, totalNbContributors, currency, showTitle }) => (
  <Box flex="50% 1 3" style={{ flexBasis: getFlexBasisForCol(contributors.length, totalNbContributors) }}>
    {showTitle && <P fontSize="LeadParagraph">{title}</P>}
    <ContributorsList>
      {contributors.map((contributor, idx) => {
        const route = contributor.type === CollectiveType.COLLECTIVE ? 'new-collective-page' : 'collective';
        return (
          <Flex my={3} mr={3} css={{ width: 300 }} key={contributor.id}>
            <AvatarWithRank>
              <span>{idx + 1}</span>
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
                    totalDonated: (
                      <Span fontWeight="bold">{formatCurrency(contributor.totalAmountDonated, currency)}</Span>
                    ),
                    date: <FormattedDate value={contributor.since} month="long" year="numeric" />,
                  }}
                />
              </P>
            </div>
          </Flex>
        );
      })}
    </ContributorsList>
  </Box>
);

ContributorsBlock.propTypes = {
  currency: PropTypes.string.isRequired,
  totalNbContributors: PropTypes.number,
  title: PropTypes.node.isRequired,
  showTitle: PropTypes.bool.isRequired,
  contributors: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
      collectiveSlug: PropTypes.string.isRequired,
      totalAmountDonated: PropTypes.number.isRequired,
      since: PropTypes.string.isRequired,
    }).isRequired,
  ),
};

/**
 * Shows two columns as leaderboards for organizations and individuals
 * financial contributions.
 */
const TopContributors = ({ organizations, individuals, currency }) => {
  const nbOrgs = size(organizations);
  const nbIndividuals = size(individuals);
  const totalNbContributors = nbOrgs + nbIndividuals;
  const hasBothTypes = Boolean(nbOrgs && nbIndividuals);

  // Nothing to render if there's no one to show
  if (!totalNbContributors) {
    return null;
  }

  // Build the individual blocks in variables so we can sort them later
  const BlockIndividuals = nbIndividuals > 0 && (
    <ContributorsBlock
      currency={currency}
      contributors={individuals}
      totalNbContributors={totalNbContributors}
      title={<FormattedMessage id="TopContributors.Individuals" defaultMessage="Individuals" />}
      showTitle={hasBothTypes}
    />
  );

  const BlockOrgs = nbOrgs > 0 && (
    <ContributorsBlock
      currency={currency}
      contributors={organizations}
      totalNbContributors={totalNbContributors}
      title={<FormattedMessage id="TopContributors.Organizations" defaultMessage="Organizations" />}
      showTitle={hasBothTypes}
    />
  );

  // Put the blocks with the most contributors first. If equals, default is to show orgs first.
  const Blocks = nbIndividuals > nbOrgs ? [BlockIndividuals, BlockOrgs] : [BlockOrgs, BlockIndividuals];

  return (
    <TopContributorsContainer>
      <ContainerSectionContent>
        <H4 fontWeight="normal" mb={3}>
          <FormattedMessage id="SectionContribute.TopContributors" defaultMessage="Top Contributors" />
        </H4>
        <Flex mt={2} flexWrap="wrap" justify-content="space-between">
          {Blocks[0]}
          {Blocks[1]}
        </Flex>
      </ContainerSectionContent>
    </TopContributorsContainer>
  );
};

TopContributors.propTypes = {
  currency: PropTypes.string.isRequired,
  organizations: PropTypes.arrayOf(PropTypes.object),
  individuals: PropTypes.arrayOf(PropTypes.object),
};

export default withViewport(TopContributors);
