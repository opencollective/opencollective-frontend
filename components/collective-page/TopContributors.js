import React from 'react';
import { FormattedMessage, FormattedDate } from 'react-intl';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import styled from 'styled-components';
import { truncate, size } from 'lodash';

import { CollectiveType } from '../../lib/constants/collectives';
import withViewport from '../../lib/withViewport';
import { H4, P, Span } from '../Text';
import { ContributorAvatar } from '../Avatar';
import Container from '../Container';
import LinkContributor from '../LinkContributor';
import FormattedMoneyAmount from '../FormattedMoneyAmount';

/** The container for Top Contributors view */
const TopContributorsContainer = styled.div`
  padding: 32px 16px;
  margin-top: 48px;
  background-color: #f5f7fa;
`;

const ContributorsList = styled(Flex)`
  flex-wrap: wrap;
  margin-bottom: 16px;
  flex-direction: row;

  @media (max-width: 64em) {
    // Only show 5 contributors on mobile/tablet
    & > *:nth-child(1n + 6) {
      display: none;
    }
  }

  @media (max-width: 88em) {
    // Only show 10 contributors on desktop
    & > *:nth-child(1n + 11) {
      display: none;
    }
  }
`;

const ContributorItem = styled.div`
  display: flex;
  margin: 0 24px 16px 0;
  width: 200px;
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
`;

/**
 * Returns the flex-basis as a string in `px` based on the percentage of
 * contributors that belongs in this column.
 */
const getFlexBasisForCol = (nbContributors, totalContributors) => {
  const baseSpaceBetween = 0.1;
  const maxPercentage = 0.75;
  const percentageNbContributors = nbContributors / totalContributors;
  const width = Math.min(percentageNbContributors - baseSpaceBetween, maxPercentage);
  return `${Math.trunc(width * 100)}%`;
};

/**
 * Shows a list of contributors with the section title. Auto-size based on number
 * of contributors.
 */
const ContributorsBlock = ({ title, contributors, totalNbContributors, currency, showTitle }) => {
  const isFillingFullscreen = contributors.length === totalNbContributors && contributors.length === 20;
  return (
    <Box flex="50% 1 3" style={{ flexBasis: getFlexBasisForCol(contributors.length, totalNbContributors) }}>
      {showTitle && (
        <P fontSize="LeadParagraph" color="black.700" mb={3}>
          {title}
        </P>
      )}
      <ContributorsList justifyContent={isFillingFullscreen ? [null, null, null, null, 'space-between'] : 'flex-start'}>
        {contributors.map((contributor, idx) => (
          <ContributorItem key={contributor.id}>
            <AvatarWithRank>
              <span>{idx + 1}</span>
              <LinkContributor contributor={contributor}>
                <ContributorAvatar contributor={contributor} radius={32} />
              </LinkContributor>
            </AvatarWithRank>
            <div>
              <LinkContributor contributor={contributor}>
                <P fontSize="Caption" lineHeight="Caption" fontWeight="bold" color="black.700">
                  {contributor.isIncognito ? (
                    <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />
                  ) : (
                    truncate(contributor.name, { length: 20 })
                  )}
                </P>
              </LinkContributor>
              <P color="black.500" fontSize="Tiny" lineHeight="Tiny">
                <FormattedMessage
                  id="TotalDonatedSince"
                  defaultMessage="{totalDonated} since {date}"
                  values={{
                    date: <FormattedDate value={contributor.since} month="short" year="numeric" />,
                    totalDonated: (
                      <Span fontWeight="bold">
                        <FormattedMoneyAmount
                          amount={contributor.totalAmountDonated}
                          currency={currency}
                          abbreviateAmount
                        />
                      </Span>
                    ),
                  }}
                />
              </P>
            </div>
          </ContributorItem>
        ))}
      </ContributorsList>
    </Box>
  );
};

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
      collectiveSlug: PropTypes.string,
      totalAmountDonated: PropTypes.number.isRequired,
      since: PropTypes.string.isRequired,
      isIncognito: PropTypes.bool,
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
      <Container maxWidth={1090} m="0 auto" px={[15, 30]}>
        <H4 fontWeight="normal" color="black.700" mb={3}>
          <FormattedMessage id="SectionContribute.TopContributors" defaultMessage="Top financial contributors" />
        </H4>
        <Flex mt={2} flexWrap="wrap" justify-content="space-between">
          {Blocks[0]}
          {Blocks[1]}
        </Flex>
      </Container>
    </TopContributorsContainer>
  );
};

TopContributors.propTypes = {
  currency: PropTypes.string.isRequired,
  organizations: PropTypes.arrayOf(PropTypes.object),
  individuals: PropTypes.arrayOf(PropTypes.object),
};

export default withViewport(TopContributors);
