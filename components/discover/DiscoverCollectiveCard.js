import React from 'react';
import PropTypes from 'prop-types';
import { Flex, Box } from '@rebass/grid';
import { get } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';

import { getCollectiveMainTag } from '../../lib/collective.lib';
import roles from '../../lib/constants/roles';

import { formatCurrency } from '../../lib/utils';
import StyledCard from '../StyledCard';
import LinkCollective from '../LinkCollective';
import Container from '../Container';
import { P, Span } from '../Text';
import Avatar from '../Avatar';
import I18nCollectiveTags from '../I18nCollectiveTags';
import StyledTag from '../StyledTag';
import Currency from '../Currency';

const getBackground = collective => {
  const backgroundImage = collective.backgroundImage || get(collective, 'parentCollective.backgroundImageUrl');
  const primaryColor = get(collective.settings, 'collectivePage.primaryColor', '#1776E1');
  return backgroundImage
    ? `url(/static/images/collective-card-mask.svg) 0 0 / cover no-repeat, url(${backgroundImage}) 0 0 / cover no-repeat, ${primaryColor}`
    : `url(/static/images/collective-card-mask.svg) 0 0 / cover no-repeat, ${primaryColor}`;
};

const NewCollectiveCard = ({ collective, ...props }) => {
  let tierName = get(collective, 'tier.name');
  const role = get(collective, 'role');
  if (!tierName) {
    switch (role) {
      case 'HOST':
        tierName = <FormattedMessage id="membership.role.host" defaultMessage="host" />;
        break;
      case 'ADMIN':
        tierName = <FormattedMessage id="roles.admin.label" defaultMessage="Collective Admin" />;
        break;
      case 'MEMBER':
        tierName = <FormattedMessage id="roles.member.label" defaultMessage="Core Contributor" />;
        break;
      default:
        tierName =
          collective.type === 'ORGANIZATION' ? (
            <FormattedMessage id="tier.name.sponsor" defaultMessage="sponsor" />
          ) : (
            <FormattedMessage id="tier.name.backer" defaultMessage="backer" />
          );
        break;
    }
  }
  return (
    <StyledCard width={250} height={360} position="relative" {...props} data-cy="collective-card">
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
            {role === roles.BACKER ? (
              <P mt={3} data-cy="amount-contributed">
                <FormattedMessage id="membership.totalDonations.title" defaultMessage="amount contributed">
                  {msg => (
                    <Span textTransform="capitalize" fontSize="Caption">
                      {msg}
                    </Span>
                  )}
                </FormattedMessage>
                <Span display="block" fontSize="LeadParagraph" fontWeight="bold">
                  {formatCurrency(collective.stats.totalDonations, collective.currency || 'USD', { precision: 0 })}
                </Span>
              </P>
            ) : (
              <P mt={3} fontSize="Caption">
                {collective.stats.backers.all > 0 && (
                  <FormattedMessage
                    id="discoverCard.backers.all"
                    defaultMessage="{count, plural, one {contributor {prettyCount} } other {Financial contributors {prettyCount} }}"
                    values={{
                      count: collective.stats.backers.all,
                      prettyCount: (
                        <Span display="block" fontWeight="bold" fontSize="LeadParagraph">
                          {collective.stats.backers.all}
                        </Span>
                      ),
                    }}
                  />
                )}
              </P>
            )}

            {collective.stats && collective.memberOf && collective.type === 'ORGANIZATION' && (
              <div className="stats">
                <div className="backers">
                  <div className="value">{collective.memberOf.length}</div>
                  <div className="label">
                    <FormattedMessage
                      id="collective.card.memberOf.count"
                      defaultMessage="{n, plural, one {collective} other {collectives}} backed"
                      values={{ n: collective.memberOf.length }}
                    />
                  </div>
                </div>
                <div className="yearlyBudget">
                  <div className="value">
                    <Currency value={collective.stats.totalAmountSpent} currency={collective.currency} />
                  </div>
                  <div className="label">
                    <FormattedMessage id="collective.card.stats.totalAmountSpent" defaultMessage="contributed" />
                  </div>
                </div>
              </div>
            )}

            {collective.type === 'COLLECTIVE' && get(collective, 'stats.backers.all') > 0 && (
              <p>
                <FormattedMessage id="collective.card.stats.yearlyBudget" defaultMessage="yearly budget">
                  {msg => (
                    <Span textTransform="capitalize" fontSize="Caption">
                      {msg}
                    </Span>
                  )}
                </FormattedMessage>

                <Span display="block" fontSize="LeadParagraph" fontWeight="bold">
                  <Currency value={collective.stats.yearlyBudget} currency={collective.currency} />
                </Span>
              </p>
            )}
          </Box>
        </Container>
      </Flex>
    </StyledCard>
  );
};

NewCollectiveCard.propTypes = {
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
    memberOf: PropTypes.arrayOf(
      PropTypes.shape({
        role: PropTypes.string.isRequired,
        since: PropTypes.string.isRequired,
        length: PropTypes.number,
        collective: PropTypes.shape({
          id: PropTypes.number.isRequired,
          name: PropTypes.string.isRequired,
          slug: PropTypes.string.isRequired,
        }),
      }),
    ),
    stats: PropTypes.shape({
      totalDonations: PropTypes.number,
      yearlyBudget: PropTypes.number,
      totalAmountSpent: PropTypes.number,
      backers: PropTypes.shape({
        all: PropTypes.number,
      }),
    }),
  }).isRequired,
};

export default injectIntl(NewCollectiveCard);
