import { Box, Flex } from '@rebass/grid';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { P, Span } from '../Text';
import LinkCollective from '../LinkCollective';

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
          <P fontSize="Caption" fontWeight="bold" color="black.900" mb={1}>
            <FormattedMessage id="CollectiveBalance" defaultMessage="Collective balance" />
          </P>
          {isLoading ? (
            <LoadingPlaceholder height={16} width={75} />
          ) : (
            <Span color="black.500" fontSize="LeadParagraph">
              <FormattedMoneyAmount currency={collective.currency} amount={collective.balance} />
            </Span>
          )}
        </Box>
        <Box flex="0 0 5%" />
        {host && (
          <Box flex="1 1 45%" maxWidth="45%">
            <P color="black.600" fontSize="SmallCaption" lineHeight="SmallCaption">
              <FormattedMessage
                id="withColon"
                defaultMessage="{item}:"
                values={{ item: <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" /> }}
              />
            </P>
            <LinkCollective collective={host}>
              <P color="black.600" fontSize="SmallCaption" fontWeight="bold" truncateOverflow maxWidth={135}>
                {host.name}
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
    currency: PropTypes.string.isRequried,
    balance: PropTypes.number.isRequried,
  }),
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }),
};

export default React.memo(MobileCollectiveInfoStickyBar);
