import React from 'react';
import PropTypes from 'prop-types';
import { gql } from '@apollo/client';
import { Stripe } from '@styled-icons/fa-brands/Stripe';
import { FormattedMessage } from 'react-intl';
import styled from 'styled-components';

import { hasPaypalPreApprovalExpired } from '../../lib/payment-method-utils';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import PayPal from '../icons/PayPal';
import TransferwiseIcon from '../icons/TransferwiseIcon';
import Link from '../Link';
import LocationAddress from '../LocationAddress';
import StyledCard from '../StyledCard';
import StyledHr from '../StyledHr';
import StyledLink from '../StyledLink';
import { Span } from '../Text';

import ConnectPaypalButton from './ConnectPaypalButton';
import ConnectTransferwiseButton from './ConnectTransferwiseButton';
import PaypalPreApprovalDetailsIcon from './PaypalPreApprovalDetailsIcon';
import TransferwiseDetailsIcon from './TransferwiseDetailsIcon';

export const hostInfoCardFields = gql`
  fragment HostInfoCardFields on Host {
    id
    legacyId
    slug
    currency
    location {
      id
      address
      country
    }
    paypalPreApproval {
      id
      name
      expiryDate
      createdAt
      balance {
        currency
        valueInCents
      }
    }
    transferwise {
      id
      balances {
        valueInCents
        currency
      }
    }
    stripe {
      username
      issuingBalance {
        valueInCents
        currency
      }
    }
    stats {
      id
      balance {
        valueInCents
      }
    }
  }
`;

const ColumnTitle = styled.span({
  textTransform: 'uppercase',
  color: 'black.600',
  fontSize: '9px',
  lineHeight: '14px',
  letterSpacing: '0.6px',
  fontWeight: '600',
  flex: '1 1',
  paddingTop: '3px',
});

const Separator = () => (
  <Flex alignItems="center" mx={[null, null, 24]}>
    <StyledHr
      width={['100%', null, '1px']}
      borderTop={[null, null, 'none']}
      height={['1px', null, '60%']}
      my={[3, null, 0]}
      borderLeft="1px solid"
      borderColor="black.200"
    />
  </Flex>
);

const getMainTransferwiseBalance = (balances, hostCurrency) => {
  if (!balances) {
    return null;
  } else {
    return balances.find(({ currency }) => currency === hostCurrency) || balances[0];
  }
};

/**
 * A box to display some info about the host, with links to refill the
 * PayPal & Transferwise balances.
 */
const HostInfoCard = ({ host }) => {
  const mainTransferwiseBalance = getMainTransferwiseBalance(host.transferwise?.balances, host.currency);
  return (
    <StyledCard px={4} py={22}>
      <Flex display={['block', null, 'flex']} justifyContent="space-evenly">
        {host.paypalPreApproval && (
          <React.Fragment>
            <Flex flexDirection="column" justifyContent="space-between" flex="1 1 33%">
              <Flex alignItems="center" width="100%">
                <Box mr={3}>
                  <PayPal size={14} style={{ color: '#9D9FA3' }} />
                </Box>
                <ColumnTitle>
                  <FormattedMessage
                    id="ServiceBalance"
                    defaultMessage="{service} balance"
                    values={{ service: 'Paypal' }}
                  />
                </ColumnTitle>
                <PaypalPreApprovalDetailsIcon paymentMethod={host.paypalPreApproval} />
              </Flex>
              <Flex justifyContent="space-between" py={3}>
                <Span color="black.400" fontSize="15px">
                  {host.currency}
                </Span>
                <Span fontSize="15px">
                  <FormattedMoneyAmount
                    showCurrencyCode={false}
                    currency={host.paypalPreApproval?.balance.currency || host.currency}
                    amount={
                      !host.paypalPreApproval || hasPaypalPreApprovalExpired(host.paypalPreApproval)
                        ? null
                        : host.paypalPreApproval.balance.valueInCents
                    }
                  />
                </Span>
              </Flex>
              <Container display="inline-block" ml="-16px">
                <ConnectPaypalButton host={host} paymentMethod={host.paypalPreApproval} />
              </Container>
            </Flex>
            <Separator />
          </React.Fragment>
        )}

        <Flex flexDirection="column" justifyContent="space-between" flex="1 1 33%">
          <Flex alignItems="center" width="100%">
            <Box mr={3}>
              <TransferwiseIcon size={14} color="#9D9FA3" />
            </Box>
            <ColumnTitle>
              <FormattedMessage id="ServiceBalance" defaultMessage="{service} balance" values={{ service: 'Wise' }} />
            </ColumnTitle>
            <TransferwiseDetailsIcon size={18} balances={host.transferwise?.balances} />
          </Flex>
          <Flex justifyContent="space-between" mt={3}>
            <Span color="black.400" fontSize="15px">
              {mainTransferwiseBalance?.currency || host.currency}
            </Span>
            <Span fontSize="15px">
              <FormattedMoneyAmount
                showCurrencyCode={false}
                amount={mainTransferwiseBalance?.valueInCents}
                currency={mainTransferwiseBalance?.currency || host.currency}
              />
            </Span>
          </Flex>
          {host.transferwise?.amountBatched && (
            <Flex justifyContent="space-between" mt={1}>
              <Span color="black.400" fontSize="13px">
                <FormattedMessage id="TotalBatched" defaultMessage="Total Batched" />
              </Span>
              <Span fontSize="13px">
                <FormattedMoneyAmount
                  showCurrencyCode={false}
                  amount={host.transferwise.amountBatched.valueInCents}
                  currency={host.transferwise.amountBatched.currency || host.currency}
                />
              </Span>
            </Flex>
          )}
          <Container display="inline-block" ml="-16px" mt={3}>
            <ConnectTransferwiseButton isConnected={Boolean(host.transferwise?.balances)} />
          </Container>
        </Flex>
        {host.stripe?.issuingBalance && (
          <React.Fragment>
            <Separator />
            <Flex flexDirection="column" justifyContent="flex-start" flex="1 1 33%">
              <Flex alignItems="center" width="100%">
                <Box mr={3}>
                  <Stripe size={14} color="#9D9FA3" />
                </Box>
                <ColumnTitle>
                  <FormattedMessage
                    id="ServiceBalance"
                    defaultMessage="{service} balance"
                    values={{ service: 'Stripe issuing' }}
                  />
                </ColumnTitle>
              </Flex>
              <Flex justifyContent="space-between" py={3}>
                <Span color="black.400" fontSize="15px">
                  {host.stripe.issuingBalance.currency || host.currency}
                </Span>
                <Span fontSize="15px">
                  <FormattedMoneyAmount
                    showCurrencyCode={false}
                    amount={host.stripe.issuingBalance.valueInCents}
                    currency={host.stripe.issuingBalance.currency || host.currency}
                  />
                </Span>
              </Flex>
            </Flex>
          </React.Fragment>
        )}
      </Flex>
      <Flex marginTop="16px" flexDirection="column">
        <StyledHr marginBottom="16px" borderColor="black.200" />
        <Flex justifyContent="space-between" mb={2}>
          <ColumnTitle>
            <FormattedMessage id="BillingAddress" defaultMessage="Billing address" />
          </ColumnTitle>
          <StyledLink as={Link} href={`/${host.slug}/admin`} fontSize="10px" lineHeight="15px">
            <FormattedMessage id="Edit" defaultMessage="Edit" />
          </StyledLink>
        </Flex>
        <Container fontSize="10px" lineHeight="15px" color="black.500">
          <LocationAddress location={host.location} showMessageIfEmpty singleLine />
        </Container>
      </Flex>
    </StyledCard>
  );
};

HostInfoCard.propTypes = {
  host: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    location: PropTypes.object,
    paypalPreApproval: PropTypes.shape({
      expiryDate: PropTypes.string,
      balance: PropTypes.shape({
        valueInCents: PropTypes.number,
        currency: PropTypes.string.isRequired,
      }).isRequired,
    }),
    transferwise: PropTypes.shape({
      balances: PropTypes.arrayOf(
        PropTypes.shape({
          valueInCents: PropTypes.number,
          currency: PropTypes.string,
        }),
      ),
      amountBatched: PropTypes.arrayOf(
        PropTypes.shape({
          valueInCents: PropTypes.number,
          currency: PropTypes.string,
        }),
      ),
    }),
    stripe: PropTypes.shape({
      issuingBalance: PropTypes.shape({
        valueInCents: PropTypes.number,
        currency: PropTypes.string,
      }),
    }),
  }).isRequired,
};

export default HostInfoCard;
