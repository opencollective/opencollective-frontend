import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { CurrencyPrecision } from '../../lib/constants/currency-precision';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { P, Span } from '../Text';

/**
 * Displays info about the collective (balance and host on mobile) for the create
 * expense page.
 */
const MobileCollectiveInfoStickyBar = ({ isLoading, collective, host }) => {
  return (
    <Container
      borderLeft="8px solid"
      borderColor="green.600"
      px={3}
      py="13px"
      width="100%"
      display={['block', 'none']}
      position="sticky"
      bg="white.full"
      borderTop="1px solid #EDEDED"
      bottom={0}
      zIndex={9}
      height={72}
    >
      <Flex justifyContent="space-between" alignItems="center">
        <Box minWidth={135} flex="1 1 45%">
          <P fontSize="12px" fontWeight="bold" color="black.900" mb={1}>
            <FormattedMessage
              id="CollectiveBalance"
              defaultMessage="{type, select, COLLECTIVE {Collective balance} EVENT {Event balance} ORGANIZATION {Organization balance} FUND {Fund balance} PROJECT {Project balance} other {Account balance}}"
              values={{
                type: collective?.type, // collective can be null when it's loading
              }}
            />
          </P>
          {isLoading ? (
            <LoadingPlaceholder height={16} width={75} />
          ) : (
            <Span color="black.500" fontSize="16px">
              <FormattedMoneyAmount
                currency={collective.stats.balanceWithBlockedFunds.currency}
                amount={collective.stats.balanceWithBlockedFunds.valueInCents}
                precision={CurrencyPrecision.DEFAULT}
              />
            </Span>
          )}
        </Box>
        <Box flex="0 0 5%" />
        {host && (
          <Box flex="1 1 45%" maxWidth="45%">
            <P color="black.600" fontSize="11px" lineHeight="17px">
              <FormattedMessage
                id="withColon"
                defaultMessage="{item}:"
                values={{ item: <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" /> }}
              />
            </P>
            <LinkCollective collective={host}>
              <P color="black.600" fontSize="11px" fontWeight="bold" truncateOverflow maxWidth={135}>
                {collective && collective.isApproved ? (
                  host.name
                ) : (
                  <FormattedMessage
                    id="Fiscalhost.pending"
                    defaultMessage="{host} (pending)"
                    values={{
                      host: host.name,
                    }}
                  />
                )}
              </P>
            </LinkCollective>
          </Box>
        )}
      </Flex>
    </Container>
  );
};

MobileCollectiveInfoStickyBar.propTypes = {
  isLoading: PropTypes.bool,
  /** Must be provided if `isLoading` is false */
  collective: PropTypes.shape({
    currency: PropTypes.string.isRequired,
    balance: PropTypes.number.isRequired,
    type: PropTypes.string,
    isApproved: PropTypes.bool,
    stats: PropTypes.shape({
      balanceWithBlockedFunds: PropTypes.shape({
        valueInCents: PropTypes.number.isRequired,
        currency: PropTypes.string.isRequired,
      }),
    }),
  }),
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
};

export default React.memo(MobileCollectiveInfoStickyBar);
