import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/fa-solid/ChevronDown/ChevronDown';
import { ChevronUp } from '@styled-icons/fa-solid/ChevronUp/ChevronUp';
import { FormattedMessage } from 'react-intl';

import { formatCurrency } from '../../../lib/currency-utils';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Image from '../../Image';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledLinkButton from '../../StyledLinkButton';
import { P, Span } from '../../Text';

import { HostFeesSectionHistorical } from './HostFeesSectionHistorical';

const getValuesToDisplay = (isLoading, host) => {
  if (isLoading) {
    const loadingComponent = <LoadingPlaceholder height={21} width={120} />;
    return { fees: loadingComponent, profit: loadingComponent, sharedRevenue: loadingComponent };
  } else {
    const { hostFees, hostFeeShare } = host.hostMetrics;
    return {
      fees: formatCurrency(hostFees.valueInCents, host.currency),
      sharedRevenue: formatCurrency(hostFeeShare.valueInCents, host.currency),
      profit: formatCurrency(hostFees.valueInCents - hostFeeShare.valueInCents, host.currency),
    };
  }
};

const HostFeesSection = ({ host, collectives, isLoading }) => {
  const [showHostFeeChart, setShowHostFeeChart] = useState(false);
  const valuesToDisplay = getValuesToDisplay(isLoading, host);
  return (
    <React.Fragment>
      <Flex flexWrap="wrap">
        <Container flex="1 1 230px" px={3}>
          <Container mt="24px">
            <Flex alignItems="center">
              <Image width={14} height={7} src="/static/images/host-fees-timeline.svg" />
              <Span ml="10px" fontSize="12px" fontWeight="500" textTransform="uppercase">
                <FormattedMessage defaultMessage="Total Host Fees" />
              </Span>
            </Flex>
          </Container>
          <Box pt="12px" pb="10px" fontSize="18px" fontWeight="500">
            {valuesToDisplay.fees}
          </Box>
          <P fontSize="12px" fontWeight="400" mt="10px">
            <FormattedMessage defaultMessage="Host Fees charged each month, which will be added to the Host budget at the end of the month." />
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
                <FormattedMessage defaultMessage="Your Profit" />
              </Span>
            </Flex>
          </Container>
          <Box pt="12px" pb="10px" fontSize="18px" fontWeight="500">
            {valuesToDisplay.profit}
          </Box>
          <P fontSize="12px" fontWeight="400" mt="10px">
            <FormattedMessage defaultMessage="The profit as an organization resulting of the host fees you collect without the shared revenue for the use of the platform." />
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
                <FormattedMessage defaultMessage="Shared Revenue" />
              </Span>
            </Flex>
          </Container>
          <Box pt="12px" pb="10px" fontSize="18px" fontWeight="500">
            {valuesToDisplay.sharedRevenue}
          </Box>
          <P fontSize="12px" fontWeight="400" mt="10px">
            <FormattedMessage defaultMessage="The cost of using the platform. It is collected each month with a settlement invoice uploaded to you as an expense." />
          </P>
        </Container>
      </Flex>

      <Flex flexWrap="wrap" my={3} justifyContent="space-between">
        <Container px={2}>
          <P fontSize="12px" fontWeight="400" mt="16px">
            <FormattedMessage defaultMessage="How is you organization's doing using Open Collective?" />
          </P>
        </Container>
        <Container px={2} textAlign="right">
          <StyledLinkButton asLink color="#46347F" onClick={() => setShowHostFeeChart(!showHostFeeChart)}>
            <P fontSize="12px" fontWeight="400" mt="16px">
              <FormattedMessage defaultMessage="See historical" />
              <Span pl="8px">
                {showHostFeeChart ? (
                  <ChevronUp size={12} color="#46347F" />
                ) : (
                  <ChevronDown fontVariant="solid" size={12} color="#46347F" />
                )}
              </Span>
            </P>
          </StyledLinkButton>
        </Container>
      </Flex>
      {showHostFeeChart && isLoading && <LoadingPlaceholder height={250} />}
      {showHostFeeChart && !isLoading && <HostFeesSectionHistorical collectives={collectives} hostSlug={host.slug} />}
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
