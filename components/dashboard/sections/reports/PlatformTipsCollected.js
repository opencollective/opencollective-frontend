import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import Container from '../../../Container';
import FormattedMoneyAmount, { DEFAULT_AMOUNT_STYLES } from '../../../FormattedMoneyAmount';
import { Box, Flex } from '../../../Grid';
import Image from '../../../Image';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import { P, Span } from '../../../Text';

const AMOUNT_STYLES = { ...DEFAULT_AMOUNT_STYLES, fontSize: '18px', lineHeight: '26px' };

const PlatformTipsCollected = ({ host, isLoading }) => {
  return (
    <Container p={24} bg="blue.50" border="1px solid" borderColor="blue.700" borderRadius="8px">
      <Flex alignItems="center" my={2}>
        <Image src="/static/images/opencollective-icon.png" width={14} height={14} alt="" />
        <P textTransform="uppercase" ml={2} fontSize="12px" fontWeight="500" color="black.700" letterSpacing="0.06em">
          <FormattedMessage id="PlatformTipsCollected" defaultMessage="Platform Tips" />
        </P>
      </Flex>
      <Box mt={20} mb={10}>
        {isLoading ? (
          <Flex>
            <LoadingPlaceholder height={26} maxWidth={200} />
            <Span mx={2}>{' / '}</Span>
            <LoadingPlaceholder height={26} maxWidth={200} />
          </Flex>
        ) : (
          <P fontSize="14px" color="black.700" textTransform="capitalize">
            <FormattedMessage
              id="AmountCollected"
              defaultMessage="{amount} collected"
              values={{
                amount: (
                  <FormattedMoneyAmount
                    amount={host.hostMetrics.platformTips.valueInCents}
                    currency={host.currency}
                    amountStyles={AMOUNT_STYLES}
                  />
                ),
              }}
            />
            <Span mx={2}>{' / '}</Span>
            <FormattedMessage
              defaultMessage="{amount} owed to {account}"
              id="UKIPT2"
              values={{
                account: 'Open Collective',
                amount: (
                  <FormattedMoneyAmount
                    amount={host.hostMetrics.pendingPlatformTips.valueInCents}
                    currency={host.currency}
                    amountStyles={AMOUNT_STYLES}
                  />
                ),
              }}
            />
          </P>
        )}
      </Box>
      <P fontSize="12px" lineHeight="18px" color="black.700">
        <FormattedMessage
          id="Host.PlatformTip.description"
          defaultMessage="Contributors optionally add Platform Tips to transactions. Amounts owed to Open Collective that have been deposited into the Host's bank account are charged as part of monthly Settlement Expenses."
        />
      </P>
    </Container>
  );
};

PlatformTipsCollected.propTypes = {
  isLoading: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string,
    hostMetrics: PropTypes.shape({
      platformTips: PropTypes.shape({ valueInCents: PropTypes.number }),
      pendingPlatformTips: PropTypes.shape({ valueInCents: PropTypes.number }),
    }),
  }),
};

export default PlatformTipsCollected;
