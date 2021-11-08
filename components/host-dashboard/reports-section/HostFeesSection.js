import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { ChevronDown } from '@styled-icons/fa-solid/ChevronDown/ChevronDown';
import { ChevronUp } from '@styled-icons/fa-solid/ChevronUp/ChevronUp';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { CollectiveType } from '../../../lib/collective-sections';
import { formatCurrency } from '../../../lib/currency-utils';
import dayjs from '../../../lib/dayjs';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';

import PeriodFilter from '../../budget/filters/PeriodFilter';
import CollectivePickerAsync from '../../CollectivePickerAsync';
import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import Image from '../../Image';
import Loading from '../../Loading';
import StyledLinkButton from '../../StyledLinkButton';
import { P, Span } from '../../Text';

import { HostFeesSectionHistorical } from './HostFeesSectionHistorical';

const hostFeeSectionQuery = gqlV2/* GraphQL */ `
  query HostFeeSection(
    $hostSlug: String!
    $dateFrom: DateTime!
    $dateTo: DateTime!
    $account: [AccountReferenceInput!]
  ) {
    host(slug: $hostSlug) {
      id
      hostMetrics(dateFrom: $dateFrom, dateTo: $dateTo, account: $account) {
        hostFees {
          valueInCents
          currency
        }
        hostFeeShare {
          valueInCents
          currency
        }
      }
    }
  }
`;

const FilterLabel = styled.label`
  font-weight: 500;
  text-transform: uppercase;
  margin-bottom: 8px;
  color: #4e5052;
`;

const getQueryVariables = (hostSlug, dateInterval, collectives) => {
  return {
    dateFrom: dateInterval?.from ? new Date(dateInterval.from) : dayjs().startOf('month').toDate(),
    dateTo: dateInterval?.to ? new Date(dateInterval.to) : dayjs().endOf('day').toDate(),
    account: collectives,
    hostSlug,
  };
};

const HostFeesSection = ({ hostSlug }) => {
  const [dateInterval, setDateInterval] = useState(null);
  const [collectives, setCollectives] = useState(null);
  const variables = getQueryVariables(hostSlug, dateInterval, collectives);
  const { loading, data, previousData } = useQuery(hostFeeSectionQuery, { variables, context: API_V2_CONTEXT });
  const host = loading && !data ? previousData?.host : data?.host;
  const [showHostFeeChart, setShowHostFeeChart] = useState(false);

  if (loading && !host) {
    return <Loading />;
  }

  let totalHostFees, profit, sharedRevenue;
  if (!loading) {
    const { hostFees, hostFeeShare } = data.host.hostMetrics;
    totalHostFees = hostFees.valueInCents;
    sharedRevenue = hostFeeShare.valueInCents;
    profit = totalHostFees - sharedRevenue;
  }

  const setCollectiveFilter = collectives => {
    if (collectives.length === 0) {
      setCollectives(null);
    } else {
      const collectiveIds = collectives.map(collective => ({ legacyId: collective.value.id }));
      setCollectives(collectiveIds);
    }
  };

  return (
    <React.Fragment>
      <Flex flexWrap="wrap" mt="16px" mb="16px">
        <Container width={[1, 1, 1 / 2]} pr={2} mb={[3, 3, 0, 0]}>
          <FilterLabel htmlFor="transactions-period-filter">
            <FormattedMessage id="TransactionsOverviewSection.PeriodFilter" defaultMessage="Filter by Date" />
          </FilterLabel>
          <PeriodFilter onChange={setDateInterval} value={dateInterval} minDate={host?.createdAt} />
        </Container>
        <Container width={[1, 1, 1 / 2]}>
          <FilterLabel htmlFor="transactions-collective-filter">
            <FormattedMessage id="TransactionsOverviewSection.CollectiveFilter" defaultMessage="Filter by Collective" />
          </FilterLabel>
          <CollectivePickerAsync
            inputId="TransactionsCollectiveFilter"
            data-cy="transactions-collective-filter"
            types={[CollectiveType.COLLECTIVE, CollectiveType.EVENT, CollectiveType.PROJECT]}
            isMulti
            hostCollectiveIds={[host?.legacyId]}
            onChange={value => setCollectiveFilter(value)}
          />
        </Container>
      </Flex>
      {loading ? (
        <Loading />
      ) : (
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
              {formatCurrency(totalHostFees, host.currency)}
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
              {formatCurrency(profit, host.currency)}
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
              {formatCurrency(sharedRevenue, host.currency)}
            </Box>
            <P fontSize="12px" fontWeight="400" mt="10px">
              <FormattedMessage defaultMessage="The cost of using the platform. It is collected each month with a settlement invoice uploaded to you as an expense." />
            </P>
          </Container>
        </Flex>
      )}
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
      {showHostFeeChart && <HostFeesSectionHistorical collectives={collectives} hostSlug={hostSlug} />}
    </React.Fragment>
  );
};

HostFeesSection.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default HostFeesSection;
