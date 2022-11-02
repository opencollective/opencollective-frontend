import React from 'react';
import PropTypes from 'prop-types';
import { truncate } from 'lodash';
import { FormattedMessage, injectIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

import Container from '../Container';
import Currency from '../Currency';
import { Box, Flex } from '../Grid';
import StyledHr from '../StyledHr';
import { P, Span } from '../Text';

import StyledCollectiveCard from './StyledCollectiveCard';

/**
 * A card to show a collective on the search page.
 */
const SearchCollectiveCard = ({ collective, ...props }) => {
  return (
    <StyledCollectiveCard collective={collective} position="relative" {...props} data-cy="collective-card">
      <Container p={3}>
        <Box data-cy="caption" mb={2}>
          {collective.isHost && collective.host ? (
            <React.Fragment>
              {collective.host?.totalHostedCollectives > 0 && (
                <Box pb="6px">
                  <Span fontSize="14px" fontWeight={700} color="black.900">
                    {collective.host.totalHostedCollectives}
                  </Span>
                  {` `}
                  <Span fontSize="12px" fontWeight={400} color="black.700">
                    <FormattedMessage
                      defaultMessage="{ count, plural, one {Collective} other {Collectives}} hosted"
                      values={{ count: collective.host.totalHostedCollectives }}
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
                <Span fontSize="14px" fontWeight={700} color="black.900">{`${collective.host.hostFeePercent}%`}</Span>
                {` `}
                <Span fontSize="12px" fontWeight={400} color="black.700">
                  <FormattedMessage defaultMessage="Host Fee" />
                </Span>
              </Box>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <P fontSize="12px" lineHeight="18px">
                {collective.backers.totalCount > 0 && (
                  <Box pb="6px">
                    <Span fontSize="14px" fontWeight={700} color="black.900">
                      {collective.backers.totalCount}
                    </Span>
                    {` `}
                    <Span fontSize="12px" fontWeight={400} color="black.700">
                      <FormattedMessage
                        defaultMessage="{ count, plural, one {Contributor} other {Contributors}}"
                        values={{ count: collective.backers.totalCount }}
                      />
                    </Span>
                  </Box>
                )}
              </P>

              {collective.type !== CollectiveType.ORGANIZATION &&
                collective.stats.totalAmountReceived.valueInCents > 0 && (
                  <Box pb="6px">
                    <Span fontSize="14px" fontWeight={700} color="black.900">
                      <Currency
                        currency={collective.stats.totalAmountReceived.currency}
                        formatWithSeparators
                        value={collective.stats.totalAmountReceived.valueInCents}
                      />
                    </Span>
                    {` `}
                    <Span fontSize="12px" fontWeight={400} color="black.700">
                      <FormattedMessage defaultMessage="Money raised" />
                    </Span>
                  </Box>
                )}

              {collective.type === CollectiveType.ORGANIZATION &&
                Math.abs(collective.stats.totalAmountSpent.valueInCents) > 0 && (
                  <Box pb="6px">
                    <Span fontSize="14px" fontWeight={700} color="black.900">
                      <Currency
                        currency={collective.stats.totalAmountSpent.currency}
                        formatWithSeparators
                        value={Math.abs(collective.stats.totalAmountSpent.valueInCents)}
                      />
                    </Span>
                    {` `}
                    <Span fontSize="12px" fontWeight={400} color="black.700">
                      <FormattedMessage defaultMessage="Contributed" />
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

SearchCollectiveCard.propTypes = {
  collective: PropTypes.shape({
    type: PropTypes.oneOf(Object.values(CollectiveType)).isRequired,
    currency: PropTypes.string,
    description: PropTypes.string,
    isHost: PropTypes.bool,
    stats: PropTypes.shape({
      totalAmountReceived: PropTypes.shape({
        valueInCents: PropTypes.number,
        currency: PropTypes.string,
      }),
      totalAmountSpent: PropTypes.shape({
        valueInCents: PropTypes.number,
        currency: PropTypes.string,
      }),
    }),
    host: PropTypes.shape({
      totalHostedCollectives: PropTypes.number,
      hostFeePercent: PropTypes.number,
    }),
    backers: PropTypes.shape({
      totalCount: PropTypes.number,
    }),
  }).isRequired,
};

export default injectIntl(SearchCollectiveCard);
