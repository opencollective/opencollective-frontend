import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@rebass/grid';
import { FormattedMessage, FormattedDate, injectIntl } from 'react-intl';

import roles from '../lib/constants/roles';
import formatMemberRole from '../lib/i18n-member-role';
import { formatCurrency } from '../lib/utils';
import Container from './Container';
import { P, Span } from './Text';
import StyledCollectiveCard from './StyledCollectiveCard';

/**
 * A card to show a user's membership.
 */
const StyledMembershipCard = ({ membership, intl, ...props }) => {
  const { collective, since, stats, role } = membership;
  return (
    <StyledCollectiveCard collective={collective} width={250} height={360} position="relative" {...props}>
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
    </StyledCollectiveCard>
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
      currency: PropTypes.string,
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
