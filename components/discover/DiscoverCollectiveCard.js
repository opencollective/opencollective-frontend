import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

import Container from '../Container';
import Currency from '../Currency';
import { Box } from '../Grid';
import StyledCollectiveCard from '../StyledCollectiveCard';
import { P, Span } from '../Text';

/**
 * A card to show a collective on the discover page.
 */
const DiscoverCollectiveCard = ({ collective, ...props }) => {
  return (
    <StyledCollectiveCard collective={collective} position="relative" {...props} data-cy="collective-card">
      <Container p={3}>
        <Box data-cy="caption" mb={2}>
          <P mt={3} fontSize="Caption" lineHeight="Caption">
            {collective.stats.backers.all > 0 && (
              <FormattedMessage
                id="discoverCard.backers.all"
                defaultMessage="{count, plural, one {contributor {prettyCount} } other {Financial contributors {prettyCount} }}"
                values={{
                  count: collective.stats.backers.all,
                  prettyCount: (
                    <Span display="block" fontWeight="bold" fontSize="LeadParagraph" lineHeight="LeadParagraph">
                      {collective.stats.backers.all}
                    </Span>
                  ),
                }}
              />
            )}
          </P>

          {collective.stats.yearlyBudget > 0 && (
            <P mt={1}>
              <Span fontSize="Caption" lineHeight="Caption">
                <FormattedMessage id="YearlyBudget" defaultMessage="Yearly budget" />
              </Span>
              <Span display="block" fontSize="LeadParagraph" lineHeight="LeadParagraph" fontWeight="bold">
                <Currency value={collective.stats.yearlyBudget} currency={collective.currency} />
              </Span>
            </P>
          )}
        </Box>
      </Container>
    </StyledCollectiveCard>
  );
};

DiscoverCollectiveCard.propTypes = {
  collective: PropTypes.shape({
    type: PropTypes.oneOf([CollectiveType.COLLECTIVE]).isRequired,
    currency: PropTypes.string,
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

export default injectIntl(DiscoverCollectiveCard);
