import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { Question } from '@styled-icons/remix-line/Question';
import { FormattedMessage } from 'react-intl';

import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Loading from '../Loading';
import MessageBox from '../MessageBox';
import MessageBoxGraphqlError from '../MessageBoxGraphqlError';
import NotFound from '../NotFound';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledTooltip from '../StyledTooltip';
import { H1, H2 } from '../Text';

import HostDownloadsSection from './reports-section/HostDownloadsSection';
import HostFeesSection from './reports-section/HostFeesSection';
import PlatformTipsCollected from './reports-section/PlatformTipsCollected';
import TotalMoneyManagedSection from './reports-section/TotalMoneyManagedSection';

const hostReportPageQuery = gqlV2/* GraphQL */ `
  query HostReportsPage($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      legacyId
      slug
      name
      currency
      isHost
      isActive
      type
      createdAt
      hostFeePercent
      hostMetrics {
        hostFees {
          valueInCents
          currency
        }
        platformFees {
          valueInCents
          currency
        }
        pendingPlatformFees {
          valueInCents
          currency
        }
        platformTips {
          valueInCents
          currency
        }
        pendingPlatformTips {
          valueInCents
          currency
        }
        pendingHostFeeShare {
          valueInCents
          currency
        }
        totalMoneyManaged {
          valueInCents
          currency
        }
      }
    }
  }
`;

const SectionTitle = ({ children, hint = null }) => (
  <Flex alignItems="center" justifyContent="space-between" mb={22}>
    <H2 fontWeight="500" fontSize="20px" lineHeight="28px">
      {children}
    </H2>
    {hint && (
      <Box mx={2}>
        <StyledTooltip content={hint}>
          <Question size={18} color="#75777A" />
        </StyledTooltip>
      </Box>
    )}
    <StyledHr borderColor="black.300" flex="1" ml={2} />
  </Flex>
);

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
  hint: PropTypes.node,
};

const HostDashboardReports = ({ hostSlug }) => {
  const { data, loading, error } = useQuery(hostReportPageQuery, { variables: { hostSlug }, context: API_V2_CONTEXT });
  if (loading) {
    return <Loading />;
  } else if (error) {
    return <MessageBoxGraphqlError error={error} maxWidth={500} m="0 auto" />;
  } else if (!data?.host) {
    return <NotFound />;
  } else if (!data.host.isActive) {
    return (
      <MessageBox withIcon type="error" maxWidth={400} m="0 auto">
        <FormattedMessage id="host.onlyActive" defaultMessage="This page is only available for active fiscal hosts" />
      </MessageBox>
    );
  }

  const { host } = data;
  return (
    <Box maxWidth={800} m="0 auto" px={2}>
      <Flex alignItems="center" mb={24} flexWrap="wrap">
        <H1 fontSize="32px" lineHeight="40px" py={2} fontWeight="normal">
          <FormattedMessage id="Reports" defaultMessage="Reports" />
        </H1>
        <Box mx="auto" />
      </Flex>
      <StyledCard mb={5} borderRadius="12px" padding="32px 24px" borderColor="black.400">
        <Container mb={38}>
          <SectionTitle
            hint={
              <FormattedMessage
                id="Host.Metrics.TotalMoneyManages.description"
                defaultMessage="Total amount held in your bank account for the Host and its Collectives."
              />
            }
          >
            <FormattedMessage id="Host.Metrics.TotalMoneyManages" defaultMessage="Total Money Managed" />
          </SectionTitle>
          <TotalMoneyManagedSection currency={host.currency} hostMetrics={host.hostMetrics} />
        </Container>
        <Container mb={38}>
          <SectionTitle>
            <FormattedMessage id="Host.FeesCollective" defaultMessage="Host fees (collected)" />
          </SectionTitle>
          <StyledCard minHeight={200}>
            <HostFeesSection hostSlug={hostSlug} />
          </StyledCard>
        </Container>
        <Container mb={38}>
          <SectionTitle hint={
            <FormattedMessage
              id="HostDashboardReports.TransactionsOverview.description"
              defaultMessage="Transactions related to contributions and expenses."
            />
          }>
            <FormattedMessage id="TransactionsOverview" defaultMessage="Transactions overview" />
          </SectionTitle>
          <TransactionsOverviewSection currency={currency}/>
        </Container>
        <Box mb={4}>
          <PlatformTipsCollected hostSlug={hostSlug} />
        </Box>
        <Container>
          <SectionTitle>
            <FormattedMessage id="Downloads" defaultMessage="Downloads" />
          </SectionTitle>
          <HostDownloadsSection host={host} />
        </Container>
      </StyledCard>
    </Box>
  );
};

HostDashboardReports.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default HostDashboardReports;
