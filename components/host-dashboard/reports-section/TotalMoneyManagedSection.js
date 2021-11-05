import React from 'react';
import PropTypes from 'prop-types';
import { pick, sumBy } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { formatCurrency } from '../../../lib/currency-utils';

import Container from '../../Container';
import { Flex } from '../../Grid';
import ProportionalAreaChart from '../../ProportionalAreaChart';
import { P, Span } from '../../Text';

const getMoneyManagedChartAreas = (collectivesBalance, hostBalance, currency) => {
  return [
    {
      key: 'my-collectives',
      color: 'primary.500',
      label: (
        <P fontSize="12px" lineHeight="18px">
          <Span fontWeight="700">{formatCurrency(collectivesBalance, currency)}</Span>{' '}
          <Span mx="6px" color="black.600">
            {' | '}
          </Span>
          <FormattedMessage id="Collectives" defaultMessage="Collectives" />
        </P>
      ),
    },
    {
      key: 'organization',
      color: 'primary.800',
      label: (
        <P fontSize="12px" lineHeight="18px" color="black.700">
          <Span fontWeight="bold">{formatCurrency(hostBalance, currency)}</Span>
          <Span mx="6px" color="black.600">
            {' | '}
          </Span>
          <FormattedMessage id="TotalMoneyManagedSection.hostOrganization" defaultMessage="Host Organization" />
        </P>
      ),
    },
  ];
};

const TotalMoneyManagedSection = ({ host }) => {
  // Compute some general stats
  const { totalMoneyManaged } = host.hostMetrics;
  const fees = pick(host.hostMetrics, ['platformTips', 'platformFees', 'hostFees']);
  const pendingFees = pick(host.hostMetrics, ['pendingPlatformTips', 'pendingPlatformFees', 'pendingHostFeeShare']);
  const totalFees = sumBy(Object.values(fees), 'valueInCents');
  const totalPendingFees = sumBy(Object.values(pendingFees), 'valueInCents');
  const collectivesBalance = totalMoneyManaged.valueInCents - totalFees;
  const hostBalance = host.stats.balance.valueInCents;

  // Generate graph data (memoized for performances)
  const chartArgs = [collectivesBalance, hostBalance, host.currency];
  const chartAreas = React.useMemo(() => getMoneyManagedChartAreas(...chartArgs), chartArgs);

  return (
    <div>
      <Flex flexWrap="wrap" my={14} alignItems="baseline">
        <Span fontSize={18} fontWeight="500">
          {formatCurrency(totalMoneyManaged.valueInCents, host.currency)}
        </Span>
        <Span fontSize={15} fontWeight="500" lineHeight="20px" ml="8px" mr="8px">
          /
        </Span>
        <Span fontSize={15} fontWeight="500" lineHeight="25px">
          {formatCurrency(totalMoneyManaged.valueInCents + totalPendingFees, host.currency)}
        </Span>
        <Span fontSize={12} fontWeight="500" lineHeight="27px" ml="8px">
          <FormattedMessage id="TotalMoneyManagedSection.projected" defaultMessage="Projected" />
        </Span>
      </Flex>
      <Container display="flex" fontSize="11px" fontWeight="700" lineHeight="12px" alignItems="center">
        <Span textTransform="uppercase">
          <FormattedMessage
            id="TotalMoneyManagedSection.subHeading"
            defaultMessage="My Organization and My initiatives"
          />
        </Span>
      </Container>
      <Container mt={18} mb={12}>
        <ProportionalAreaChart areas={chartAreas} />
      </Container>
      <P minHeight="18px" fontSize="12px" fontWeight="400" lineHeight="18px" pt={12} pb={16}>
        <FormattedMessage
          id="Host.Metrics.TotalMoneyManages.description"
          defaultMessage="Total amount held in your bank account for the Host and its Collectives."
        />
      </P>
    </div>
  );
};

TotalMoneyManagedSection.propTypes = {
  host: PropTypes.shape({
    stats: PropTypes.shape({ balance: PropTypes.shape({ valueInCents: PropTypes.number }) }).isRequired,
    hostMetrics: PropTypes.object.isRequired,
    currency: PropTypes.string,
  }).isRequired,
};

export default TotalMoneyManagedSection;
