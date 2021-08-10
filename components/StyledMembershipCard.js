import React from 'react';
import PropTypes from 'prop-types';
import { FormattedDate, FormattedMessage, injectIntl } from 'react-intl';

import roles from '../lib/constants/roles';
import { formatCurrency } from '../lib/currency-utils';
import formatMemberRole from '../lib/i18n/member-role';

import Container from './Container';
import { Box } from './Grid';
import StyledCollectiveCard from './StyledCollectiveCard';
import { P, Span } from './Text';

/**
 * A card to show a user's membership.
 */
const StyledMembershipCard = ({ membership, intl, ...props }) => {
  const { account, since, role } = membership;
  return (
    <StyledCollectiveCard collective={account} {...props}>
      <Container p={3}>
        <Box data-cy="caption" mb={2}>
          {role && (
            <P fontSize="12px" lineHeight="18px" mb={3} data-cy="contribution-date-since">
              <FormattedMessage
                id="Membership.ContributorSince"
                defaultMessage="{contributorType} since"
                values={{ contributorType: formatMemberRole(intl, role) }}
              />{' '}
              <Span display="block" fontSize="16px" fontWeight="bold">
                <FormattedDate value={since} month="long" year="numeric" />
              </Span>
            </P>
          )}
          {role === roles.BACKER ? (
            <P mt={3} data-cy="amount-contributed">
              <Span fontSize="12px" lineHeight="18px">
                <FormattedMessage id="membership.totalDonations.title" defaultMessage="Amount contributed" />{' '}
              </Span>
              <Span display="block" fontSize="16px" fontWeight="bold">
                {
                  /** Ideally we should breakdown amounts donated per currency, but for now
                      the API only returns the total amount in collective's currency. */
                  formatCurrency(membership.totalDonations.valueInCents, membership.totalDonations.currency || 'USD', {
                    precision: 0,
                  })
                }
              </Span>
            </P>
          ) : (
            <P mt={3} fontSize="12px" lineHeight="18px">
              {account.backers?.totalCount > 0 && (
                <FormattedMessage
                  id="StyledMembershipCard.backers.all"
                  defaultMessage="{count, plural, one {{prettyCount} contributor} other {{prettyCount} contributors}}"
                  values={{
                    count: account.backers.totalCount,
                    prettyCount: (
                      <Span fontWeight="bold" fontSize="16px">
                        {account.backers.totalCount}
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
    account: {
      id: PropTypes.string,
      imageUrl: PropTypes.string,
      isAdmin: PropTypes.bool,
      isHost: PropTypes.bool,
      isIncognito: PropTypes.bool,
      name: PropTypes.string,
      backers: PropTypes.shape({
        totalCount: PropTypes.number,
      }),
    },
    description: PropTypes.string,
    id: PropTypes.string,
    publicMessage: PropTypes.string,
    role: PropTypes.string,
    since: PropTypes.string,
    totalDonations: { currency: PropTypes.string, valueInCents: PropTypes.number },
  }),
  intl: PropTypes.object,
};

export default injectIntl(StyledMembershipCard);
