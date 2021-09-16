import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import Image from 'next/image';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import PeriodFilter, { getDateRangeFromPeriod } from '../../budget/filters/PeriodFilter';
import Container from '../../Container';
import FormattedMoneyAmount, { DEFAULT_AMOUNT_STYLES } from '../../FormattedMoneyAmount';
import { Box, Flex } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import { P, Span } from '../../Text';

/**
 * The fields in this query should match the ones from `components/host-dashboard/HostDashboardReports.js`
 * to take advantage of Apollo's caching.
 */
const platformTipsQuery = gqlV2/* GraphQL */ `
  query HostReportPlatformTips($hostSlug: String!, $dateFrom: DateTime, $dateTo: DateTime) {
    host(slug: $hostSlug) {
      id
      currency
      hostMetrics(dateFrom: $dateFrom, dateTo: $dateTo) {
        platformTips {
          valueInCents
          currency
        }
        pendingPlatformTips {
          valueInCents
          currency
        }
      }
    }
  }
`;

const AMOUNT_STYLES = { ...DEFAULT_AMOUNT_STYLES, fontSize: '18px', lineHeight: '26px' };

const PlatformTipsCollected = ({ hostSlug }) => {
  const [dateRange, setDateRange] = React.useState([]);
  const [dateFrom, dateTo] = dateRange;
  const variables = { hostSlug, dateFrom, dateTo };
  const { data, loading, error } = useQuery(platformTipsQuery, { variables, context: API_V2_CONTEXT });

  if (error) {
    return <MessageBoxGraphqlError error={error} />;
  }

  return (
    <Container p={24} bg="blue.50" border="1px solid" borderColor="blue.700" borderRadius="8px">
      <Flex justifyContent="space-between" alignItems="center" flexWrap="wrap">
        <Flex alignItems="center" my={2}>
          <Image src="/static/images/opencollective-icon.svg" width={14} height={14} alt="" />
          <P textTransform="uppercase" ml={2} fontSize="12px" fontWeight="500" color="black.700" letterSpacing="0.06em">
            <FormattedMessage id="PlatformTipsCollected" defaultMessage="Platform tips collected" />
          </P>
        </Flex>
        <PeriodFilter
          minWidth={185}
          onChange={encodedValue => setDateRange(getDateRangeFromPeriod(encodedValue))}
          value={dateRange}
        />
      </Flex>
      <Box mt={20} mb={10}>
        {loading ? (
          <Flex>
            <LoadingPlaceholder height={26} maxWidth={200} />
            <Span mx={2}>{' / '}</Span>
            <LoadingPlaceholder height={26} maxWidth={200} />
          </Flex>
        ) : (
          <P fontSize="14px" color="black.700">
            <FormattedMessage
              id="AmountCollected"
              defaultMessage="{amount} collected"
              values={{
                amount: (
                  <FormattedMoneyAmount
                    amount={data.host.hostMetrics.platformTips.valueInCents}
                    currency={data.host.currency}
                    amountStyles={AMOUNT_STYLES}
                  />
                ),
              }}
            />
            <Span mx={2}>{' / '}</Span>
            <FormattedMessage
              id="AmountOwed"
              defaultMessage="{amount} owed"
              values={{
                amount: (
                  <FormattedMoneyAmount
                    amount={data.host.hostMetrics.pendingPlatformTips.valueInCents}
                    currency={data.host.currency}
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
          defaultMessage="Tips for Open Collective collected from contributions to your collectives, they are deposited along with
the transaction to your organization's bank account, and we claim them at the end of each month with an expense."
        />
      </P>
    </Container>
  );
};

PlatformTipsCollected.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default PlatformTipsCollected;
