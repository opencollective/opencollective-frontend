import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { groupBy, uniq } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { useAsyncCall } from '../../../lib/hooks/useAsyncCall';
import { saveInvoice } from '../../../lib/transactions';

import Avatar from '../../Avatar';
import { Box, Flex } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import MessageBoxGraphqlError from '../../MessageBoxGraphqlError';
import StyledButton from '../../StyledButton';
import StyledCard from '../../StyledCard';
import StyledHr from '../../StyledHr';
import StyledSelect from '../../StyledSelect';
import { H2, H3, P, Span } from '../../Text';

const HostName = styled(P)`
  margin: 0 !important;
`;

dayjs.extend(utc);

export const invoicesQuery = gql`
  query TransactionsDownloadInvoices($fromCollectiveSlug: String!) {
    allInvoices(fromCollectiveSlug: $fromCollectiveSlug) {
      slug
      year
      month
      totalAmount
      totalTransactions
      currency
      fromCollective {
        slug
      }
      host {
        slug
        name
        imageUrl
      }
    }
  }
`;

const filterInvoices = (allInvoices, filterBy) => {
  if (filterBy === 'PAST_12_MONTHS') {
    const twelveMonthsAgo = dayjs().subtract(11, 'month');
    return allInvoices.filter(i => {
      const dateMonth = dayjs.utc(`${i.year}-${i.month}`, 'YYYY-M');
      return dateMonth.isAfter(twelveMonthsAgo);
    });
  }

  return allInvoices.filter(i => i.year === filterBy);
};

const ReceiptsLoadingPlaceholder = () => (
  <Flex flexDirection="column">
    <Flex alignItems="center" justifyContent="space-between">
      <LoadingPlaceholder mr={3} width="104px" height="24px" />
      <StyledHr width="80%" borderStyle="solid" borderColor="#C4C7CC" />
    </Flex>
    {Array.from({ length: 3 }, (_, index) => (
      <StyledCard my={3} key={index} display="flex" alignItems="center" py={3} px="24px">
        <LoadingPlaceholder borderRadius="16px" width="48px" height="48px" mr={3} />
        <Box>
          <LoadingPlaceholder mb={2} width={['164px', '361px']} height="24px" />
          <LoadingPlaceholder width="115px" height="14px" />
        </Box>
      </StyledCard>
    ))}
  </Flex>
);

const NoReceipts = () => (
  <Flex alignItems="center" justifyContent="center" my={5}>
    <StyledCard height="100px" padding="16px 24px" display="flex" alignItems="center" justifyContent="center">
      <H3 fontSize="15px" lineHeight="24px" color="black.500" textAlign="center">
        <FormattedMessage id="paymentReceipt.noReceipts" defaultMessage="No receipt available within this period." />
      </H3>
    </StyledCard>
  </Flex>
);

const ReceiptCard = ({ ...props }) => (
  <StyledCard
    my={3}
    alignItems="center"
    display="flex"
    flexDirection={['column', 'row']}
    justifyContent="space-between"
    py={3}
    px="24px"
  >
    <Flex alignItems="center">
      <Avatar collective={props.host} borderRadius="16px" mr={3} size="48px" />
      <Box>
        <HostName
          fontSize={['13px', '17px']}
          lineHeight={['20px', '24px']}
          letterSpacing={[null, '-0.16px']}
          color="black.900"
          fontWeight="500"
          my={0}
        >
          <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" />: {props.host.name}
        </HostName>
        <Span
          fontSize={['10px', '15px']}
          lineHeight={['14px', '21px']}
          letterSpacing={[null, '-0.1px']}
          color="black.600"
          fontWeight="400"
          mt={0}
        >
          {`${props.month}/${props.year}`} - {props.totalTransactions}{' '}
          <FormattedMessage
            id="paymentReceipt.transaction"
            values={{
              n: props.totalTransactions,
            }}
            defaultMessage="{n, plural, one {Transaction} other {Transactions}}"
          />
        </Span>
      </Box>
    </Flex>
    <StyledButton
      lineHeight="16px"
      fontSize="13px"
      width="142px"
      padding="4px 16px"
      disabled={props.loadingInvoice}
      mt={3}
      borderColor="#C4C7CC"
      onClick={() => {
        props.downloadInvoice({
          fromCollectiveSlug: props.fromCollective.slug,
          toCollectiveSlug: props.host.slug,
          dateFrom: props.dateFrom,
          dateTo: props.dateTo,
        });
      }}
    >
      <FormattedMessage id="DownloadReceipt" defaultMessage="Download receipt" />
    </StyledButton>
  </StyledCard>
);

ReceiptCard.propTypes = {
  host: PropTypes.shape({
    name: PropTypes.string,
    imageUrl: PropTypes.string,
    slug: PropTypes.string,
  }),
  loadingInvoice: PropTypes.bool,
  fromCollective: PropTypes.shape({
    slug: PropTypes.string,
  }),
  downloadInvoice: PropTypes.func,
  dateFrom: PropTypes.string,
  dateTo: PropTypes.string,
  totalTransactions: PropTypes.number,
  month: PropTypes.number,
  year: PropTypes.number,
};

const Receipts = ({ invoices }) => {
  const { loading: loadingInvoice, call: downloadInvoice } = useAsyncCall(saveInvoice);
  const byMonthYear = groupBy(invoices, invoice => `${invoice.month}-${invoice.year}`);

  return Object.keys(byMonthYear).map(monthYear => {
    const dateMonth = dayjs.utc(`${byMonthYear[monthYear][0].year}-${byMonthYear[monthYear][0].month}`, 'YYYY-M');
    const dateFrom = dateMonth.toISOString();
    const dateTo = dateMonth.endOf('month').toISOString();

    return (
      <Flex key={monthYear} flexDirection="column">
        <Flex alignItems="center" justifyContent="space-between">
          <H3 fontSize="16px" lineHeight="24px" color="black.900">{`${dateMonth.format('MMMM')} ${dateMonth.format(
            'YYYY',
          )}`}</H3>
          <StyledHr width={['60%', '80%']} borderStyle="solid" borderColor="#C4C7CC" />
        </Flex>
        {byMonthYear[monthYear].map((invoice, index) => (
          <ReceiptCard key={index.toString()} {...{ ...invoice, loadingInvoice, downloadInvoice, dateFrom, dateTo }} />
        ))}
      </Flex>
    );
  });
};

const PaymentReceipts = ({ collective }) => {
  const defaultFilter = {
    label: 'Past 12 months',
    value: 'PAST_12_MONTHS',
  };
  const [activeFilter, setActiveFilter] = React.useState(defaultFilter);
  const { data, loading, error } = useQuery(invoicesQuery, {
    variables: {
      fromCollectiveSlug: collective.slug,
    },
  });

  const yearsFilter = uniq(data?.allInvoices.map(i => i.year)).map(year => ({ value: year, label: year }));
  const invoices = data ? filterInvoices(data.allInvoices, activeFilter.value) : [];
  let content = null;

  if (loading) {
    content = <ReceiptsLoadingPlaceholder />;
  } else if (invoices.length === 0) {
    content = <NoReceipts />;
  } else if (error) {
    content = <MessageBoxGraphqlError error={error} />;
  } else {
    content = <Receipts invoices={invoices} />;
  }

  return (
    <Flex flexDirection="column">
      <Box mb={4}>
        <H2 fontSize="20px" lineHeight="28px" letterSpacing="-0.6px" color="black.900">
          <FormattedMessage
            id="paymentReceipts.section.title"
            defaultMessage="Monthly payment receipts per fiscal host"
          />
        </H2>
        <P fontSize="14px" lineHeight="21px" fontWeight="400" letterSpacing="-0.1px" color="black.700">
          <FormattedMessage
            id="paymentReceipts.section.description"
            defaultMessage="Check the consolidated invoices for your contributions here."
          />
        </P>
      </Box>
      <StyledHr mb="24px" borderStyle="dashed" borderColor="#4E5052" width={1} />
      <Box>
        <P
          fontSize="9px"
          lineHeight="12px"
          fontWeight="500"
          letterSpacing="0.06em"
          textTransform="uppercase"
          color="black.800"
        >
          <FormattedMessage id="paymentReceipts.selectDate.label" defaultMessage="Display receipts of" />
        </P>
        <StyledSelect
          options={[defaultFilter, ...yearsFilter]}
          value={activeFilter}
          width="184px"
          isLoading={loading}
          fontSize="12px"
          lineHeight="18px"
          fontWeight="400"
          color="black.800"
          mb="24px"
          onChange={setActiveFilter}
        />
        {content}
      </Box>
    </Flex>
  );
};

PaymentReceipts.propTypes = {
  collective: PropTypes.shape({
    slug: PropTypes.string,
    id: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
  }).isRequired,
};

export default PaymentReceipts;
