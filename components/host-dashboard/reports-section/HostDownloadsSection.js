import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';

import { fetchCSVFileFromRESTService } from '../../../lib/api';
import { simpleDateToISOString } from '../../../lib/date-utils';
import { useAsyncCall } from '../../../lib/hooks/useAsyncCall';

import Container from '../../Container';
import Link from '../../Link';
import StyledButton from '../../StyledButton';

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
    url.searchParams.set('account', accountsSlugs.join(','));
  }

  return url.toString();
};

const prepareDateArgs = dateInterval => {
  if (!dateInterval) {
    return {};
  } else {
    return {
      dateFrom: simpleDateToISOString(dateInterval.from, false, dateInterval.timezoneType),
      dateTo: simpleDateToISOString(dateInterval.to, true, dateInterval.timezoneType),
    };
  }
};

const triggerCSVDownload = (host, reportUrl, dateInterval) => {
  let filename = `host-${host.slug}-transactions`;
  if (dateInterval?.from) {
    const until = dateInterval.to || dayjs().format('YYYY-MM-DD');
    filename += `-${dateInterval.from}-${until}`;
  }

  return fetchCSVFileFromRESTService(reportUrl, filename);
};

const HostDownloadsSection = ({ host, collectives, dateInterval }) => {
  const accountsSlugs = collectives?.map(c => c.value.slug);
  const hostReportUrl = getHostReportURL(host?.slug, { ...prepareDateArgs(dateInterval), accountsSlugs });
  const { loading: isFetching, call: downloadCSV } = useAsyncCall(
    () => triggerCSVDownload(host, hostReportUrl, dateInterval),
    { useErrorToast: true },
  );

  return (
    <Container>
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
          minWidth={140}
          loading={isFetching}
          disabled={!host}
        >
          <FormattedMessage defaultMessage="Generate CSV report" />
        </StyledButton>
      </Link>
    </Container>
  );
};

HostDownloadsSection.propTypes = {
  collectives: PropTypes.arrayOf(PropTypes.object),
  dateInterval: PropTypes.object,
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    legacyId: PropTypes.number.isRequired,
    createdAt: PropTypes.string.isRequired,
  }),
};

export default HostDownloadsSection;
