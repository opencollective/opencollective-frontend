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

const headings = ['', ''];

const rows = [
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
  ],
].filter(row => !!row);

const footings = ['', ''];

const SingleCollectiveWithBankAccount = () => (
  <Container mx={3} my={4}>
    <Container>
      <Box display={['block', null, 'none']}>
        <BackButton onClick={() => this.props.router.push('/pricing')} />
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
            id="newPricing.tab.description"
            defaultMessage="The Open Collective platform is <strong>FREE</strong> for you!"
            values={I18nFormatters}
          />
        </P>
      </Box>

      <Flex width={1} flexDirection={['column', null, 'row']} justifyContent={'center'} alignItems="center">
        <Container width={[1, null, '514px', null, '576px']} mr={[null, null, 3]}>
          <PricingTable headings={headings} rows={rows} footings={footings} />
          <P>
            <small>
              (1){' '}
              <FormattedMessage
                id="newPricing.tab.stripePricing"
                defaultMessage="Pricing for US based organizations - For details see <a>stripe.com/pricing</a>"
                values={{
                  // eslint-disable-next-line react/display-name
                  a: chunks => <StyledLink href={`https://stripe.com/pricing`}>{chunks}</StyledLink>,
                }}
              />
            </small>
          </P>
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
                id="newPricing.starterPlans.transferwisePayouts"
                defaultMessage="Expense payouts in local currency with one-click using the <strong>TransferWise</strong> integration."
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
