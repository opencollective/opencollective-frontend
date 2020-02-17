import React from 'react';
import { Box, Flex } from '@rebass/grid';
import { FormattedMessage, FormattedHTMLMessage } from 'react-intl';

import Container from '../../Container';
import BackButton from '../BackButton';
import PricingTable from '../PricingTable';
import { H1, P, H3 } from '../../Text';
import { Router } from '../../../server/pages';

const headings = ['', 'starter', 'small', 'medium', 'large', 'network'];

const rows = [
  [
    {
      type: 'component',
      render() {
        return <FormattedHTMLMessage id="pricingTable.row.price" defaultMessage="Price" />;
      },
    },
    {
      type: 'price',
      amount: 'Free',
      frequency: null,
    },
    {
      type: 'price',
      amount: '$25',
      frequency: 'month',
    },
    {
      type: 'price',
      amount: '$50',
      frequency: 'month',
    },
    {
      type: 'price',
      amount: '$100',
      frequency: 'month',
    },
    {
      type: 'price',
      amount: 'Talk to us',
      frequency: null,
    },
  ],
  [
    {
      type: 'component',
      render() {
        return <FormattedHTMLMessage id="pricingTable.row.collectives" defaultMessage="Collectives" />;
      },
    },
    {
      type: 'component',
      render() {
        return <FormattedHTMLMessage id="pricingTable.cell.unlimited" defaultMessage="Unlimited" />;
      },
    },
    {
      type: 'html',
      html: '<strong>2</strong> to <strong>5</strong>',
    },
    {
      type: 'html',
      html: 'Up to <strong>10</strong>',
    },
    {
      type: 'html',
      html: 'Up to <strong>25</strong>',
    },
    {
      type: 'html',
      html: '+ <strong>25</strong>',
    },
  ],
  [
    {
      type: 'component',
      render() {
        return (
          <FormattedHTMLMessage
            id="pricingTable.row.directPayment"
            defaultMessage="Credit card payments direct to Collectives"
          />
        );
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
    {
      type: 'html',
      html: '<strong>5%</strong> + Stripe Fees',
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
        return (
          <FormattedHTMLMessage id="pricingTable.row.collectivePage" defaultMessage="All Collective page features" />
        );
      },
    },
    { type: 'check' },
    { type: 'check' },
    { type: 'check' },
    { type: 'check' },
    { type: 'check' },
  ],
  [
    {
      type: 'component',
      render() {
        return (
          <FormattedHTMLMessage
            id="pricingTable.row.addFunds"
            defaultMessage="Add funds received through other channels"
          />
        );
      },
    },
    { type: 'html', html: 'Up to <strong>$1,000</strong>' },
    { type: 'check' },
    { type: 'check' },
    { type: 'check' },
    { type: 'check' },
  ],
  [
    {
      type: 'component',
      render() {
        return (
          <FormattedHTMLMessage id="pricingTable.row.bankTransfer" defaultMessage="Enable bank transfer payments" />
        );
      },
    },
    { type: 'html', html: 'Up to <strong>$1,000</strong>' },
    { type: 'check' },
    { type: 'check' },
    { type: 'check' },
    { type: 'check' },
  ],
  [
    {
      type: 'component',
      render() {
        return (
          <FormattedHTMLMessage
            id="pricingTable.row.hostFeature"
            defaultMessage="Link for Collectives to discover and apply to your host"
          />
        );
      },
    },
    { type: 'check' },
    { type: 'check' },
    { type: 'check' },
    { type: 'check' },
    { type: 'check' },
  ],
];

const footings = [
  '',
  {
    type: 'button',
    url: 'https://',
  },
  {
    type: 'button',
    url: 'https://',
  },
  {
    type: 'button',
    url: 'https://',
  },
  {
    type: 'button',
    url: 'https://',
  },
  {
    type: 'button',
    url: 'https://',
  },
];

const HostOrganization = () => (
  <Container mx={3} my={4}>
    <Box display={['block', null, 'none']}>
      <BackButton onClick={() => Router.pushRoute('pricing')} />
    </Box>

    <Container display="flex" flexDirection="column" alignItems="center">
      <Box textAlign="center" my={3}>
        <H1 fontSize={['H3', null, 'H4']} lineHeight={['40px', null, 'H4']} letterSpacing={['-0.4px', null, '-0.2px']}>
          <FormattedMessage id="pricing.tab.welcome" defaultMessage="Welcome!" />
        </H1>
        <P my={3} fontSize={['Paragraph']} lineHeight={['H5']} letterSpacing={['-0.012em']}>
          <FormattedHTMLMessage
            id="pricing.tab.hostOrganization.description"
            defaultMessage="You will be a <strong>Fiscal Host</strong> on our platform. That means you hold funds on behalf of Collectives. You decide which Collectives to accept and what if any fees to charge them."
          />
        </P>
      </Box>

      <Container width={[1, null, 1, null, '992px']} display="flex" justifyContent="center" alignItems="center">
        <PricingTable width={1} headings={headings} rows={rows} footings={footings} />
      </Container>

      <Flex justifyContent="center" flexDirection={['column', null, 'row']} alignItems={['center', null, 'flex-start']}>
        <Container my={4} p={3} backgroundColor="black.50" borderRadius="8px" width={[1, null, '681px']}>
          <H3
            my={2}
            fontSize={['LeadParagraph', null, 'H4']}
            lineHeight={['26px', null, 'H4']}
            letterSpacing={['-0.008em', null, '-0.2px']}
          >
            <FormattedMessage id="pricing.starterPlans" defaultMessage="The STARTER PLAN includes:" />
          </H3>
          <Box as="ul" color="black.800" mt={3} px={3} fontSize="13px" lineHeight="21px" letterSpacing="-0.012em">
            <Box as="li" my={2}>
              <FormattedHTMLMessage
                id="pricing.starterPlans.collective"
                defaultMessage="Collective - a page to <strong>coordinate your community and budget.</strong>"
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedHTMLMessage
                id="pricing.starterPlans.communication"
                defaultMessage="Communication tools: <strong>post updates, start conversations,</strong> and <strong>a contact form</strong> for your group."
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedHTMLMessage
                id="pricing.starterPlans.transparency"
                defaultMessage="Show your budget and expenses <strong>transparently.</strong> "
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedHTMLMessage
                id="pricing.starterPlans.fundraise"
                defaultMessage="<strong>Fundraise</strong> through credit card payments (cost: 5% plus Stripe payment processor fees)."
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedHTMLMessage
                id="pricing.starterPlans.addFunds"
                defaultMessage="Manually <strong>add funds raised</strong> through other channels (e.g. bank transfers) to your transparent budget (free up to $1,000, then you’ll need to upgrade to a paid plan)."
              />
            </Box>
          </Box>
          <H3
            my={2}
            fontSize={['LeadParagraph', null, 'H4']}
            lineHeight={['26px', null, 'H4']}
            letterSpacing={['-0.008em', null, '-0.2px']}
          >
            <FormattedMessage id="pricing.accessTo" defaultMessage="You will have access to:" />
          </H3>
          <Box as="ul" color="black.800" mt={3} px={3} fontSize="13px" lineHeight="21px" letterSpacing="-0.012em">
            <Box as="li" my={2}>
              <FormattedMessage
                id="pricing.accessTo.financialContributions"
                defaultMessage="Receive financial contributions to Collectives via credit card, automatically updating their budgets for easy tracking (cost: 5% plus Stripe fees)."
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedMessage
                id="pricing.accessTo.manuallyCredit"
                defaultMessage="Manually credit Collective budgets with funds received outside the platform (e.g. payments you've invoiced, cash, or third party channels like a shop)."
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedMessage
                id="pricing.accessTo.bankTransfer"
                defaultMessage="Enable bank transfer payments to automatically provide financial contributors with wire instructions and a reference number for tracking."
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedMessage
                id="pricing.accessTo.hostDashboard"
                defaultMessage="A host dashboard to easily manage budgets and expenses across all your Collectives, including one-click payouts via Paypal."
              />
            </Box>
          </Box>
        </Container>

        <Container my={3} p={3} ml={[null, null, 2]} width={[1, null, '262px']}>
          <Box mb={3}>
            <P fontSize={['Caption']} lineHeight={['19px']} letterSpacing="-0.016em;">
              <FormattedMessage
                id="pricing.hostOrganization.note1"
                defaultMessage="Your choice of plan will depend on the number of Collectives you host."
              />
            </P>
          </Box>

          <Box my={3}>
            <P fontSize={['Caption']} lineHeight={['19px']} letterSpacing="-0.016em">
              <FormattedMessage
                id="pricing.hostOrganization.note2"
                defaultMessage="You pay Open Collective for use of our platform on behalf of your Collectives, and can charge them a fee if you wish."
              />
            </P>
          </Box>
        </Container>
      </Flex>
    </Container>
  </Container>
);

export default HostOrganization;
