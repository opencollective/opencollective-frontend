import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { FormattedMessage, injectIntl } from 'react-intl';

import { formatValueAsCurrency } from '../../../lib/currency-utils';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import Container from '../../Container';
import { Box } from '../../Grid';
import Loading from '../../Loading';
import StyledCard from '../../StyledCard';
import { P, Span } from '../../Text';
import SettingsTitle from '../SettingsTitle';

const metricsQuery = gqlV2/* GraphQL */ `
  query HostMetricsQuery($slug: String) {
    host(slug: $slug) {
      id
      slug
      hostMetrics {
        hostFees {
          value
          currency
        }
        platformFees {
          value
          currency
        }
        pendingPlatformFees {
          value
          currency
        }
        platformTips {
          value
          currency
        }
        pendingPlatformTips {
          value
          currency
        }
        hostFeeShare {
          value
          currency
        }
        pendingHostFeeShare {
          value
          currency
        }
        totalMoneyManaged {
          value
          currency
        }
        hostFeeSharePercent
      }
    }
  }
`;

const HostMetrics = props => {
  const { loading, data } = useQuery(metricsQuery, {
    context: API_V2_CONTEXT,
    variables: { slug: props.collective.slug },
  });

  if (loading) {
    return <Loading />;
  }

  return (
    <Fragment>
      <SettingsTitle>
        <FormattedMessage id="Host.Metrics" defaultMessage="Host Metrics" />
      </SettingsTitle>

      <Box>
        <P>
          <FormattedMessage
            id="Host.Metrics.Description"
            defaultMessage="Host Metrics showing up-to-date values. Pending fees are invoiced at the beginning of every subsequent month."
          />
        </P>
        <StyledCard display="flex" width="100%" flexDirection={['column']} my={2}>
          <Container background="#F5F7FA">
            <Box flex="1" py={16} px={4}>
              <P fontSize="10px" textTransform="uppercase" color="black.700">
                <FormattedMessage id="Host.Metrics.TotalMoneyManages" defaultMessage="Total Money Managed" />
              </P>
              <P fontSize="20px" mt={1}>
                {formatValueAsCurrency(data.host.hostMetrics.totalMoneyManaged)}{' '}
                <Span color="black.400">{data.host.hostMetrics.totalMoneyManaged.currency}</Span>
              </P>
              <P fontSize="10px">
                <FormattedMessage
                  id="Host.Metrics.TotalMoneyManages.description"
                  defaultMessage="Total amount held on your bank account for yourself and on behalf of the hosted Collectives."
                />
              </P>
            </Box>
          </Container>
          <Box flex="1" py={16} px={4}>
            <P fontSize="10px" textTransform="uppercase" color="black.700">
              <FormattedMessage id="Host.Metrics.HostFees" defaultMessage="Host Fees" />
            </P>
            <P fontSize="20px" mt={1}>
              {formatValueAsCurrency(data.host.hostMetrics.hostFees)}{' '}
              <Span color="black.400">{data.host.hostMetrics.hostFees.currency}</Span>
            </P>
            <P fontSize="10px">
              <FormattedMessage
                id="Host.Metrics.HostFees.description"
                defaultMessage="Total Host Fees collected by you since the first day of the month. They will be added to your budget at the end of the month."
              />
            </P>
          </Box>
          <Box flex="1" py={16} px={4}>
            <P fontSize="10px" textTransform="uppercase" color="black.700">
              <FormattedMessage id="Host.Metrics.PlatformFees" defaultMessage="Platform Fees" />
            </P>
            <P fontSize="20px" mt={1}>
              {formatValueAsCurrency(data.host.hostMetrics.platformFees)}{' '}
              <Span color="black.400">{data.host.hostMetrics.platformFees.currency}</Span>
            </P>
            <P fontSize="10px">
              <FormattedMessage
                id="Host.Metrics.PlatformFees.description"
                defaultMessage="Total Platform Fees generated for Open Collective since the first day of the month."
              />
            </P>
          </Box>
          <Box flex="1" py={16} px={4}>
            <P fontSize="10px" textTransform="uppercase" color="black.700">
              <FormattedMessage id="Host.Metrics.PendingPlatformFees" defaultMessage="Pending Platform Fees" />
            </P>
            <P fontSize="20px" mt={1}>
              {formatValueAsCurrency(data.host.hostMetrics.pendingPlatformFees)}{' '}
              <Span color="black.400">{data.host.hostMetrics.pendingPlatformFees.currency}</Span>
            </P>
            <P fontSize="10px">
              <FormattedMessage
                id="Host.Metrics.PendingPlatformFees.description"
                defaultMessage="Total Platform Fees collected for Open Collective since the first day of the month. They will be returned through an invoice from Open Collective at the end of the month."
              />
            </P>
          </Box>
          <Box flex="1" py={16} px={4}>
            <P fontSize="10px" textTransform="uppercase" color="black.700">
              <FormattedMessage id="Host.Metrics.PlatformTips" defaultMessage="Platform Tips" />
            </P>
            <P fontSize="20px" mt={1}>
              {formatValueAsCurrency(data.host.hostMetrics.platformTips)}{' '}
              <Span color="black.400">{data.host.hostMetrics.platformTips.currency}</Span>
            </P>
            <P fontSize="10px">
              <FormattedMessage
                id="Host.Metrics.PlatformTips.description"
                defaultMessage="Total Platform Tips genereated for Open Collective since the first day of the month."
              />
            </P>
          </Box>
          <Box flex="1" py={16} px={4}>
            <P fontSize="10px" textTransform="uppercase" color="black.700">
              <FormattedMessage id="Host.Metrics.PendingPlatformTips" defaultMessage="Pending Platform Tips" />
            </P>
            <P fontSize="20px" mt={1}>
              {formatValueAsCurrency(data.host.hostMetrics.pendingPlatformTips)}{' '}
              <Span color="black.400">{data.host.hostMetrics.pendingPlatformTips.currency}</Span>
            </P>
            <P fontSize="10px">
              <FormattedMessage
                id="Host.Metrics.PendingPlatformTips.description"
                defaultMessage="Total Platform Tips collected for Open Collective since the first day of the month. They will be returned through an invoice from Open Collective at the end of the month."
              />
            </P>
          </Box>
          <Box flex="1" py={16} px={4}>
            <P fontSize="10px" textTransform="uppercase" color="black.700">
              <FormattedMessage
                id="Host.Metrics.HostFeeShare"
                defaultMessage="Host Fee Share ({pct}% over collected host fees)"
                values={{ pct: data.host.hostMetrics.hostFeeSharePercent }}
              />
            </P>
            <P fontSize="20px" mt={1}>
              {formatValueAsCurrency(data.host.hostMetrics.hostFeeShare)}{' '}
              <Span color="black.400">{data.host.hostMetrics.hostFeeShare.currency}</Span>
            </P>
            <P fontSize="10px">
              <FormattedMessage
                id="Host.Metrics.hostFeeShare.description"
                defaultMessage="Total Host Fees you are sharing this month with Open Collective as part of your Host Plan. "
              />
            </P>
          </Box>
          <Box flex="1" py={16} px={4}>
            <P fontSize="10px" textTransform="uppercase" color="black.700">
              <FormattedMessage id="Host.Metrics.PendingHostFeeShare" defaultMessage="Pending Host Fee Share" />
            </P>
            <P fontSize="20px" mt={1}>
              {formatValueAsCurrency(data.host.hostMetrics.pendingHostFeeShare)}{' '}
              <Span color="black.400">{data.host.hostMetrics.pendingHostFeeShare.currency}</Span>
            </P>
            <P fontSize="10px">
              <FormattedMessage
                id="Host.Metrics.pendingHostFeeShare.description"
                defaultMessage="Part of Host Fees that still needs to be shared with with Open Collective as part of your Host Plan. They will be charged through an invoice from Open Collective at the end of the month."
              />
            </P>
          </Box>
        </StyledCard>
      </Box>
    </Fragment>
  );
};

HostMetrics.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
  }),
  hideTopsection: PropTypes.func.isRequired,
};

export default injectIntl(HostMetrics);
