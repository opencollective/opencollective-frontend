import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import utc from 'dayjs/plugin/utc';
import { groupBy, uniq } from 'lodash';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { invoicesQuery } from '../../../lib/graphql/queries';
import { useAsyncCall } from '../../../lib/hooks/useAsyncCall';
import { saveInvoice } from '../../../lib/transactions';

import Avatar from '../../Avatar';
import { Box, Flex } from '../../Grid';
import LoadingPlaceholder from '../../LoadingPlaceholder';
import StyledButton from '../../StyledButton';
import StyledCard from '../../StyledCard';
import StyledSelect from '../../StyledSelect';
import { H2, H3, P, Span } from '../../Text';

const Divider = styled(Box)`
  border-bottom-width: 1px;
  border-bottom-style: ${props => props.borderStyle || 'solid'};
  border-bottom-color: ${props => props.borderColor || '#C4C7CC'};
`;

const HostName = styled(P)`
  margin: 0 !important;
`;

dayjs.extend(utc);
dayjs.extend(isSameOrAfter);

const filterInvoices = (allInvoices, filterBy) => {
  if (filterBy === 'past_12_months') {
    const twelveMonthsAgo = dayjs().subtract(11, 'month');
    return allInvoices.filter(i => {
      const dateMonth = dayjs.utc(`${i.year}-${i.month}`, 'YYYY-M');
      return dateMonth.isSameOrAfter(twelveMonthsAgo);
    });
  }

  return allInvoices.filter(i => i.year === filterBy);
};

const ReceiptsLoadingPlaceholder = () => (
  <Flex flexDirection="column">
    <Flex alignItems="center" justifyContent="space-between">
      <LoadingPlaceholder mr={3} width="104px" height="24px" />
      <Divider width="80%" borderBottom="1px solid #C4C7CC" />
    </Flex>
    {Array.from({ length: 3 }, (_, index) => (
      <StyledCard my={3} key={index} display="flex" alignItems="center" py={3} px="24px">
        <LoadingPlaceholder borderRadius="16px" width="48px" height="48px" mr={3} />
        <Box>
          <LoadingPlaceholder mb={2} width={['164px', '361px']} height={['40px', '24px']} />
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

const renderReceiptCard = (invoice, index) => (
  <StyledCard
    my={3}
    key={index.toString()}
    alignItems="center"
    display="flex"
    flexDirection={['column', 'row']}
    justifyContent="space-between"
    py={3}
    px="24px"
  >
    <Flex alignItems="center">
      <Avatar collective={invoice.host} borderRadius="16px" mr={3} size="48px" />
      <Box>
        <HostName
          fontSize={['13px', '17px']}
          lineHeight={['20px', '24px']}
          letterSpacing={[null, '-0.16px']}
          color="black.900"
          fontWeight="500"
          my={0}
        >
          <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" />:{invoice.host.name}
        </HostName>
        <Span
          fontSize={['10px', '15px']}
          lineHeight={['14px', '21px']}
          letterSpacing={[null, '-0.1px']}
          color="black.600"
          fontWeight="400"
          mt={0}
        >
          {`${invoice.month}/${invoice.year}`} - {invoice.totalTransactions}{' '}
          <FormattedMessage
            id="paymentReceipt.transaction"
            values={{
              n: invoice.totalTransactions,
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
      disabled={invoice.loadingInvoice}
      mt={3}
      borderColor="#C4C7CC"
      onClick={() => {
        invoice.downloadInvoice({
          fromCollectiveSlug: invoice.fromCollective.slug,
          toCollectiveSlug: invoice.host.slug,
          dateFrom: invoice.dateFrom,
          dateTo: invoice.dateTo,
        });
      }}
    >
      <FormattedMessage id="downloadReceipt" defaultMessage="Download receipt" />
    </StyledButton>
  </StyledCard>
);

const Receipts = ({ invoices }) => {
  const { loading: loadingInvoice, call: downloadInvoice } = useAsyncCall(saveInvoice);
  const byMonth = groupBy(invoices, 'month');

  return Object.keys(byMonth)
    .map(month => {
      const dateMonth = dayjs.utc(`${byMonth[month][0].year}-${month}`, 'YYYY-M');
      const dateFrom = dateMonth.toISOString();
      const dateTo = dateMonth.endOf('month').toISOString();

      return (
        <Flex key={month} flexDirection="column">
          <Flex alignItems="center" justifyContent="space-between">
            <H3 fontSize="16px" lineHeight="24px" color="black.900">{`${dateMonth.format('MMMM')} ${dateMonth.format(
              'YYYY',
            )}`}</H3>
            <Divider width={['60%', '80%']} borderBottom="1px solid #C4C7CC" />
          </Flex>
          {byMonth[month]
            .map(invoice => ({
              ...invoice,
              totalTransactions: byMonth[month].length,
              loadingInvoice,
              downloadInvoice,
              dateFrom,
              dateTo,
            }))
            .map(renderReceiptCard)}
        </Flex>
      );
    })
    .reverse();
};

const renderContent = (invoices, loading) => {
  if (loading) {
    return <ReceiptsLoadingPlaceholder />;
  } else if (invoices.length === 0) {
    return <NoReceipts />;
  }

  return <Receipts invoices={invoices} />;
};

const PaymentReceipts = ({ collective }) => {
  const defaultFilter = {
    label: 'Past 12 months',
    value: 'past_12_months',
  };
  const [activeFilter, setActiveFilter] = React.useState(defaultFilter);
  const { data, loading } = useQuery(invoicesQuery, {
    variables: {
      fromCollectiveSlug: collective.slug,
    },
  });

  const yearsFilter = uniq(data?.allInvoices.map(i => i.year)).map(year => ({ value: year, label: year }));
  const invoices = data ? filterInvoices(data.allInvoices, activeFilter.value) : [];

  return (
    <Flex flexDirection="column">
      <Box mb={4}>
        <H2 fontSize="20px" lineHeight="28px" letterSpacing="-0.6px" color="black.900">
          <FormattedMessage
            id="paymentReceipts.section.title"
            defaultMessage="Monthly payment receipts per fiscal host"
          />
        </H2>
        <P fontSize={['14px']} lineHeight={['21px']} fontWeight="400" letterSpacing="-0.1px" color="black.700">
          <FormattedMessage
            id="paymentReceipts.section.description"
            defaultMessage="Check the consolidated invoices for your contributions here."
          />
        </P>
      </Box>
      <Divider mb="24px" borderColor="#4E5052" borderStyle="dashed" width={1} />
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
        {renderContent(invoices, loading)}
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
