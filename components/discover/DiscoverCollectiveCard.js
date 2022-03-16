import React from 'react';
import PropTypes from 'prop-types';
import { truncate } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

import Container from '../Container';
import Currency from '../Currency';
import { Box, Flex } from '../Grid';
import StyledCollectiveCard from '../StyledCollectiveCard';
import StyledHr from '../StyledHr';
import { P, Span } from '../Text';

/**
 * A card to show a collective on the discover page.
 */
const DiscoverCollectiveCard = ({ collective, ...props }) => {
  return (
    <StyledCollectiveCard collective={collective} position="relative" {...props} data-cy="collective-card">
      <Container p={3}>
        <Box data-cy="caption" mb={2}>
          {collective.isHost ? (
            <React.Fragment>
              {collective.stats.collectives.hosted > 0 && (
                <Box pb="6px">
                  <Span fontSize="14px" fontWeight={700} color="black.900">
                    {collective.stats.collectives.hosted}
                  </Span>
                  {` `}
                  <Span fontSize="12px" fontWeight={400} color="black.700">
                    <FormattedMessage
                      defaultMessage="{ count, plural, one {Collective} other {Collectives}} hosted"
                      values={{ count: collective.stats.collectives.hosted }}
                    />
                  </Span>
                </Box>
              )}
              <Box pb="6px">
                <Span fontSize="14px" fontWeight={700} color="black.900">
                  {collective.currency}
                </Span>
                {` `}
                <Span fontSize="12px" fontWeight={400} color="black.700">
                  <FormattedMessage id="Currency" defaultMessage="Currency" />
                </Span>
              </Box>
              <Box>
                <Span fontSize="14px" fontWeight={700} color="black.900">{`${collective.hostFeePercent}%`}</Span>
                {` `}
                <Span fontSize="12px" fontWeight={400} color="black.700">
                  <FormattedMessage defaultMessage="Host Fee" />
                </Span>
              </Box>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <P fontSize="12px" lineHeight="18px">
                {collective.stats.backers.all > 0 && (
                  <Box pb="6px">
                    <Span fontSize="14px" fontWeight={700} color="black.900">
                      {collective.stats.backers.all}
                    </Span>
                    {` `}
                    <Span fontSize="12px" fontWeight={400} color="black.700">
                      <FormattedMessage
                        defaultMessage="{ count, plural, one {Contributor} other {Contributors}}"
                        values={{ count: collective.stats.backers.all }}
                      />
                    </Span>
                  </Box>
                )}
              </P>

              {collective.stats.totalAmountReceived > 0 && (
                <Box pb="6px">
                  <Span fontSize="14px" fontWeight={700} color="black.900">
                    <Currency
                      currency={collective.currency}
                      formatWithSeparators
                      value={collective.stats.totalAmountReceived}
                    />
                  </Span>
                  {` `}
                  <Span fontSize="12px" fontWeight={400} color="black.700">
                    <FormattedMessage defaultMessage="Money raised" />
                  </Span>
                </Box>
              )}
            </React.Fragment>
          )}
          {collective.description && (
            <Container fontSize="12px">
              <Flex alignItems="center" justifyContent="space-between" mt={21.5} mb={4.5}>
                <Span textTransform="uppercase" color="black.700" fontWeight={500}>
                  <FormattedMessage defaultMessage="About Us" />
                </Span>
                <StyledHr borderColor="black.300" flex="1" ml={2} />
              </Flex>
              <Span fontWeight={400} color="black.800">
                {truncate(collective.description, { length: 85 })}
              </Span>
            </Container>
          )}
        </Box>
      </Container>
    </StyledCollectiveCard>
  );
};

DiscoverCollectiveCard.propTypes = {
  collective: PropTypes.shape({
    type: PropTypes.oneOf([
      CollectiveType.COLLECTIVE,
      CollectiveType.ORGANIZATION,
      CollectiveType.EVENT,
      CollectiveType.PROJECT,
      CollectiveType.FUND,
    ]).isRequired,
    currency: PropTypes.string,
    description: PropTypes.string,
    isHost: PropTypes.bool,
    stats: PropTypes.shape({
      totalDonations: PropTypes.number,
      yearlyBudget: PropTypes.number,
      totalAmountSpent: PropTypes.number,
      backers: PropTypes.shape({
        all: PropTypes.number,
      }),
      collectives: PropTypes.shape({
        hosted: PropTypes.number,
      }),
      totalAmountReceived: PropTypes.number,
    }),
    hostFeePercent: PropTypes.number,
  }).isRequired,
};

export default injectIntl(DiscoverCollectiveCard);
