import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { get } from 'lodash';
import { FormattedMessage, FormattedDate, injectIntl } from 'react-intl';

import { getCollectiveMainTag } from '../lib/collective.lib';
import roles from '../lib/constants/roles';
import formatMemberRole from '../lib/i18n-member-role';
import { formatCurrency } from '../lib/utils';
import StyledCard from './StyledCard';
import LinkCollective from './LinkCollective';
import Container from './Container';
import { P, Span } from './Text';
import Avatar from './Avatar';
import I18nCollectiveTags from './I18nCollectiveTags';
import StyledTag from './StyledTag';

const getBackground = collective => {
  const backgroundImage = collective.backgroundImageUrl || get(collective, 'parentCollective.backgroundImageUrl');
  const primaryColor = get(collective.settings, 'collectivePage.primaryColor', '#1776E1');
  return backgroundImage
    ? `url(/static/images/collective-card-mask.svg) 0 0 / cover no-repeat, url(${backgroundImage}) 0 0 / cover no-repeat, ${primaryColor}`
    : `url(/static/images/collective-card-mask.svg) 0 0 / cover no-repeat, ${primaryColor}`;
};

/**
 * A card to show a user's membership.
 */
const StyledMembershipCard = ({ membership, intl, ...props }) => {
  const { collective, since, stats, role } = membership;
  return (
    <StyledCard width={250} height={360} position="relative" {...props}>
      <Container style={{ background: getBackground(collective) }} backgroundSize="cover" height={100} px={3} pt={26}>
        <Container border="2px solid white" borderRadius="25%" backgroundColor="white.full" width={68}>
          <LinkCollective collective={collective}>
            <Avatar collective={collective} radius={64} />
          </LinkCollective>
        </Container>
      </Container>
      <Flex flexDirection="column" justifyContent="space-between" height={260}>
        <Container p={3}>
          <LinkCollective collective={collective}>
            <P fontSize="LeadParagraph" fontWeight="bold" color="black.800">
              {collective.name}
            </P>
          </LinkCollective>
          <StyledTag display="inline-block" my={2}>
            <I18nCollectiveTags
              tags={getCollectiveMainTag(get(collective, 'host.id'), collective.tags, collective.type)}
            />
          </StyledTag>
        </Container>
        <Container p={3}>
          <Box data-cy="caption" mb={2}>
            {role && (
              <P fontSize="Caption" mb={3} data-cy="contribution-date-since">
                <FormattedMessage
                  id="Membership.ContributorSince"
                  defaultMessage="{contributorType} since"
                  values={{ contributorType: formatMemberRole(intl.formatMessage, role) }}
                />{' '}
                <Span display="block" fontSize="LeadParagraph" fontWeight="bold">
                  <FormattedDate value={since} month="long" year="numeric" />
                </Span>
              </P>
            )}
            {role === roles.BACKER ? (
              <P mt={3} data-cy="amount-contributed">
                <Span fontSize="Caption">
                  <FormattedMessage id="membership.totalDonations.title" defaultMessage="Amount contributed" />{' '}
                </Span>
                <Span display="block" fontSize="LeadParagraph" fontWeight="bold">
                  {/** Ideally we should breakdown amounts donated per currency, but for now
                      the API only returns the total amount in collective's currency. */
                  formatCurrency(stats.totalDonations, collective.currency || 'USD', { precision: 0 })}
                </Span>
              </P>
            ) : (
              <P mt={3} fontSize="Caption">
                {collective.stats.backers.all > 0 && (
                  <FormattedMessage
                    id="StyledMembershipCard.backers.all"
                    defaultMessage="{count, plural, one {{prettyCount} contributor} other {{prettyCount} contributors}}"
                    values={{
                      count: collective.stats.backers.all,
                      prettyCount: (
                        <Span fontWeight="bold" fontSize="LeadParagraph">
                          {collective.stats.backers.all}
                        </Span>
                      ),
                    }}
                  />
                )}
              </P>
            )}
          </Box>
        </Container>
      </Flex>
    </StyledCard>
  );
};

StyledMembershipCard.propTypes = {
  membership: PropTypes.shape({
    role: PropTypes.string,
    since: PropTypes.string,
    stats: PropTypes.shape({
      totalDonations: PropTypes.numer,
    }),
    collective: PropTypes.shape({
      name: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      description: PropTypes.string,
      currency: PropTypes.string,
      backgroundImageUrl: PropTypes.string,
      tags: PropTypes.arrayOf(PropTypes.string),
      settings: PropTypes.object,
      host: PropTypes.shape({
        id: PropTypes.number,
      }),
      parentCollective: PropTypes.shape({
        backgroundImageUrl: PropTypes.string,
      }),
      stats: PropTypes.shape({
        backers: PropTypes.shape({
          all: PropTypes.number,
        }),
      }),
    }),
  }).isRequired,
  intl: PropTypes.object,
};

export default injectIntl(StyledMembershipCard);
