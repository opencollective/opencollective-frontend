import React from 'react';
import PropTypes from 'prop-types';
import { size } from 'lodash';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../lib/constants/collectives';
import formatMemberRole from '../../lib/i18n/member-role';

import { ContributorAvatar } from '../Avatar';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import LinkContributor from '../LinkContributor';
import { P, Span } from '../Text';

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
  min-width: 63px;
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

const ContributorName = styled.div`
  font-size: 12px;
  line-height: 18px;
  font-weight: bold;
  color: #4e5052;
  letter-spacing: -0.4px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;
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
  const intl = useIntl();
  const isFillingFullscreen = contributors.length === totalNbContributors && contributors.length === 20;
  return (
    <Box flex="50% 1 3" style={{ flexBasis: getFlexBasisForCol(contributors.length, totalNbContributors) }}>
      {showTitle && (
        <P fontSize="16px" color="black.700" mb={3}>
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
            <Box flex="1 1" maxWidth="calc(100% - 63px)">
              <LinkContributor contributor={contributor}>
                <ContributorName>
                  {contributor.isIncognito ? (
                    <FormattedMessage id="profile.incognito" defaultMessage="Incognito" />
                  ) : (
                    contributor.name
                  )}
                </ContributorName>
              </LinkContributor>
              <P color="black.500" fontSize="10px" lineHeight="14px">
                {contributor.totalAmountDonated ? (
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
                            precision={0}
                            abbreviateAmount
                          />
                        </Span>
                      ),
                    }}
                  />
                ) : contributor.isAdmin ? (
                  formatMemberRole(intl, 'ADMIN')
                ) : contributor.isCore ? (
                  formatMemberRole(intl, 'MEMBER')
                ) : (
                  formatMemberRole(intl, contributor.roles[0])
                )}
              </P>
            </Box>
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
    <Flex flexWrap="wrap" justify-content="space-between">
      {Blocks[0]}
      {Blocks[1]}
    </Flex>
  );
};

TopContributors.propTypes = {
  currency: PropTypes.string.isRequired,
  organizations: PropTypes.arrayOf(PropTypes.object),
  individuals: PropTypes.arrayOf(PropTypes.object),
};

export default TopContributors;
