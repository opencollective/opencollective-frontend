import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { Download as IconDownload } from '@styled-icons/feather/Download';
import dayjs from 'dayjs';
import { groupBy, sumBy, truncate, uniq } from 'lodash';
import { FormattedMessage } from 'react-intl';

import { formatCurrency } from '../../lib/currency-utils';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import { saveInvoice } from '../../lib/transactions';

import Avatar from '../Avatar';
import CollectivePicker, { FLAG_COLLECTIVE_PICKER_COLLECTIVE } from '../CollectivePicker';
import { Box, Flex } from '../Grid';
import PopupMenu from '../PopupMenu';
import StyledButton from '../StyledButton';
import StyledButtonSet from '../StyledButtonSet';
import StyledSelect from '../StyledSelect';

const FREQUENCIES = {
  monthly: <FormattedMessage id="Frequency.Monthly" defaultMessage="Monthly" />,
  yearly: <FormattedMessage id="Frequency.Yearly" defaultMessage="Yearly" />,
};

export const invoicesQuery = gql`
  query TransactionsDownloadInvoices($fromCollectiveSlug: String!) {
    allInvoices(fromCollectiveSlug: $fromCollectiveSlug) {
      slug
      year
      month
      totalAmount
      currency
      fromCollective {
        slug
      }
      host {
        slug
        name
      }
    }
  }
`;

// eslint-disable-next-line react/prop-types
const InvoiceLabel = ({ value: invoice }) => (
  <Flex alignItems="center">
    <Avatar collective={invoice.host} radius={16} type="ORGANIZATION" />
    <Flex flexDirection="column" ml={2}>
      {`${truncate(invoice.host.name, { length: 20 })} (${formatCurrency(invoice.totalAmount, invoice.currency)})`}
    </Flex>
  </Flex>
);

const makeLabel = invoice => ({
  value: invoice,
  [FLAG_COLLECTIVE_PICKER_COLLECTIVE]: true,
});

const makeMonthlyOptions = (allInvoices, year) => {
  const invoices = allInvoices.filter(i => i.year === year);
  const byMonth = groupBy(invoices, 'month');
  return Object.keys(byMonth)
    .map(month => {
      const dateMonth = dayjs.utc(`${year}${month}`, 'YYYYMM');
      const dateFrom = dateMonth.toISOString();
      const dateTo = dateMonth.endOf('month').toISOString();
      return {
        label: dateMonth.format('MMMM'),
        options: byMonth[month].map(invoice => ({ ...invoice, dateFrom, dateTo })).map(makeLabel),
      };
    })
    .reverse();
};

const makeYearlyOptions = invoices => {
  const byYear = groupBy(invoices, 'year');
  return Object.keys(byYear)
    .map(year => {
      const bySlug = groupBy(byYear[year], 'host.slug');
      const options = Object.keys(bySlug)
        .map(slug => {
          const invoices = bySlug[slug];
          const totalAmount = sumBy(invoices, 'totalAmount');
          const dateFrom = dayjs.utc(year, 'YYYY').toISOString();
          const dateTo = dayjs.utc(year, 'YYYY').endOf('year').toISOString();
          return { ...invoices[0], dateFrom, dateTo, totalAmount };
        })
        .map(makeLabel);
      return {
        label: year,
        options,
      };
    })
    .reverse();
};

const TransactionsDownloadInvoices = ({ collective }) => {
  const [interval, setInterval] = React.useState('monthly');
  const [year, setYear] = React.useState();
  const { data, loading } = useQuery(invoicesQuery, {
    variables: {
      fromCollectiveSlug: collective.slug,
    },
    onCompleted: data => {
      const y = data?.allInvoices[0]?.year;
      setYear({ value: y, label: y });
    },
  });
  const { loading: loadingInvoice, call: downloadInvoice } = useAsyncCall(saveInvoice);

  const years = uniq(data?.allInvoices.map(i => i.year)).map(year => ({ value: year, label: year }));
  const options =
    data &&
    (interval === 'monthly' && year
      ? makeMonthlyOptions(data.allInvoices, year.value)
      : makeYearlyOptions(data.allInvoices));

  return (
    <Flex flexWrap="wrap" my={['8px', 0]}>
      <PopupMenu
        placement="bottom-end"
        Button={({ onClick }) => (
          <StyledButton onClick={onClick} buttonSize="small" minWidth={140} isBorderless flexGrow={1}>
            <FormattedMessage id="transactions.downloadinvoicesbutton" defaultMessage="Download Receipts" />
            <IconDownload size="13px" style={{ marginLeft: '8px' }} />
          </StyledButton>
        )}
      >
        <Box mx="8px" my="16px" width="190px">
          <StyledButtonSet items={['monthly', 'yearly']} selected={interval} onChange={setInterval} size="tiny">
            {({ item }) => FREQUENCIES[item]}
          </StyledButtonSet>
          {interval === 'monthly' && (
            <StyledSelect
              inputId="year-select"
              options={years}
              value={year}
              onChange={setYear}
              isLoading={loading}
              mt="12px"
              fontSize="11px"
              styles={{ control: { height: '30px', minHeight: 'auto' } }}
              hideDropdownIndicator
              placeholder="Select Year"
            />
          )}
          <CollectivePicker
            customOptions={options}
            onChange={({ value }) =>
              downloadInvoice({
                fromCollectiveSlug: value.fromCollective.slug,
                toCollectiveSlug: value.host.slug,
                dateFrom: value.dateFrom,
                dateTo: value.dateTo,
              })
            }
            isLoading={loadingInvoice}
            formatOptionLabel={InvoiceLabel}
            fontSize="11px"
            mt="12px"
            styles={{ control: { height: '30px', minHeight: 'auto' } }}
            placeholder={interval === 'monthly' ? 'Select Month' : 'Select Year'}
            hideDropdownIndicator
            menuPortalTarget={null}
          />
        </Box>
      </PopupMenu>
    </Flex>
  );
};

TransactionsDownloadInvoices.propTypes = {
  onChange: PropTypes.func,
  filters: PropTypes.object,
  collective: PropTypes.shape({
    slug: PropTypes.string,
    id: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
  }).isRequired,
};

export default TransactionsDownloadInvoices;
