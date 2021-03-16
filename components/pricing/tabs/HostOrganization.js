import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'next/router';
import { FormattedMessage } from 'react-intl';

import Container from '../../Container';
import { Box, Flex } from '../../Grid';
import I18nFormatters from '../../I18nFormatters';
import StyledLink from '../../StyledLink';
import { H1, H3, P } from '../../Text';
import BackButton from '../BackButton';
import PricingTable from '../PricingTable';

const headings = ['', 'start', 'grow', 'scale'];

const rows = [
  [
    {
      type: 'component',
      render() {
        return <FormattedMessage id="pricingTable.row.collectives" defaultMessage="Collectives" />;
      },
    },
    {
      type: 'component',
      render() {
        return <FormattedMessage id="collective.hostSettings.unlimited" defaultMessage="Unlimited" />;
      },
    },
    {
      type: 'component',
      render() {
        return <FormattedMessage id="collective.hostSettings.unlimited" defaultMessage="Unlimited" />;
      },
    },
    {
      type: 'component',
      render() {
        return <FormattedMessage id="collective.hostSettings.unlimited" defaultMessage="Unlimited" />;
      },
    },
  ],
  [
    {
      type: 'component',
      render() {
        return <FormattedMessage id="newPricingTable.row.revenues" defaultMessage="Managed Funds" />;
      },
    },
    {
      type: 'component',
      render() {
        return <FormattedMessage id="newPricingTable.row.noMinimum" defaultMessage="No minimum" />;
      },
    },
    {
      type: 'component',
      render() {
        return <FormattedMessage id="newPricingTable.row.noMinimum" defaultMessage="No minimum" />;
      },
    },
    {
      type: 'component',
      render() {
        return (
          <FormattedMessage
            id="newPricingTable.row.minimumRaised"
            defaultMessage="> {minimumRaised} total processed"
            values={{ minimumRaised: '$150,000' }}
          />
        );
      },
    },
  ],
  [
    {
      type: 'component',
      render() {
        return (
          <FormattedMessage
            id="newPricingTable.row.platformTips"
            defaultMessage="Platform Tips (voluntary contributions)"
          />
        );
      },
    },
    {
      type: 'html',
      html: 'Active',
    },
    {
      type: 'html',
      html: 'Active',
    },
    {
      type: 'html',
      html: 'Active',
    },
  ],
  [
    {
      type: 'component',
      render() {
        return (
          <FormattedMessage
            id="newPricingTable.row.platformFees"
            defaultMessage="Platform Fees (on incoming contributions)"
          />
        );
      },
    },
    {
      type: 'html',
      html: 'Free',
    },
    {
      type: 'html',
      html: 'Free',
    },
    {
      type: 'html',
      html: 'Free',
    },
  ],
  [
    {
      type: 'component',
      render() {
        return (
          <FormattedMessage id="newPricingTable.row.payoutFees" defaultMessage="Payout Fees (on outgoing payments)" />
        );
      },
    },
    {
      type: 'html',
      html: 'Free',
    },
    {
      type: 'html',
      html: 'Free',
    },
    {
      type: 'html',
      html: 'Free',
    },
  ],
  [
    {
      type: 'component',
      render() {
        return <FormattedMessage id="newPricingTable.row.creditCards" defaultMessage="Credit Card Payments" />;
      },
    },
    {
      type: 'html',
      html: 'Stripe Fees (2.9% + 30¢) <sup><small>(1)</small></sup>',
    },
    {
      type: 'html',
      html: 'Stripe Fees (2.9% + 30¢) <sup><small>(1)</small></sup>',
    },
    {
      type: 'html',
      html: 'Stripe Fees (2.9% + 30¢) <sup><small>(1)</small></sup>',
    },
  ],
  [
    {
      type: 'component',
      render() {
        return (
          <FormattedMessage
            id="newPricingTable.row.addFunds"
            defaultMessage="Manually add funds received through other channels"
          />
        );
      },
    },
    { type: 'check' },
    { type: 'check' },
    { type: 'check' },
  ],

  [
    {
      type: 'component',
      render() {
        return <FormattedMessage id="newPricingTable.row.hostFee" defaultMessage="Ability to configure Host Fee" />;
      },
    },
    {
      type: 'html',
      html: 'No',
    },
    { type: 'check' },
    { type: 'check' },
  ],
  [
    {
      type: 'component',
      render() {
        return (
          <FormattedMessage
            id="newPricingTable.row.hostFeeCharge"
            defaultMessage="Charge on revenue made through Host Fees"
          />
        );
      },
    },
    {
      type: 'html',
      html: 'n/a',
    },
    {
      type: 'html',
      html: '15%<sup><small>(2)</small></sup>',
    },
    {
      type: 'html',
      html: '15%<sup><small>(2)</small></sup> (negotiable)',
    },
  ],
].filter(row => !!row);

const footings = [
  '',
  '',
  '',
  {
    type: 'button',
    cta: 'Contact Us',
    url: '/support',
  },
];

const HostOrganization = ({ router }) => (
  <Container mx={3} my={4}>
    <Box display={['block', null, 'none']}>
      <BackButton onClick={() => router.push('/pricing')} />
    </Box>

    <Container display="flex" flexDirection="column" alignItems="center">
      <Box textAlign="center" my={3}>
        <H1
          fontSize={['32px', null, '24px']}
          lineHeight={['40px', null, '24px']}
          letterSpacing={['-0.4px', null, '-0.2px']}
          textAlign="center"
        >
          <FormattedMessage id="pricing.tab.welcome" defaultMessage="Welcome!" />
        </H1>
        <P my={3} fontSize="14px" lineHeight="24px" letterSpacing="-0.012em">
          <FormattedMessage
            id="pricing.tab.hostOrganization.description"
            defaultMessage="You will be a <strong>Fiscal Host</strong> on our platform. That means you hold funds on behalf of Collectives. You decide which Collectives to accept and what if any fees to charge them."
            values={I18nFormatters}
          />
        </P>
      </Box>

      <Container width={[1, null, 1, null, '992px']} display="flex" justifyContent="center" alignItems="center">
        <PricingTable width={1} headings={headings} rows={rows} footings={footings} />
      </Container>

      <Box textAlign="left">
        <P my={1} fontSize="12px" lineHeight="16px" letterSpacing="-0.012em">
          (1){' '}
          <FormattedMessage
            id="newPricing.tab.stripePricing"
            defaultMessage="Pricing for US based organizations - For details see <a>stripe.com/pricing</a>"
            values={{
              // eslint-disable-next-line react/display-name
              a: chunks => <StyledLink href={`https://stripe.com/pricing`}>{chunks}</StyledLink>,
            }}
          />
        </P>
        <P my={1} fontSize="12px" lineHeight="16px" letterSpacing="-0.012em">
          (2){' '}
          <FormattedMessage
            id="newPricing.tab.hostFeeChargeExample"
            defaultMessage="If your Host fee is 10% and your Collectives bring in $1,000, your Platform fee will be $15. If you host fee is 0%, your Platform fee will be 0."
          />
        </P>
      </Box>

      <Box textAlign="center" my={3}>
        <P my={3} fontSize="14px" lineHeight="24px" letterSpacing="-0.012em">
          <StyledLink href={'/become-a-fiscal-host'}>
            <FormattedMessage
              id="pricing.fiscalHost.learnMore"
              defaultMessage="Learn more about becoming a Fiscal Host."
            />
          </StyledLink>
        </P>
      </Box>

      <Flex justifyContent="center" flexDirection={['column', null, 'row']} alignItems={['center', null, 'flex-start']}>
        <Container my={4} p={3} backgroundColor="black.50" borderRadius="8px" width={[1, null, '681px']}>
          <H3
            my={2}
            fontSize={['16px', null, '32px']}
            lineHeight={['26px', null, '24px']}
            letterSpacing={['-0.008em', null, '-0.2px']}
          >
            <FormattedMessage id="newPricing.includes" defaultMessage="Includes:" />
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
                id="newpricing.starterPlans.communication"
                defaultMessage="Communication tools: <strong>updates, conversations,</strong> and <strong>a contact form</strong> for your group."
                values={I18nFormatters}
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedMessage
                id="newPricing.starterPlans.openFinanceTools"
                defaultMessage="Open finances tools"
                values={I18nFormatters}
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedMessage
                id="newPricing.selfHosted.fundraising"
                defaultMessage="<strong>Fundraising capabilities</strong>"
                values={I18nFormatters}
              />
            </Box>
            <Box as="li" my={3}>
              <FormattedMessage
                id="newPricing.starterPlans.addFunds"
                defaultMessage="Manually <strong>add funds raised</strong> through other channels."
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
          <H3
            my={2}
            fontSize={['16px', null, '24px']}
            lineHeight={['26px', null, '32px']}
            letterSpacing={['-0.008em', null, '-0.2px']}
          >
            <FormattedMessage id="pricing.accessTo" defaultMessage="You will have access to:" />
          </H3>
          <Box as="ul" color="black.800" mt={3} px={3} fontSize="13px" lineHeight="21px" letterSpacing="-0.012em">
            <Box as="li" my={2}>
              <FormattedMessage
                id="newPricing.accessTo.financialContributions"
                defaultMessage="Receive financial contributions to Collectives via credit card, automatically updating their budgets for easy tracking (cost: Stripe fees)."
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
      </Flex>
    </Container>
  </Container>
);

HostOrganization.propTypes = {
  router: PropTypes.object,
};

export default withRouter(HostOrganization);
