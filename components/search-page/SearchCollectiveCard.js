import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl } from 'react-intl';

import { CollectiveType } from '../../lib/constants/collectives';

import Container from '../Container';
import Currency from '../Currency';
import { Box } from '../Grid';
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
                      id="X8Pa2K"
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
                  <FormattedMessage defaultMessage="Host Fee" id="NJsELs" />
                </Span>
              </Box>
            </React.Fragment>
          ) : (
            <React.Fragment>
              <P fontSize="12px" lineHeight="18px">
                {collective.stats?.contributorsCount > 0 && (
                  <Box pb="6px">
                    <Span fontSize="14px" fontWeight={700} color="black.900">
                      {collective.stats.contributorsCount}
                    </Span>
                    {` `}
                    <Span fontSize="12px" fontWeight={400} color="black.700">
                      <FormattedMessage
                        defaultMessage="Financial {count, plural, one {Contributor} other {Contributors}}"
                        id="MspQpE"
                        values={{ count: collective.stats.contributorsCount }}
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
                      <FormattedMessage defaultMessage="Money raised" id="ooRGC9" />
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
                      <FormattedMessage id="AmountContributed" defaultMessage="Contributed" />
                    </Span>
                  </Box>
                )}
            </React.Fragment>
          )}
          {collective.description && (
            <div className="text-xs">
              <div className="mb-1 mt-2 flex items-center justify-between gap-2">
                <span className="font-medium uppercase text-slate-700">
                  <FormattedMessage defaultMessage="About Us" id="ZjDH42" />
                </span>
                <hr className="flex-1" />
              </div>
              <span className="line-clamp-2 text-slate-800">{collective.description}</span>
            </div>
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
      contributorsCount: PropTypes.number,
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
  }).isRequired,
};

export default injectIntl(SearchCollectiveCard);
