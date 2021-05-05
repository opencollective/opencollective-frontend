import React from 'react';
import PropTypes from 'prop-types';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { GQLV2_PAYMENT_METHOD_TYPES } from '../../lib/constants/payment-methods';
import { i18nPaymentMethodProviderType } from '../../lib/i18n/payment-method-provider-type';

import AutosizeText from '../AutosizeText';
import Avatar from '../Avatar';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import OrderStatusTag from '../orders/OrderStatusTag';
import ProcessOrderButtons from '../orders/ProcessOrderButtons';
import StyledTag from '../StyledTag';
import { H3, P, Span } from '../Text';
import TransactionSign from '../TransactionSign';

const DetailColumnHeader = styled.div`
  font-style: normal;
  font-weight: bold;
  font-size: 9px;
  line-height: 14px;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #c4c7cc;
  margin-bottom: 2px;
`;

const ButtonsContainer = styled.div.attrs({ 'data-cy': 'order-actions' })`
  display: flex;
  flex-wrap: wrap;
  margin-top: 8px;
  transition: opacity 0.05s;
  justify-content: flex-end;

  @media (max-width: 40em) {
    justify-content: center;
  }

  & > *:last-child {
    margin-right: 0;
  }
`;

const OrderContainer = styled.div`
  padding: 16px 27px;

  @media (hover: hover) {
    &:not(:hover):not(:focus-within) ${ButtonsContainer} {
      opacity: 0.24;
    }
  }
`;

const OrderBudgetItem = ({ isLoading, order, showPlatformTip }) => {
  const intl = useIntl();
  return (
    <OrderContainer>
      <Flex justifyContent="space-between" flexWrap="wrap">
        <Flex flex="1" minWidth="max(60%, 300px)" maxWidth={[null, '70%']}>
          <Box mr={3}>
            {isLoading ? (
              <LoadingPlaceholder width={40} height={40} />
            ) : (
              <LinkCollective collective={order.fromAccount}>
                <Avatar collective={order.fromAccount} radius={40} />
              </LinkCollective>
            )}
          </Box>
          {isLoading ? (
            <LoadingPlaceholder height={60} />
          ) : (
            <Box>
              <AutosizeText
                value={order.description}
                maxLength={255}
                minFontSizeInPx={12}
                maxFontSizeInPx={14}
                lengthThreshold={72}
              >
                {({ value, fontSize }) => (
                  <H3
                    fontWeight="500"
                    lineHeight="1.5em"
                    textDecoration="none"
                    color="black.900"
                    fontSize={`${fontSize}px`}
                    data-cy="expense-title"
                  >
                    {value}
                  </H3>
                )}
              </AutosizeText>

              <P mt="5px" fontSize="12px" color="black.600">
                <FormattedMessage
                  id="Order.fromTo"
                  defaultMessage="for {account} from {contributor}"
                  values={{
                    contributor: <LinkCollective collective={order.fromAccount} />,
                    account: <LinkCollective collective={order.toAccount} />,
                  }}
                />

                {' • '}
                <FormattedDate value={order.createdAt} />
              </P>
            </Box>
          )}
        </Flex>
        <Flex flexDirection={['row', 'column']} mt={[3, 0]} flexWrap="wrap" alignItems={['center', 'flex-end']}>
          <Flex my={2} mr={[3, 0]} minWidth={100} justifyContent="flex-end" data-cy="order-amount">
            {isLoading ? (
              <LoadingPlaceholder height={19} width={120} />
            ) : (
              <Flex flexDirection="column" alignItems={['flex-start', 'flex-end']}>
                <Flex alignItems="center">
                  <TransactionSign isCredit />
                  <Span color="black.500" fontSize="15px">
                    <FormattedMoneyAmount
                      currency={order.amount.currency}
                      precision={2}
                      amount={
                        showPlatformTip
                          ? order.amount.valueInCents
                          : order.amount.valueInCents - (order.platformContributionAmount?.valueInCents || 0)
                      }
                    />
                  </Span>
                </Flex>
                {showPlatformTip && order.platformContributionAmount?.valueInCents && (
                  <Container fontSize="10px" color="black.500">
                    <FormattedMessage
                      id="OrderBudgetItem.Tip"
                      defaultMessage="(includes {amount} platform tip)"
                      values={{
                        amount: (
                          <FormattedMoneyAmount
                            amount={order.platformContributionAmount.valueInCents}
                            currency={order.platformContributionAmount.currency}
                            precision={2}
                            amountStyles={null}
                          />
                        ),
                      }}
                    />
                  </Container>
                )}
              </Flex>
            )}
          </Flex>
          {isLoading ? (
            <LoadingPlaceholder height={20} width={140} mt={2} />
          ) : (
            <Flex mt={2}>
              <StyledTag variant="rounded-left" fontSize="10px" fontWeight="500" mr={1}>
                <FormattedMessage id="Order" defaultMessage="Order" /> #{order.legacyId}
              </StyledTag>
              <OrderStatusTag status={order.status} />
            </Flex>
          )}
        </Flex>
      </Flex>
      <Flex flexWrap="wrap" justifyContent="space-between" alignItems="center" mt={2}>
        <Box>
          <Flex>
            <Flex flexDirection="column" justifyContent="flex-end" mr={[3, 4]} minHeight={50}>
              <DetailColumnHeader>
                <FormattedMessage id="paymentmethod.label" defaultMessage="Payment Method" />
              </DetailColumnHeader>
              {isLoading ? (
                <LoadingPlaceholder height={16} />
              ) : (
                <Span fontSize="11px" lineHeight="16px" color="black.700">
                  {i18nPaymentMethodProviderType(
                    intl,
                    order.paymentMethod?.providerType || GQLV2_PAYMENT_METHOD_TYPES.BANK_TRANSFER,
                  )}
                </Span>
              )}
            </Flex>
          </Flex>
        </Box>

        {order?.permissions && (
          <ButtonsContainer>
            <ProcessOrderButtons order={order} permissions={order.permissions} />
          </ButtonsContainer>
        )}
      </Flex>
    </OrderContainer>
  );
};

OrderBudgetItem.propTypes = {
  isLoading: PropTypes.bool,
  /** Set this to true to invert who's displayed (payee or collective) */
  isInverted: PropTypes.bool,
  usePreviewModal: PropTypes.bool,
  showAmountSign: PropTypes.bool,
  onDelete: PropTypes.func,
  onProcess: PropTypes.func,
  showProcessActions: PropTypes.bool,
  view: PropTypes.oneOf(['public', 'admin']),
  collective: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    currency: PropTypes.string,
    stats: PropTypes.shape({
      balance: PropTypes.shape({
        valueInCents: PropTypes.number,
      }),
    }),
    parent: PropTypes.shape({
      slug: PropTypes.string.isRequired,
    }),
  }),
  host: PropTypes.object,
  order: PropTypes.shape({
    id: PropTypes.string,
    legacyId: PropTypes.number,
    description: PropTypes.string.isRequired,
    status: PropTypes.oneOf(Object.values(ORDER_STATUS)).isRequired,
    createdAt: PropTypes.string.isRequired,
    amount: PropTypes.object.isRequired,
    platformContributionAmount: PropTypes.object.isRequired,
    permissions: PropTypes.shape({
      canReject: PropTypes.bool,
      canMarkAsPaid: PropTypes.bool,
    }),
    paymentMethod: PropTypes.shape({
      providerType: PropTypes.string,
    }),
    /** If available, this `account` will be used in place of the `collective` */
    toAccount: PropTypes.shape({
      slug: PropTypes.string,
    }),
    fromAccount: PropTypes.shape({
      slug: PropTypes.string,
    }),
  }),
  showPlatformTip: PropTypes.bool,
};

export default OrderBudgetItem;
