import React from 'react';
import { themeGet } from '@styled-system/theme-get';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import NextIllustration from '../collectives/HomeNextIllustration';
import Container from '../Container';
import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledHR from '../StyledHr';
import { H3, H4, H5, P, Span } from '../Text';

import { FISCAL_HOST_ACCESS } from './constants';

const ListWrapper = styled(Box)`
  list-style: none;
  padding-left: 0;
`;

const ListItem = styled.li`
  font-size: 13px;
  line-height: 16px;
  color: ${props => (props.uncheck ? themeGet('colors.black.500') : themeGet('colors.black.900'))};
  margin-top: 19px;
  margin-bottom: 19px;
  background: ${props =>
    props.uncheck
      ? "url('/static/images/pricing/minusIcon.svg') no-repeat left center"
      : "url('/static/images/pricing/checkMark.svg') no-repeat left center"};
  padding-left: 26px;

  :first-of-type,
  :last-of-type {
    margin-top: 0;
    margin-bottom: 0;
  }
`;

const FeeData = styled(Span)`
  font-weight: 500;
  font-size: 15px;
  line-height: 22px;
  color: ${themeGet('colors.blue.700')};
  margin-right: 8px;
`;

const FeeDescription = styled(P)`
  font-weight: 500;
  font-size: 15px;
  line-height: 22px;
  color: ${themeGet('colors.black.900')};
`;

const AccessToWrapper = styled(Container)`
  :nth-child(1),
  :nth-child(2) {
    margin-bottom: 46px;
  }
`;

const Card = styled(Container)`
  @media screen and (min-width: 52em) {
    width: 700px;
  }

  @media screen and (min-width: 64em) {
    width: 832px;
  }

  @media screen and (min-width: 88em) {
    width: 862px;
  }
`;

const messages = defineMessages({
  'pricing.dashboard': {
    defaultMessage: 'Host Admin Dashboard',
  },
  'pricing.dashboard.description': {
    id: 'HostDashboard.description',
    defaultMessage:
      'Easily manage budgets and expenses across all your Collectives, including automated credit card payments through Stripe and one-click payouts via Paypal and Wise.',
  },
  'pricing.outsideFunds': {
    id: 'pricing.outsideFunds',
    defaultMessage: 'Outside funds',
  },
  'pricing.outsideFunds.description': {
    defaultMessage:
      'Manually credit Collective budgets with funds received outside the platform, such as other e-commerce or fundraising tools.',
  },
  'pricing.bankTransfer': {
    id: 'pricing.bankTransfer',
    defaultMessage: 'Bank transfer payments',
  },
  'pricing.bankTransfer.description': {
    defaultMessage:
      'Automatically provide wire instructions and a reference number for tracking. Confirm receipt of funds with one click.',
  },
  'pricing.creditCard': {
    id: 'pricing.creditCard',
    defaultMessage: 'Credit card processing',
  },
  'pricing.creditCard.description': {
    defaultMessage:
      'Receive financial contributions via credit card, automatically updating each Collective budget. *Stripe fees apply',
  },
  'pricing.plan.start': {
    id: 'table.head.start',
    defaultMessage: 'Start',
  },
  'pricing.plan.grow': {
    id: 'table.head.grow',
    defaultMessage: 'Grow',
  },
  'pricing.plan.scale': {
    id: 'table.head.scale',
    defaultMessage: 'Scale',
  },
  'pricing.start.fee': {
    id: 'pricing.start.fee',
    defaultMessage: 'No host fees. No charge',
  },
  'pricing.start.feeNote': {
    id: 'pricing.start.feeNote',
    defaultMessage: 'You wont be able to charge Collectives or set any Host Fee.',
  },
  'pricing.grow.fee': {
    id: 'pricing.grow.fee',
    defaultMessage: 'Of the revenue your organization makes through Host Fees ¹',
  },
  'pricing.grow.feeNote': {
    id: 'pricing.grow.feeNote',
    defaultMessage: 'Only if you charge for your services',
  },
  'pricing.scale.fee': {
    id: 'pricing.scale.fee',
    defaultMessage: 'Shared revenue with Doohi Collective',
  },
  'pricing.scale.feeNote': {
    id: 'pricing.scale.feeNote',
    defaultMessage: 'Depends on volume and amount of transactions',
  },
  'pricing.unlimitedCollectives': {
    id: 'pricing.unlimitedCollectives',
    defaultMessage: 'Unlimited Collectives',
  },
  'pricing.addFunds': {
    id: 'pricing.addFunds',
    defaultMessage: 'Manually add funds from other channels',
  },
  'pricing.configureHost': {
    id: 'pricing.configureHost',
    defaultMessage: 'Ability to configure Host Fees',
  },
});

const ForFiscalHosts = () => {
  const intl = useIntl();

  return (
    <Card padding={['24px', null, '32px']} width={['288px', '636px']} borderRadius="8px" border="1px solid #DCDEE0">
      <Flex justifyContent="center" alignItems="center" mb="32px">
        <Box width="72px" height="72px" mr="16px">
          <NextIllustration
            src="/static/images/pricing/for-fiscalHost-illustration.png"
            alt="FiscalHost Illustration"
            width={72}
            height={72}
          />
        </Box>
        <Box width={[null, '500px', '672px', null, '702px']}>
          <H3
            fontSize={['18px', '20px']}
            lineHeight={['26px', '28px']}
            fontWeight="500"
            letterSpacing={[null, '-0.00em']}
            color="primary.900"
          >
            <FormattedMessage id="pricing.fiscalHost" defaultMessage="For Fiscal Hosts" />
          </H3>
          <StyledHR my="8px" />
          <P fontSize="14px" lineHeight="20px" color="black.800">
            <FormattedMessage id="pricing.forFiscalHost.description" defaultMessage="We succeed when you succeed" />
          </P>
        </Box>
      </Flex>
      <H5
        fontSize={['18px', '20px']}
        lineHeight={['26px', '28px']}
        fontWeight="500"
        letterSpacing="-0.008emd"
        color="primary.900"
        mb="16px"
      >
        <FormattedMessage
          id="pricing.forFiscalHost.fees.header"
          defaultMessage="Free if you don't have revenue, sharing if you do"
        />
      </H5>
      <Flex flexDirection={['column', 'row']} alignItems={['flex-start', 'center']}>
        <Box mr={[null, '33px', '72px']}>
          <Box mb="16px">
            <Flex mb={3}>
              <FeeDescription>
                <FormattedMessage
                  id="pricing.noHostFees"
                  defaultMessage="{fee} if you don't charge Host Fees to your Collectives"
                  values={{
                    fee: <FeeData>$0</FeeData>,
                  }}
                />{' '}
                ¹
              </FeeDescription>
            </Flex>
            <Flex my={3}>
              <FeeDescription>
                <FormattedMessage
                  id="pricing.hostFees"
                  defaultMessage="{revshare} Platform Share of your Host Fee revenue"
                  values={{
                    revshare: <FeeData>15%</FeeData>,
                  }}
                />{' '}
                ²
              </FeeDescription>
            </Flex>
          </Box>
          <P fontSize="12px" lineHeight="18px" color="black.700">
            (1){' '}
            <FormattedMessage
              id="pricing.notes.paymentProcessor"
              defaultMessage="Payment processor fees apply when using <stripeLink></stripeLink>, <paypalLink></paypalLink>, or <transferwiseLink></transferwiseLink>."
              values={{
                stripeLink: getI18nLink({
                  href: 'https://stripe.com/pricing',
                  openInNewTab: true,
                  children: 'Stripe',
                }),
                paypalLink: getI18nLink({
                  href: 'https://paypal.com/pricing',
                  openInNewTab: true,
                  children: 'PayPal',
                }),
                transferwiseLink: getI18nLink({
                  href: 'https://wise.com/pricing',
                  openInNewTab: true,
                  children: 'Wise',
                }),
              }}
            />
          </P>
          <P fontSize="12px" lineHeight="18px" color="black.700">
            <FormattedMessage
              id="pricing.platformShareBreakdown"
              defaultMessage="(2) If your Host Fee is 10% and your Collectives bring in $1,000, the Host gets $100 and $15 (15%) is the Platform Share."
            />
          </P>
        </Box>
        <ListWrapper as="ul" mt={['16px', 0]}>
          <ListItem>
            <FormattedMessage defaultMessage="Each Collective gets its own fundraising page" />
          </ListItem>
          <ListItem>
            <FormattedMessage
              id="pricing.accounting"
              defaultMessage="No more messy spreadsheets! It's all automated, and your accountant will thank you"
            />
          </ListItem>
          <ListItem>
            <FormattedMessage defaultMessage="Manually add funds from other channels, accurately tracking all budgets" />
          </ListItem>
          <ListItem>
            <FormattedMessage defaultMessage="Community engagement features" />
          </ListItem>
          <ListItem>
            <FormattedMessage defaultMessage="Financial tracking and transparency means reporting writes itself" />
          </ListItem>
          <ListItem>
            <FormattedMessage defaultMessage="Expense management and one-click payouts via Paypal and Wise" />
          </ListItem>
        </ListWrapper>
      </Flex>

      <Flex justifyContent={['center', 'left']} alignItems={['flex-start', 'center']} mt={10}>
        <Link href="/organizations/new">
          <StyledButton px={3} py={2} buttonStyle="primary" width="160px" whiteSpace="nowrap" mb={4}>
            <FormattedMessage id="home.createHost" defaultMessage="Create a Fiscal Host" />
          </StyledButton>
        </Link>
      </Flex>

      <H4
        mt="40px"
        fontSize="12px"
        lineHeight="16px"
        letterSpacing="0.06em"
        color="black.900"
        textTransform="uppercase"
      >
        <FormattedMessage id="pricing.forCollective.accessTo" defaultMessage="You will also have access to" />
      </H4>
      <StyledHR mt="8px" />
      <Flex flexWrap="wrap" mt="32px" justifyContent="space-between">
        {FISCAL_HOST_ACCESS.map(access => (
          <React.Fragment key={access}>
            <AccessToWrapper display="flex" flexDirection={['column', 'row', 'column']}>
              <Box mb="12px" mr={[null, '13px']} size={['32px', null, '40px']}>
                <NextIllustration src={`/static/images/pricing/${access}-icon.svg`} alt="Icon" width={40} height={40} />
              </Box>
              <Box width={['112px', '230px', '176px']}>
                <H4 fontSize="15px" lineHeight="22px" color="black.900" fontWeight="500" mb="8px">
                  {intl.formatMessage(messages[`pricing.${access}`])}
                </H4>
                <P fontSize="13px" lineHeight="16px" color="black.900">
                  {intl.formatMessage(messages[`pricing.${access}.description`])}
                </P>
              </Box>
            </AccessToWrapper>
          </React.Fragment>
        ))}
      </Flex>
    </Card>
  );
};

export default ForFiscalHosts;
