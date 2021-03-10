import React from 'react';
import themeGet from '@styled-system/theme-get';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import Container from '../Container';
import { Box, Flex } from '../Grid';
import Illustration from '../home/HomeIllustration';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import StyledButton from '../StyledButton';
import StyledHR from '../StyledHr';
import { H3, H4, H5, P } from '../Text';

import { FEATURES, FISCAL_HOST_ACCESS, PLANS } from './constants';
import PlatformTip from './PlatformTip';

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

const FeeData = styled(P)`
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

const PlansWrapper = styled(Container)`
  ${Flex}:not(:first-of-type, :last-of-type) {
    margin-left: 32px;
    margin-right: 32px;

    @media screen and (min-width: 40em) {
      margin-left: 0;
      margin-right: 0;
    }
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
    id: 'pricing.dashboard',
    defaultMessage: 'Host Dashboard',
  },
  'pricing.dashboard.description': {
    id: 'pricing.dashboard.description',
    defaultMessage:
      'A host dashboard to easily manage budgets and expenses across all your Collectives, including one-click payouts via Paypal and TransferWise.',
  },
  'pricing.outsideFunds': {
    id: 'pricing.outsideFunds',
    defaultMessage: 'Outside funds',
  },
  'pricing.outsideFunds.description': {
    id: 'pricing.outsideFunds.description',
    defaultMessage:
      "Manually credit Collective budgets with funds received outside the platform (e.g. payments you've invoiced, cash, or third party channels like a shop).",
  },
  'pricing.bankTransfer': {
    id: 'pricing.bankTransfer',
    defaultMessage: 'Bank transfer payments',
  },
  'pricing.bankTransfer.description': {
    id: 'pricing.bankTransfer.description',
    defaultMessage:
      'Enable bank transfer payments to automatically provide financial contributors with wire instructions and a reference number for tracking.',
  },
  'pricing.creditCard': {
    id: 'pricing.creditCard',
    defaultMessage: 'Credit card processing',
  },
  'pricing.creditCard.description': {
    id: 'pricing.creditCard.description',
    defaultMessage:
      'Receive financial contributions to you via credit card, automatically updating your budget for transparent tracking. *Stripe fees apply',
  },
  'pricing.plan.start': {
    id: 'pricing.plan.start',
    defaultMessage: 'Start',
  },
  'pricing.plan.grow': {
    id: 'pricing.plan.grow',
    defaultMessage: 'Grow',
  },
  'pricing.plan.scale': {
    id: 'pricing.plan.scale',
    defaultMessage: 'Scale',
  },
  'pricing.start.fee': {
    id: 'pricing.start.fee',
    defaultMessage: 'No host fees. No charge',
  },
  'pricing.start.feeNote': {
    id: 'pricing.start.feeNote',
    defaultMessage: '*You wont be able to charge Collectives or set any Host Fee.',
  },
  'pricing.grow.fee': {
    id: 'pricing.grow.fee',
    defaultMessage: 'Of the revenue your organization make through Host Fees',
  },
  'pricing.grow.feeNote': {
    id: 'pricing.grow.feeNote',
    defaultMessage: '*Only if you charge for your services (1)',
  },
  'pricing.scale.fee': {
    id: 'pricing.scale.fee',
    defaultMessage: 'Shared revenue with Open Collective',
  },
  'pricing.scale.feeNote': {
    id: 'pricing.scale.feeNote',
    defaultMessage: '*Depends on volume and amount of transactions',
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
          <Illustration src="/static/images/pricing/for-fiscalHost-illustration.png" alt="FiscalHost Illustration" />
        </Box>
        <Box width={[null, '500px', '672px', null, '702px']}>
          <H3
            fontSize={['18px', '20px']}
            lineHeight={['26px', '28px']}
            fontWeight="500"
            letterSpacing={[null, '-0.00em']}
            color="black.900"
          >
            <FormattedMessage id="pricing.fiscalHostCard" defaultMessage="For Fiscal Hosts" />
          </H3>
          <StyledHR my="8px" />
          <P fontSize="14px" lineHeight="20px" color="black.800">
            <FormattedMessage id="pricing.forFiscalHost.description" defaultMessage="Choose the right plan for you" />
          </P>
        </Box>
      </Flex>
      <H5
        fontSize={['18px', '20px']}
        lineHeight={['26px', '28px']}
        fontWeight="500"
        letterSpacing="-0.008emd"
        color="blue.700"
        mb={['16px', '0']}
      >
        <FormattedMessage id="pricing.forFiscalHost.fees.header" defaultMessage="Valid for all plans" />
      </H5>
      <Flex flexDirection={['column', 'row']} alignItems={['flex-start', 'center']}>
        <Box mr={[null, '33px', '72px']}>
          <Box mb="16px">
            <Flex mb={3}>
              <FeeData>0$</FeeData>
              <FeeDescription>
                <FormattedMessage
                  id="pricing.platformFees"
                  defaultMessage="Platform Fees (on incoming contributions)₁"
                />
              </FeeDescription>
            </Flex>
            <Flex my={3}>
              <FeeData>0$</FeeData>
              <FeeDescription>
                <FormattedMessage id="pricing.payoutFees" defaultMessage="Payout Fees (on outgoing payments)₁	" />
              </FeeDescription>
            </Flex>
          </Box>
          <P fontSize="12px" lineHeight="18px" color="black.700">
            <FormattedMessage
              id="pricing.paymentProcessor"
              defaultMessage="(1) Payment processor fees apply. See <stripeLink>stripe.com/pricing</stripeLink>, <paypalLink>paypal.com/pricing</paypalLink>, <transferwiseLink>transferwise.com/pricing</transferwiseLink>"
              values={{
                stripeLink: getI18nLink({
                  href: 'https://stripe.com/pricing',
                  openInNewTab: true,
                }),
                paypalLink: getI18nLink({
                  href: 'https://paypal.com/pricing',
                  openInNewTab: true,
                }),
                transferwiseLink: getI18nLink({
                  href: 'https://transferwise.com/pricing',
                  openInNewTab: true,
                }),
              }}
            />
          </P>
          <PlatformTip mt={[3, 4]} my={4} width={[null, null, null, '451px']} display={['none', null, null, 'flex']} />
        </Box>
        <ListWrapper as="ul" mt={['16px', 0]}>
          <ListItem>
            <FormattedMessage id="pricing.fundraising" defaultMessage="Fundraising capabilities" />
          </ListItem>
          <ListItem>
            <FormattedMessage
              id="pricing.forCollective.addFunds"
              defaultMessage="Manually add funds from other channels"
            />
          </ListItem>
          <ListItem>
            <FormattedMessage id="pricing.addFunds" defaultMessage="Manually add funds from other channels" />
          </ListItem>
          <ListItem>
            <FormattedMessage id="pricing.communicationTools" defaultMessage="Communication tools" />
          </ListItem>
          <ListItem>
            <FormattedMessage id="pricing.openFinance" defaultMessage="Transparency and open finances tools" />
          </ListItem>
          <ListItem>
            <FormattedMessage
              id="pricing.expensePayOuts"
              defaultMessage="Expense payouts in local currency with one-click using the TransferWise integration."
            />
          </ListItem>
        </ListWrapper>
      </Flex>
      <PlatformTip mt={[3, 4]} my={4} width={[null, '588px']} display={['flex', null, null, 'none']} />

      <PlansWrapper display="flex" overflow="auto" justifyContent="space-between">
        {PLANS.map(plan => (
          <Flex
            key={plan.id}
            flexDirection="column"
            alignItems="flex-start"
            maxWidth={['180px', '185px', null, '246px', '257px']}
          >
            <Box width="112px" height="112px" mb={3}>
              <Illustration
                alt={`${plan.id} illustration`}
                src={`/static/images/pricing/${plan.id}-plan-illustration.svg`}
              />
            </Box>
            <Container mb={4} minHeight="230px">
              <P
                fontSize="11px"
                lineHeight="12px"
                color="black.900"
                letterSpacing="0.06em"
                fontWeight="500"
                mb={2}
                textTransform="uppercase"
              >
                {intl.formatMessage(messages[`pricing.plan.${plan.id}`])}
              </P>
              <StyledHR width="156px" mb="40px" />
              <P fontSize="28px" fontWeight="500" lineHeight="36px" letterSpacing="-0.008em" color="blue.700" mb={3}>
                {plan.fee}
              </P>
              <P fontSize="15px" lineHeight="22px" color="black.900" mb={3}>
                {intl.formatMessage(messages[`pricing.${plan.id}.fee`])}
              </P>
              <P fontSize="13px" lineHeight="16px" color="#76777A">
                {intl.formatMessage(messages[`pricing.${plan.id}.feeNote`])}
              </P>
            </Container>
            <Link href={plan.actionLink}>
              <StyledButton px={3} py={2} buttonStyle="primary" width="148px" whiteSpace="nowrap" mb={4}>
                {plan.actionType === 'joinAsFiscalHost' ? (
                  <FormattedMessage id="pricing.joinAsFiscalHost" defaultMessage="Join as Fiscal Host" />
                ) : (
                  <FormattedMessage id="pricing.contactUs" defaultMessage="Contact us" />
                )}
              </StyledButton>
            </Link>

            <P
              fontSize="11px"
              lineHeight="12px"
              color="black.900"
              letterSpacing="0.06em"
              fontWeight="400"
              mb={2}
              textTransform="uppercase"
            >
              <FormattedMessage id="pricing.mangedFunds" defaultMessage="Managed Funds" />
            </P>
            <StyledHR width="156px" mb={3} />
            <P fontSize="13px" lineHeight="16px" color="black.900" mb={4}>
              {plan.id === 'scale' ? (
                <FormattedMessage
                  id="pricing.totalRaised"
                  defaultMessage="+{totalRaised} total raised"
                  values={{ totalRaised: '$150,000' }}
                />
              ) : (
                <FormattedMessage id="pricing.noMinimum" defaultMessage="No minimum" />
              )}
            </P>
            <P
              fontSize="11px"
              lineHeight="12px"
              color="black.900"
              letterSpacing="0.06em"
              fontWeight="400"
              mb={2}
              textTransform="uppercase"
            >
              <FormattedMessage id="pricing.features" defaultMessage="Features" />
            </P>
            <StyledHR />
            <ListWrapper>
              {FEATURES.map(feature => (
                <ListItem key={feature.id} uncheck={!feature.plans.includes(plan.id)}>
                  {intl.formatMessage(messages[`pricing.${feature.id}`])}
                </ListItem>
              ))}
            </ListWrapper>
          </Flex>
        ))}
      </PlansWrapper>

      <Box mb={4} mt="56px">
        <P fontSize="12px" lineHeight="18px" color="black.700" mb="24px">
          <FormattedMessage
            id="pricing.hostFee.note"
            defaultMessage="(1) If your host fee is 10% and your Collectives bring in $1,000, your revenue is $100 and from it you’ll pay $15 to the platform."
          />
        </P>
        <P fontSize="12px" lineHeight="18px" color="black.700">
          <FormattedMessage
            id="pricing.stripeFee.note"
            defaultMessage="Stripe Fees (2.9% + 30¢) (1)	Pricing for US based organizations - For details see stripe.com/pricing"
          />
        </P>
      </Box>

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
                <Illustration src={`/static/images/pricing/${access}-icon.svg`} alt="Icon" />
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
