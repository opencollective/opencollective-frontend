import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronDown } from '@styled-icons/fa-solid/ChevronDown/ChevronDown';
import { ChevronUp } from '@styled-icons/fa-solid/ChevronUp/ChevronUp';
import { FormattedMessage, useIntl } from 'react-intl';

import { formatCurrency } from '../../../../lib/currency-utils';

import Container from '../../../Container';
import { Flex } from '../../../Grid';
import LoadingPlaceholder from '../../../LoadingPlaceholder';
import ProportionalAreaChart from '../../../ProportionalAreaChart';
import StyledLinkButton from '../../../StyledLinkButton';
import { P, Span } from '../../../Text';

import TotalMoneyManagedHistorical from './TotalMoneyManagedHistorical';

const getMoneyManagedChartAreas = (hostBalance, collectivesBalance, hostCurrency, isLoading, locale) => {
  return [
    {
      key: 'organization',
      color: 'primary.800',
      label: isLoading ? (
        <LoadingPlaceholder width={195} height={16} />
      ) : (
        <P fontSize="12px" lineHeight="18px" color="black.700">
          <Span fontWeight="bold">{formatCurrency(hostBalance, hostCurrency, { locale })}</Span>
          <Span mx="6px" color="black.600">
            {' | '}
          </Span>
          <FormattedMessage id="TotalMoneyManagedSection.hostBalance" defaultMessage="Host Organization balance" />
        </P>
      ),
    },
    {
      key: 'my-collectives',
      color: 'primary.500',
      label: isLoading ? (
        <LoadingPlaceholder width={165} height={16} />
      ) : (
        <P fontSize="12px" lineHeight="18px">
          <Span fontWeight="700">{formatCurrency(collectivesBalance, hostCurrency, { locale })}</Span>{' '}
          <Span mx="6px" color="black.600">
            {' | '}
          </Span>
          <FormattedMessage id="TotalMoneyManagedSection.collectivesBalance" defaultMessage="Collectives balance" />
        </P>
      ),
    },
  ];
};

const TotalMoneyManagedSection = ({ host, collectives, isLoading }) => {
  const { locale } = useIntl();
  const [showMoneyManagedChart, setShowMoneyManagedChart] = useState(false);

  // Compute some general stats
  const hostMetrics = host?.hostMetrics;
  const hostBalance = host?.stats.balance.valueInCents;

  let collectivesBalance;
  if (!collectives || collectives.length === 0) {
    collectivesBalance = hostMetrics?.totalMoneyManaged.valueInCents - hostBalance;
  } else {
    collectivesBalance = hostMetrics?.totalMoneyManaged.valueInCents;
  }

  // Generate graph data (memoized for performances)
  const chartArgs = [hostBalance, collectivesBalance, host?.currency, isLoading, locale];
  const chartAreas = React.useMemo(() => getMoneyManagedChartAreas(...chartArgs), chartArgs);

  return (
    <div>
      {(!collectives || collectives.length === 0) && (
        <Flex flexWrap="wrap" my={14} alignItems="baseline">
          {isLoading ? (
            <LoadingPlaceholder height={21} width={125} />
          ) : (
            <Span fontSize={18} fontWeight="500">
              {formatCurrency(hostMetrics.totalMoneyManaged.valueInCents, host.currency, { locale })}
            </Span>
          )}
        </Flex>
      )}
      {/*
      <Container display="flex" fontSize="11px" fontWeight="700" lineHeight="12px" alignItems="center">
        <Span textTransform="uppercase">
          <FormattedMessage
            id="TotalMoneyManagedSection.subHeading"
            defaultMessage="My Organization and My initiatives"
          />
        </Span>
      </Container>
      */}
      <Container mt={18} mb={12}>
        <ProportionalAreaChart areas={chartAreas} />
      </Container>
      <Flex flexWrap="wrap" justifyContent="space-between">
        <Container px={2} textAlign="right">
          <StyledLinkButton asLink onClick={() => setShowMoneyManagedChart(!showMoneyManagedChart)}>
            <P fontSize="12px" fontWeight="400" mt="16px">
              <FormattedMessage defaultMessage="See historic" />
              <Span pl="8px">
                {showMoneyManagedChart ? <ChevronUp size={12} /> : <ChevronDown fontVariant="solid" size={12} />}
              </Span>
            </P>
          </StyledLinkButton>
        </Container>
      </Flex>
      {isLoading && <LoadingPlaceholder height={250} />}
      {!isLoading && showMoneyManagedChart && <TotalMoneyManagedHistorical host={host} collectives={collectives} />}
    </div>
  );
};

TotalMoneyManagedSection.propTypes = {
  isLoading: PropTypes.bool,
  host: PropTypes.shape({
    slug: PropTypes.string,
    stats: PropTypes.shape({ balance: PropTypes.shape({ valueInCents: PropTypes.number }) }).isRequired,
    hostMetrics: PropTypes.object.isRequired,
    currency: PropTypes.string,
  }),
  collectives: PropTypes.arrayOf(PropTypes.object),
};

export default TotalMoneyManagedSection;
