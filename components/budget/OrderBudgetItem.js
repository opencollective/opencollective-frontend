import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';

import { GQLV2_PAYMENT_METHOD_LEGACY_TYPES } from '../../lib/constants/payment-methods';
import { i18nPaymentMethodProviderType } from '../../lib/i18n/payment-method-provider-type';
import { i18nPaymentMethodType } from '../../lib/i18n/payment-method-type';
import { toPx } from '../../lib/theme/helpers';
import { getCollectivePageRoute } from '../../lib/url-helpers';

import AutosizeText from '../AutosizeText';
import Avatar from '../Avatar';
import Container from '../Container';
import DateTime from '../DateTime';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import LoadingPlaceholder from '../LoadingPlaceholder';
import { OrderAdminAccountingCategoryPill } from '../orders/OrderAccountingCategoryPill';
import OrderStatusTag from '../orders/OrderStatusTag';
import ProcessOrderButtons from '../orders/ProcessOrderButtons';
import StyledLink from '../StyledLink';
import StyledTag from '../StyledTag';
import StyledTooltip from '../StyledTooltip';
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
  flex-grow: 1;
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

const OrderBudgetItem = ({
  isLoading = false,
  order,
  showPlatformTip = false,
  showAmountSign = true,
  host = undefined,
}) => {
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
              <StyledLink as={Link} href={`${getCollectivePageRoute(order.toAccount)}/contributions/${order.legacyId}`}>
                <AutosizeText
                  value={order.description}
                  maxLength={255}
                  minFontSizeInPx={12}
                  maxFontSizeInPx={16}
                  lengthThreshold={72}
                  mobileRatio={0.875}
                  valueFormatter={toPx}
                >
                  {({ value, fontSize }) => (
                    <H3
                      fontWeight="500"
                      lineHeight="1.5em"
                      textDecoration="none"
                      color="black.900"
                      fontSize={fontSize}
                      data-cy="contribution-title"
                    >
                      {value}
                    </H3>
                  )}
                </AutosizeText>
              </StyledLink>
              {order.permissions?.canUpdateAccountingCategory && (
                <OrderAdminAccountingCategoryPill order={order} account={order.toAccount} host={host} />
              )}
              <P mt="5px" fontSize="12px" color="black.600">
                <FormattedMessage
                  id="Order.fromTo"
                  defaultMessage="for {account} from {contributor}"
                  values={{
                    contributor: <LinkCollective collective={order.fromAccount} withHoverCard />,
                    account: <LinkCollective collective={order.toAccount} withHoverCard />,
                  }}
                />

                {' • '}
                <DateTime value={order.createdAt} />
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
                  {showAmountSign && <TransactionSign isCredit />}
                  <Span color="black.500" fontSize="16px">
                    <FormattedMoneyAmount
                      currency={order.amount.currency}
                      precision={2}
                      amount={
                        showPlatformTip && order.platformTipAmount?.valueInCents
                          ? order.amount.valueInCents + order.platformTipAmount.valueInCents
                          : order.amount.valueInCents
                      }
                    />
                  </Span>
                </Flex>
                {Boolean(showPlatformTip && order.platformTipAmount?.valueInCents) && (
                  <Container fontSize="10px" color="black.500">
                    <FormattedMessage
                      id="OrderBudgetItem.Tip"
                      defaultMessage="(includes {amount} platform tip)"
                      values={{
                        amount: (
                          <FormattedMoneyAmount
                            amount={order.platformTipAmount.valueInCents}
                            currency={order.platformTipAmount.currency}
                            precision={2}
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
            <Flex>
              <StyledTag variant="rounded-left" fontSize="10px" fontWeight="500" mr={1} textTransform="uppercase">
                <FormattedMessage defaultMessage="Contribution" id="0LK5eg" /> #{order.legacyId}
              </StyledTag>
              <OrderStatusTag status={order.status} />
            </Flex>
          )}
        </Flex>
      </Flex>
      <Flex flexWrap="wrap" justifyContent="space-between" alignItems="center" mt={2}>
        <Flex flexWrap="wrap" alignItems="center" justifyContent={['space-between', null, 'flex-start']} flexGrow={1}>
          <Flex flexDirection="column" justifyContent="flex-end" mr={[3, 4]} minHeight={50}>
            <DetailColumnHeader>
              <FormattedMessage id="paymentmethod.label" defaultMessage="Payment Method" />
            </DetailColumnHeader>
            {isLoading ? (
              <LoadingPlaceholder height={16} />
            ) : (
              <Span fontSize="11px" lineHeight="16px" color="black.700">
                {order.paymentMethod?.type
                  ? i18nPaymentMethodType(intl, order.paymentMethod.type)
                  : i18nPaymentMethodProviderType(
                      intl,
                      // TODO(paymentMethodType): migrate to service+type
                      order.paymentMethod?.providerType ||
                        order.pendingContributionData?.paymentMethod ||
                        GQLV2_PAYMENT_METHOD_LEGACY_TYPES.BANK_TRANSFER,
                    )}
              </Span>
            )}
          </Flex>
          {order?.status === 'PENDING' && order?.pendingContributionData && (
            <React.Fragment>
              {order.pendingContributionData.ponumber && (
                <Flex flexDirection="column" justifyContent="flex-end" mr={[3, 4]} minHeight={50}>
                  <DetailColumnHeader>
                    <StyledTooltip
                      content={
                        <FormattedMessage
                          defaultMessage="External reference code for this contribution. This is usually a reference number from the contributor accounting system."
                          id="LqD2Po"
                        />
                      }
                      containerCursor="default"
                    >
                      <FormattedMessage id="Fields.PONumber" defaultMessage="PO Number" />
                    </StyledTooltip>
                  </DetailColumnHeader>
                  {isLoading ? (
                    <LoadingPlaceholder height={16} />
                  ) : (
                    <Span fontSize="11px" lineHeight="16px" color="black.700">
                      {`#${order.pendingContributionData.ponumber}`}
                    </Span>
                  )}
                </Flex>
              )}

              {order.pendingContributionData.expectedAt && (
                <Flex flexDirection="column" justifyContent="flex-end" mr={[3, 4]} minHeight={50}>
                  <DetailColumnHeader>
                    <FormattedMessage defaultMessage="Expected" id="6srLb2" />
                  </DetailColumnHeader>
                  {isLoading ? (
                    <LoadingPlaceholder height={16} />
                  ) : (
                    <Span fontSize="11px" lineHeight="16px" color="black.700">
                      <DateTime
                        value={order.pendingContributionData.expectedAt}
                        dateStyle={'medium'}
                        timeStyle={undefined}
                      />
                    </Span>
                  )}
                </Flex>
              )}
            </React.Fragment>
          )}
        </Flex>
        {order?.permissions && (
          <ButtonsContainer>
            <ProcessOrderButtons order={order} permissions={order.permissions} />
          </ButtonsContainer>
        )}
      </Flex>
    </OrderContainer>
  );
};

export default OrderBudgetItem;
