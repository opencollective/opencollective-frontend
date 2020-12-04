import React from 'react';
import PropTypes from 'prop-types';
import { withApollo } from '@apollo/client/react/hoc';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';

import { exportFile } from '../../lib/export_file';
import { transactionsQuery } from '../../lib/graphql/queries';

import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import PopupMenu from '../PopupMenu';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputField from '../StyledInputField';

const transformResultInCSV = json => {
  const q = value => `"${value}"`; /* Quote value */
  const f = value => (value / 100).toFixed(2); /* Add cents */
  const d = value => dayjs(new Date(value)).format('YYYY-MM-DD HH:mm:ss');

  // Sanity check. It will return an empty CSV for the user
  if (json.length === 0) {
    return '';
  }

  // All the json lines contain the same values for these two
  // variables. It's save to get them from any index.
  const hostCurrency = json[0].host.currency;
  const collectiveCurrency = json[0].currency;

  const header = [
    'Transaction Description',
    'User Name',
    'User Profile',
    'Transaction Date',
    'Collective Currency',
    'Host Currency',
    'Transaction Amount',
    `Host Fee (${hostCurrency})`,
    `Open Collective Fee (${hostCurrency})`,
    `Payment Processor Fee (${hostCurrency})`,
    `Net Amount (${collectiveCurrency})`,
    'Subscription Interval',
    'Order Date',
  ].join(',');

  const lines = json.map(i => {
    const profile = `http://opencollective.com/${i.fromCollective.slug}`;
    const subscriptionInterval = i.subscription ? i.subscription.interval : 'one time';
    return [
      q(i.description) /* Transaction Description */,
      q(i.fromCollective.name) /* User Name  */,
      q(profile) /* User Profile  */,
      d(i.createdAt) /* Transaction Date  */,
      q(i.currency) /* Currency */,
      q(hostCurrency) /* Host Currency */,
      f(i.amount) /* Transaction Amount */,
      f(i.hostFeeInHostCurrency) /* Host Fee */,
      f(i.platformFeeInHostCurrency) /* Platform Fee */,
      f(i.paymentProcessorFeeInHostCurrency) /* Payment Processor Fee */,
      f(i.netAmountInCollectiveCurrency) /* Net Amount */,
      q(subscriptionInterval) /* Interval of subscription */,
      q(new Date(i.createdAt).toISOString()) /* Order Date */,
    ].join(',');
  });

  return [header].concat(lines).join('\n');
};

const TransactionsDownloadCSV = ({ collective, client }) => {
  const [dateInterval, setDateInterval] = React.useState({
    dateFrom: dayjs().subtract(1, 'month').format('YYYY-MM-DD'),
    dateTo: dayjs().format('YYYY-MM-DD'),
  });
  const [isEmpty, setEmpty] = React.useState(false);
  const [isLoading, setLoading] = React.useState(false);

  const download = async () => {
    setLoading(true);
    setEmpty(false);
    const result = await client.query({
      query: transactionsQuery,
      variables: {
        ...dateInterval,
        CollectiveId: collective.id,
      },
    });
    const csv = transformResultInCSV(result.data.allTransactions);

    setLoading(false);
    // Don't prompt the file download unless there's data coming
    if (csv === '') {
      setEmpty(true);
      return;
    }

    // Helper to prepare date values to be part of the file name
    const format = d => dayjs(d).format('YYYY-MM-DD');
    let fileName = `${collective.slug}-from-`;
    fileName += `${format(dateInterval.dateFrom)}-to-`;
    fileName += `${format(dateInterval.dateTo)}.csv`;
    return exportFile('text/plain;charset=utf-8', fileName, csv);
  };

  return (
    <Flex flexWrap="wrap" my={['8px', 0]}>
      <PopupMenu
        placement="bottom-end"
        onClose={() => {
          setEmpty(false);
          setLoading(false);
          setDateInterval({});
        }}
        Button={({ onClick }) => (
          <StyledButton
            data-cy="download-csv"
            onClick={onClick}
            buttonSize="small"
            minWidth={140}
            isBorderless
            flexGrow={1}
          >
            <FormattedMessage id="transactions.downloadcsvbutton" defaultMessage="Download CSV" />
            <IconDownload size="13px" style={{ marginLeft: '8px' }} />
          </StyledButton>
        )}
      >
        <Box mx="8px" my="16px" width="190px">
          <StyledInputField
            data-cy="download-csv-start-date"
            label="Start Date"
            name="dateFrom"
            mt="12px"
            labelFontSize="13px"
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                type="date"
                closeOnSelect
                lineHeight={1}
                fontSize="13px"
                value={dateInterval.dateFrom}
                onChange={e => setDateInterval({ ...dateInterval, dateFrom: e.target.value })}
              />
            )}
          </StyledInputField>
          <StyledInputField
            data-cy="download-csv-end-date"
            label="End Date"
            name="dateTo"
            mt="12px"
            labelFontSize="13px"
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                type="date"
                closeOnSelect
                lineHeight={1}
                fontSize="13px"
                value={dateInterval.dateTo}
                onChange={e => setDateInterval({ ...dateInterval, dateTo: e.target.value })}
              />
            )}
          </StyledInputField>
          <StyledButton
            data-cy="download-csv-download"
            disabled={!dateInterval.dateFrom || !dateInterval.dateTo}
            buttonSize="tiny"
            buttonStyle="primary"
            onClick={download}
            loading={isLoading}
            mt="12px"
          >
            Download
          </StyledButton>
          {isEmpty && (
            <MessageBox data-cy="download-csv-error" type="info" fontSize="13px" mt="12px">
              <FormattedMessage
                id="transactions.emptysearch"
                defaultMessage="There are no transactions in this date range."
              />
            </MessageBox>
          )}
        </Box>
      </PopupMenu>
    </Flex>
  );
};

TransactionsDownloadCSV.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    id: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
  }).isRequired,
  client: PropTypes.object,
};

export default withApollo(TransactionsDownloadCSV);
