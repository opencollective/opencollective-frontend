import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { fetchCSVFileFromRESTService } from '../../../lib/api';
import dayjs from '../../../lib/dayjs';
import { API_V2_CONTEXT, gqlV2 } from '../../../lib/graphql/helpers';
import { useAsyncCall } from '../../../lib/hooks/useAsyncCall';

import PeriodFilter from '../../budget/filters/PeriodFilter';
import CollectivePickerAsync from '../../CollectivePickerAsync';
import Container from '../../Container';
import { Box, Flex, Grid } from '../../Grid';
import Link from '../../Link';
import StyledButton from '../../StyledButton';
import StyledInputField from '../../StyledInputField';

const getHostReportURL = (hostSlug, params) => {
  const { from, to, accountsSlugs, format = 'txt' } = params || {};
  const url = new URL(`${process.env.REST_URL}/v2/${hostSlug}/hostTransactions.${format}`);
  url.searchParams.set('reportType', 'hostTransactions');

  if (from) {
    url.searchParams.set('dateFrom', from);
  }
  if (to) {
    url.searchParams.set('dateTo', to);
  }
  if (accountsSlugs?.length) {
    url.searchParams.set('hostedAccount', accountsSlugs.join(','));
  }

  return url.toString();
};

const hostReportDownloadsSectionQuery = gqlV2/* GraphQL */ `
  query HostReportDownloadsSection($hostSlug: String!) {
    host(slug: $hostSlug) {
      id
      legacyId
    }
  }
`;

const FieldLabel = styled.span`
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.06em;
  line-height: 16px;
  text-transform: uppercase;
  color: ${props => props.theme.colors.black[700]};
`;

const HostDownloadsSection = ({ hostSlug }) => {
  const [collectiveOptions, setCollectiveOptions] = React.useState(null);
  const [dateInterval, setDateInterval] = React.useState(null); // TODO: Value = last month preset
  const variables = { hostSlug };
  const { loading, data } = useQuery(hostReportDownloadsSectionQuery, { variables, context: API_V2_CONTEXT });
  const host = data?.host;
  const accountsSlugs = collectiveOptions?.map(c => c.value.slug);
  const hostReportUrl = getHostReportURL(hostSlug, { ...dateInterval, accountsSlugs });
  const { loading: isFetching, call: downloadCSV } = useAsyncCall(
    () => {
      const formatDate = d => dayjs(d).format('YYYY-MM-DD');
      let filename = `host-${hostSlug}-transactions`;
      if (dateInterval?.from) {
        filename += `-${formatDate(dateInterval.from)}-${formatDate(dateInterval.to)}`;
      }

      return fetchCSVFileFromRESTService(hostReportUrl, filename);
    },
    { useErrorToast: true },
  );

  return (
    <Container bg="black.50" borderRadius={8} p={3}>
      <Grid gridTemplateColumns={['1fr', '1fr 2fr auto']} gridGap="8px">
        <Box>
          <StyledInputField
            name="download-host-report-period"
            label={
              <FieldLabel>
                <FormattedMessage id="Period" defaultMessage="Period" />
              </FieldLabel>
            }
          >
            {({ id }) => <PeriodFilter inputId={id} onChange={setDateInterval} value={dateInterval} />}
          </StyledInputField>
        </Box>
        <Box>
          <StyledInputField
            name="download-host-report-collectives"
            label={
              <FieldLabel>
                <FormattedMessage defaultMessage="Filter by collective" />
              </FieldLabel>
            }
          >
            {({ id }) => (
              <CollectivePickerAsync
                inputId={id}
                onChange={setCollectiveOptions}
                hostCollectiveIds={host ? [host.legacyId] : null}
                disabled={loading}
                isMulti
              />
            )}
          </StyledInputField>
        </Box>
        <Flex alignItems="flex-start" pt={[16, 26]}>
          <Link
            href={hostReportUrl}
            onClick={e => {
              e.preventDefault();
              downloadCSV();
            }}
          >
            <StyledButton
              buttonStyle="primary"
              buttonSize="small"
              py="7px"
              width="100%"
              minWidth={140}
              loading={isFetching}
            >
              <FormattedMessage defaultMessage="Generate report" />
            </StyledButton>
          </Link>
        </Flex>
      </Grid>
    </Container>
  );
};

HostDownloadsSection.propTypes = {
  hostSlug: PropTypes.string.isRequired,
};

export default HostDownloadsSection;
