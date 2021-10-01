import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { fetchCSVFileFromRESTService } from '../../../lib/api';
import { useAsyncCall } from '../../../lib/hooks/useAsyncCall';

import PeriodFilter, { periodDateToISOString } from '../../budget/filters/PeriodFilter';
import CollectivePickerAsync from '../../CollectivePickerAsync';
import Container from '../../Container';
import { Box, Flex, Grid } from '../../Grid';
import Link from '../../Link';
import { PERIOD_FILTER_PRESETS } from '../../PeriodFilterPresetsSelect';
import StyledButton from '../../StyledButton';
import StyledInputField from '../../StyledInputField';

const getHostReportURL = (hostSlug, params) => {
  const { dateFrom, dateTo, accountsSlugs, format = 'txt' } = params || {};
  const url = new URL(`${process.env.REST_URL}/v2/${hostSlug}/hostTransactions.${format}`);

  if (dateFrom) {
    url.searchParams.set('dateFrom', dateFrom);
  }
  if (dateTo) {
    url.searchParams.set('dateTo', dateTo);
  }
  if (accountsSlugs?.length) {
    url.searchParams.set('hostedAccount', accountsSlugs.join(','));
  }

  return url.toString();
};

const FieldLabel = styled.span`
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.06em;
  line-height: 16px;
  text-transform: uppercase;
  color: ${props => props.theme.colors.black[700]};
`;

/**
 * Gets the default time interval for the CSV report. The default is intended to match the last
 * monthly host report received, which is why we use UTC.
 */
const getDefaultDateInterval = () => {
  const interval = PERIOD_FILTER_PRESETS.pastMonth.getInterval();
  return {
    timezoneType: 'UTC', // To match the monthly host report sent by email
    from: interval.from.format('YYYY-MM-DD'),
    to: interval.to.format('YYYY-MM-DD'),
  };
};

const prepareDateArgs = dateInterval => {
  if (!dateInterval) {
    return {};
  } else {
    return {
      dateFrom: periodDateToISOString(dateInterval.from, false, dateInterval.timezoneType),
      dateTo: periodDateToISOString(dateInterval.to, true, dateInterval.timezoneType),
    };
  }
};

const HostDownloadsSection = ({ host }) => {
  const [collectiveOptions, setCollectiveOptions] = React.useState(null);
  const [dateInterval, setDateInterval] = React.useState(getDefaultDateInterval);
  const accountsSlugs = collectiveOptions?.map(c => c.value.slug);
  const hostReportUrl = getHostReportURL(host.slug, { ...prepareDateArgs(dateInterval), accountsSlugs });
  const { loading: isFetching, call: downloadCSV } = useAsyncCall(
    () => {
      let filename = `host-${host.slug}-transactions`;
      if (dateInterval?.from) {
        const until = dateInterval.to || dayjs().format('YYYY-MM-DD');
        filename += `-${dateInterval.from}-${until}`;
      }

      return fetchCSVFileFromRESTService(hostReportUrl, filename);
    },
    { useErrorToast: true },
  );

  return (
    <Container bg="black.50" borderRadius={8} p={3}>
      <Grid gridTemplateColumns={['1fr', 'minmax(200px, 1fr) 2fr auto']} gridGap="8px">
        <Box>
          <StyledInputField
            name="download-host-report-period"
            label={
              <FieldLabel>
                <FormattedMessage id="Period" defaultMessage="Period" />
              </FieldLabel>
            }
          >
            {({ id }) => (
              <PeriodFilter inputId={id} onChange={setDateInterval} value={dateInterval} minDate={host.createdAt} />
            )}
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
                hostCollectiveIds={[host.legacyId]}
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
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    legacyId: PropTypes.number.isRequired,
    createdAt: PropTypes.string.isRequired,
  }).isRequired,
};

export default HostDownloadsSection;
