import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import I18nFormatters from '../../I18nFormatters';
import { H1, H3, P, Span } from '../../Text';
import BackButton from '../BackButton';
import PricingTable from '../PricingTable';

const headings = ['', 'starter', 'singleCollective'];

const rows = [
  [
    {
      type: 'component',
      render() {
        return <FormattedMessage id="pricingTable.row.price" defaultMessage="Price" />;
      },
    },
    {
      type: 'component',
      render() {
        return (
          <Span className="price">
            <FormattedMessage id="Amount.Free" defaultMessage="Free" />
          </Span>
        );
      },
    },
    {
      type: 'price',
      amount: 1000,
      frequency: 'month',
    },
  ],
  [
    {
      type: 'component',
      render() {
        return <FormattedMessage id="pricingTable.row.fundraise" defaultMessage="Fundraise via credit card payments" />;
      },
    },
    {
      type: 'html',
      html: '<strong>5%</strong> + Stripe Fees',
    },
    {
      type: 'html',
      html: '<strong>5%</strong> + Stripe Fees',
    },
  ],
  [
    {
      type: 'component',
      render() {
        return <FormattedMessage id="pricingTable.row.collectivePage" defaultMessage="All Collective page features" />;
      },
    },
    { type: 'check' },
    { type: 'check' },
  ],
  [
    {
      type: 'component',
      render() {
        return (
          <FormattedMessage id="pricingTable.row.addFunds" defaultMessage="Add funds received through other channels" />
        );
      },
    },
    { type: 'html', html: 'Up to <strong>$1,000</strong>' },
    {
      type: 'check',
    },
  ],
  [
    {
      type: 'component',
      render() {
        return <FormattedMessage id="pricingTable.row.bankTransfer" defaultMessage="Enable bank transfer payments" />;
      },
    },
    { type: 'html', html: 'Up to <strong>$1,000</strong>' },
    { type: 'check' },
  ],
  [
    {
      type: 'component',
      render() {
        return (
          <FormattedMessage
            id="pricingTable.row.transferwisePayouts"
            defaultMessage="Enable one-click payout with Wise"
          />
        );
      },
    },
    { type: 'html', html: 'Up to <strong>$1,000</strong>' },
    { type: 'check' },
  ],
].filter(row => !!row);

const footings = [
  '',
  '',
  {
    type: 'button',
    url: 'https://opencollective.com/opencollective/contribute/single-host-plan-13173',
  },
];

const SingleCollectiveWithBankAccount = ({ router }) => (
  <Container mx={3} my={4}>
    <Container>
      <Box display={['block', null, 'none']}>
        <BackButton onClick={() => router.push('/pricing')} />
      </Box>
    </Container>
    <Flex alignItems="center" justifyContent="center" flexDirection="column">
      <Box textAlign="center" my={3}>
        <H1
          color="black.900"
          fontSize={['32px', null, '24px']}
          lineHeight={['40px', null, '24px']}
          letterSpacing={['-0.4px', null, '-0.2px']}
          textAlign="center"
        >
          <FormattedMessage id="pricing.tab.welcome" defaultMessage="Welcome!" />
        </H1>
        <P color="black.700" fontSize="14px" lineHeight="24px" letterSpacing="-0.012em">
          <FormattedMessage
            id="pricing.tab.description"
            defaultMessage="You will begin with the <strong>STARTER PLAN</strong>. This plan is <strong>FREE</strong> to set up!"
            values={I18nFormatters}
          />
        </P>
      </Box>

      <Flex width={1} flexDirection={['column', null, 'row']} justifyContent={'center'} alignItems="center">
        <Container width={[1, null, '514px', null, '576px']} mr={[null, null, 3]}>
          <PricingTable headings={headings} rows={rows} footings={footings} />
        </Container>
        <Container
          width={[1, null, '368px']}
          minHeight="416px"
          p={3}
          backgroundColor="black.50"
          borderRadius="8px"
          ml={[null, null, 3]}
        >
          <H3 my={2} fontSize={['24px', null, '16px']} lineHeight={['26px', null, '26px']} letterSpacing="-0.008em">
            <FormattedMessage id="pricing.starterPlans" defaultMessage="The STARTER PLAN includes:" />
          </H3>
          <Box as="ul" color="black.800" mt={3} px={3} fontSize="13px" lineHeight="21px" letterSpacing="-0.012em">
            <Box as="li" my={2}>
              <FormattedMessage
                id="pricing.starterPlans.collective"
                defaultMessage="Collective - a page to <strong>coordinate your community and budget.</strong>"
                values={I18nFormatters}
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedMessage
                id="pricing.starterPlans.communication"
                defaultMessage="Communication tools: <strong>post updates, start conversations,</strong> and <strong>a contact form</strong> for your group."
                values={I18nFormatters}
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedMessage
                id="pricing.starterPlans.transparency"
                defaultMessage="Show your budget and expenses <strong>transparently.</strong> "
                values={I18nFormatters}
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedMessage
                id="pricing.starterPlans.fundraise"
                defaultMessage="<strong>Fundraise</strong> through credit card payments (cost: 5% plus Stripe payment processor fees)."
                values={I18nFormatters}
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedMessage
                id="pricing.starterPlans.addFunds"
                defaultMessage="Manually <strong>add funds raised</strong> through other channels (e.g. bank transfers) to your transparent budget (free up to $1,000, then you’ll need to upgrade to a paid plan)."
                values={I18nFormatters}
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedMessage
                id="pricing.starterPlans.transferwisePayouts"
                defaultMessage="Pay expenses in local currency with one-click using the <strong>Wise</strong> integration."
                values={I18nFormatters}
              />
            </Box>
          </Box>
        </Container>
      </Flex>
    </Flex>
  </Container>
);

SingleCollectiveWithBankAccount.propTypes = {
  onClickBackButton: PropTypes.func,
  router: PropTypes.object,
};

export default withRouter(SingleCollectiveWithBankAccount);
