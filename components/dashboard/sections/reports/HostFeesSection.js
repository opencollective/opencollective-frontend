import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/fa-solid/ChevronDown/ChevronDown';
import { ChevronUp } from '@styled-icons/fa-solid/ChevronUp/ChevronUp';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../../../lib/currency-utils';

import Container from '../../../Container';
import { Box, Flex } from '../../../Grid';
import Image from '../../../Image';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import StyledLinkButton from '../../../StyledLinkButton';
import { P, Span } from '../../../Text';

import { HostFeesSectionHistorical } from './HostFeesSectionHistorical';

const getValuesToDisplay = (isLoading, host, locale) => {
  if (isLoading) {
    const loadingComponent = <LoadingPlaceholder height={21} width={120} />;
    return { fees: loadingComponent, netHostFee: loadingComponent, sharedRevenue: loadingComponent };
  } else {
    const { hostFees, hostFeeShare } = host.hostMetrics;
    return {
      fees: formatCurrency(hostFees.valueInCents, host.currency, { locale }),
      sharedRevenue: formatCurrency(hostFeeShare.valueInCents, host.currency, { locale }),
      netHostFee: formatCurrency(hostFees.valueInCents - hostFeeShare.valueInCents, host.currency, { locale }),
    };
  }
};

const HostFeesSection = ({ host, isLoading }) => {
  const [showHostFeeChart, setShowHostFeeChart] = useState(false);
  const { locale } = useIntl();
  const valuesToDisplay = getValuesToDisplay(isLoading, host, locale);
  return (
    <React.Fragment>
      <Flex flexWrap="wrap">
        <Container flex="1 1 230px" px={3}>
          <Container mt="24px">
            <Flex alignItems="center">
              <Image width={14} height={7} src="/static/images/host-fees-timeline.svg" />
              <Span ml="10px" fontSize="12px" fontWeight="500" textTransform="uppercase">
                <FormattedMessage defaultMessage="Total Collected" id="Kw8wV2" />
              </Span>
            </Flex>
          </Container>
          <Box pt="12px" pb="10px" fontSize="18px" fontWeight="500">
            {valuesToDisplay.fees}
          </Box>
          <P fontSize="12px" fontWeight="400" mt="10px">
            <FormattedMessage
              defaultMessage="Host Fees charged to Collectives during this time period (these are added continuously to your budget)."
              id="suKNE1"
            />
          </P>
        </Container>
        <Container
          display={['none', 'none', 'flex']}
          borderLeft="1px solid"
          borderColor="primary.800"
          height="88px"
          mt="39px"
        />

        <Container flex="1 1 230px" px={3}>
          <Container mt="24px">
            <Flex alignItems="center">
              <Image width={9.42} height={12} mr={10} src="/static/images/host-fees-oc.svg" />
              <Span ml="10px" fontSize="12px" fontWeight="500" textTransform="uppercase">
                <FormattedMessage defaultMessage="Platform Share" id="zMq41p" />
              </Span>
            </Flex>
          </Container>
          <Box pt="12px" pb="10px" fontSize="18px" fontWeight="500">
            {valuesToDisplay.sharedRevenue}
          </Box>
          <P fontSize="12px" fontWeight="400" mt="10px">
            <FormattedMessage
              defaultMessage="Portion of Host Fees paid to Open Collective (which are either paid as you go, or charged monthly through settlement expenses, depending on the payment method.)"
              id="oEyZeo"
            />
          </P>
        </Container>
        <Container
          display={['none', 'none', 'flex']}
          borderLeft="1px solid"
          borderColor="primary.800"
          height="88px"
          mt="39px"
        />
        <Container flex="1 1 230px" px={3}>
          <Container mt="24px">
            <Flex alignItems="center">
              <Image width={6.5} height={12} mr={10} src="/static/images/host-fees-money-sign.svg" />
              <Span ml="10px" fontSize="12px" fontWeight="500" textTransform="uppercase">
                <FormattedMessage defaultMessage="Net Host Fees" id="4kaWYR" />
              </Span>
            </Flex>
          </Container>
          <Box pt="12px" pb="10px" fontSize="18px" fontWeight="500">
            {valuesToDisplay.netHostFee}
          </Box>
          <P fontSize="12px" fontWeight="400" mt="10px">
            <FormattedMessage
              defaultMessage="Net amount of Host Fees retained by your Organization after removing the Platform Share."
              id="fOMB1g"
            />
          </P>
        </Container>
      </Flex>

      <Flex flexWrap="wrap" my={3} justifyContent="space-between">
        <Container px={2} textAlign="right">
          <StyledLinkButton asLink onClick={() => setShowHostFeeChart(!showHostFeeChart)}>
            <P fontSize="12px" fontWeight="400" mt="16px">
              <FormattedMessage defaultMessage="See historic" id="BWoXXL" />
              <Span pl="8px">
                {showHostFeeChart ? <ChevronUp size={12} /> : <ChevronDown fontVariant="solid" size={12} />}
              </Span>
            </P>
          </StyledLinkButton>
        </Container>
      </Flex>
      {showHostFeeChart && isLoading && <LoadingPlaceholder height={250} />}
      {showHostFeeChart && !isLoading && <HostFeesSectionHistorical hostSlug={host.slug} />}
    </React.Fragment>
  );
};

HostFeesSection.propTypes = {
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    hostMetrics: PropTypes.shape({
      hostFees: PropTypes.shape({ valueInCents: PropTypes.number.isRequired }).isRequired,
      hostFeeShare: PropTypes.shape({ valueInCents: PropTypes.number.isRequired }).isRequired,
    }),
  }),
  collectives: PropTypes.arrayOf(PropTypes.object),
  isLoading: PropTypes.bool,
};

export default HostFeesSection;
