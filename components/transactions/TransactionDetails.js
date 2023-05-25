import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { Info } from '@styled-icons/feather/Info';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { TransactionKind, TransactionTypes } from '../../lib/constants/transactions';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import { renderDetailsString, saveInvoice } from '../../lib/transactions';

import PayoutMethodTypeWithIcon from '../expenses/PayoutMethodTypeWithIcon';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import { I18nBold } from '../I18nFormatters';
import LinkCollective from '../LinkCollective';
import PaymentMethodTypeWithIcon from '../PaymentMethodTypeWithIcon';
import StyledButton from '../StyledButton';
import StyledLink from '../StyledLink';
import StyledTooltip from '../StyledTooltip';
import { P, Span } from '../Text';

import TransactionRefundButton from './TransactionRefundButton';
import TransactionRejectButton from './TransactionRejectButton';

const rejectAndRefundTooltipContent = (showRefundHelp, showRejectHelp) => (
  <Box>
    {showRefundHelp && (
      <P fontSize="12px" lineHeight="18px" mb={showRejectHelp ? 3 : 0}>
        <FormattedMessage
          id="transaction.refund.helpText"
          defaultMessage="<bold>Refund:</bold> This action will reimburse the full amount back to your contributor. They can contribute again in the future."
          values={{ bold: I18nBold }}
        />
      </P>
    )}
    {showRejectHelp && (
      <P fontSize="12px" lineHeight="18px">
        <FormattedMessage
          id="transaction.reject.helpText"
          defaultMessage="<bold>Reject:</bold> This action prevents the contributor from contributing in the future and will reimburse the full amount back to them."
          values={{ bold: I18nBold }}
        />
      </P>
    )}
  </Box>
);

// Check whether transfer is child collective to parent or if the transfer is from host to one of its collectives
const isInternalTransfer = (fromAccount, toAccount) => {
  return fromAccount.parent?.id === toAccount.id || fromAccount.id === toAccount.host?.id;
};

const DetailTitle = styled.p`
  margin: 8px 8px 4px 8px;
  color: #76777a;
  font-weight: 500;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 11px;
`;

const DetailDescription = styled.div`
  margin: 0 8px 12px 8px;
  font-size: 12px;
  color: #4e5052;
  letter-spacing: -0.04px;
`;

const DetailsContainer = styled(Flex)`
  background: #f7f8fa;
  font-size: 12px;
  padding: 16px 24px;

  ${props =>
    props.isCompact &&
    css`
      padding: 16px 24px 16px 24px;
    `}

  @media (max-width: 40em) {
    padding: 8px;
  }
`;

const TransactionDetails = ({ displayActions, transaction, onMutationSuccess }) => {
  const intl = useIntl();
  const { loading: loadingInvoice, callWith: downloadInvoiceWith } = useAsyncCall(saveInvoice, { useErrorToast: true });
  const {
    id,
    type,
    isRefunded,
    isRefund,
    toAccount,
    fromAccount,
    host,
    uuid,
    platformFee,
    hostFee,
    paymentMethod,
    paymentProcessorFee,
    payoutMethod,
    amount,
    netAmount,
    permissions,
    order,
    expense,
    isOrderRejected,
    kind,
  } = transaction;
  const isCredit = type === TransactionTypes.CREDIT;
  const hasOrder = order !== null;

  // permissions
  const showRefundButton = permissions?.canRefund && !isRefunded;
  const showRejectButton = permissions?.canReject && !isOrderRejected;
  const showDownloadInvoiceButton = permissions?.canDownloadInvoice && !isInternalTransfer(fromAccount, toAccount);
  const hostFeeTransaction = transaction.relatedTransactions?.find(
    t => t.kind === TransactionKind.HOST_FEE && t.type === TransactionTypes.CREDIT,
  );
  const taxTransaction = transaction.relatedTransactions?.find(
    t => t.kind === TransactionKind.TAX && t.type === TransactionTypes.CREDIT,
  );
  const paymentProcessorFeeTransaction = transaction.relatedTransactions?.find(
    t => t.kind === TransactionKind.PAYMENT_PROCESSOR_FEE && t.type === TransactionTypes.CREDIT,
  );
  const paymentProcessorCover = transaction.relatedTransactions?.find(
    t => t.kind === TransactionKind.PAYMENT_PROCESSOR_COVER && t.type === TransactionTypes.CREDIT,
  );
  const isProcessing = [ORDER_STATUS.PROCESSING, ORDER_STATUS.PENDING].includes(order?.status);

  return (
    <DetailsContainer flexWrap="wrap" alignItems="flex-start">
      {!isProcessing && (
        <Flex flexDirection="column" width={[1, 0.35]}>
          <DetailTitle>
            <FormattedMessage id="transaction.details" defaultMessage="transaction details" />
          </DetailTitle>
          <DetailDescription>
            {renderDetailsString({
              amount,
              platformFee,
              hostFee,
              paymentProcessorFee,
              netAmount,
              isCredit,
              isRefunded,
              hasOrder,
              toAccount,
              fromAccount,
              taxAmount: transaction.taxAmount,
              taxInfo: transaction.taxInfo,
              intl,
              kind,
              expense,
              isRefund,
              paymentProcessorCover,
            })}
            {['CONTRIBUTION', 'ADDED_FUNDS', 'EXPENSE'].includes(transaction.kind) && (
              <Fragment>
                {paymentProcessorFeeTransaction && (
                  <Fragment>
                    <br />
                    <FormattedMessage
                      id="TransactionDetails.PaymentProcessorFee"
                      defaultMessage="This transaction includes {amount} payment processor fees"
                      values={{
                        amount: (
                          <FormattedMoneyAmount
                            amount={paymentProcessorFeeTransaction.netAmount.valueInCents}
                            currency={paymentProcessorFeeTransaction.netAmount.currency}
                            showCurrencyCode={false}
                            amountStyles={null}
                          />
                        ),
                      }}
                    />
                  </Fragment>
                )}
                {hostFeeTransaction && (
                  <Fragment>
                    <br />
                    <FormattedMessage
                      id="TransactionDetails.HostFee"
                      defaultMessage="This transaction includes {amount} host fees"
                      values={{
                        amount: (
                          <FormattedMoneyAmount
                            amount={hostFeeTransaction.netAmount.valueInCents}
                            currency={hostFeeTransaction.netAmount.currency}
                            showCurrencyCode={false}
                            amountStyles={null}
                          />
                        ),
                      }}
                    />
                  </Fragment>
                )}
                {taxTransaction && (
                  <Fragment>
                    <br />
                    <FormattedMessage
                      id="TransactionDetails.Tax"
                      defaultMessage="This transaction includes {amount} {taxName}"
                      values={{
                        taxName: taxTransaction.taxInfo?.name || 'Tax',
                        amount: (
                          <FormattedMoneyAmount
                            amount={taxTransaction.netAmount.valueInCents}
                            currency={taxTransaction.netAmount.currency}
                            showCurrencyCode={false}
                            amountStyles={null}
                          />
                        ),
                      }}
                    />
                  </Fragment>
                )}
              </Fragment>
            )}
          </DetailDescription>
          {order?.memo && (
            <React.Fragment>
              <DetailTitle>
                <FormattedMessage defaultMessage="Memo" />
              </DetailTitle>
              <DetailDescription>{order.memo}</DetailDescription>
            </React.Fragment>
          )}
          {order?.processedAt &&
            (transaction.kind === TransactionKind.ADDED_FUNDS ||
              (!paymentMethod && transaction.kind === TransactionKind.CONTRIBUTION)) && (
              <React.Fragment>
                <DetailTitle>
                  <span>
                    <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
                    {` `}
                    <StyledTooltip content={() => <FormattedMessage defaultMessage="Date the funds were received." />}>
                      <InfoCircle size={13} />
                    </StyledTooltip>
                  </span>
                </DetailTitle>
                <DetailDescription>
                  {intl.formatDate(order.processedAt, { dateStyle: 'long', timeZone: 'UTC' })}
                </DetailDescription>
              </React.Fragment>
            )}
        </Flex>
      )}
      <Flex flexDirection="column" width={[1, 0.35]}>
        <Box>
          {(host || paymentMethod) && (
            <React.Fragment>
              {host && (
                <Box>
                  <DetailTitle>
                    <FormattedMessage id="Fiscalhost" defaultMessage="Fiscal Host" />
                  </DetailTitle>
                  <DetailDescription>
                    <StyledLink as={LinkCollective} collective={host} />
                  </DetailDescription>
                </Box>
              )}
              {paymentMethod && (
                <Box>
                  <DetailTitle>
                    <FormattedMessage id="PaidWith" defaultMessage="Paid With" />
                  </DetailTitle>
                  <DetailDescription>
                    <PaymentMethodTypeWithIcon type={paymentMethod.type} fontSize={11} iconSize={16} />
                  </DetailDescription>
                </Box>
              )}
            </React.Fragment>
          )}
          {payoutMethod && (
            <Box>
              <DetailTitle>
                <FormattedMessage id="PaidWith" defaultMessage="Paid With" />
              </DetailTitle>
              <DetailDescription>
                <PayoutMethodTypeWithIcon
                  type={payoutMethod.type}
                  color={'inherit'}
                  fontWeight={'inherit'}
                  fontSize={'inherit'}
                  iconSize={16}
                />
              </DetailDescription>
            </Box>
          )}
        </Box>
      </Flex>
      {displayActions && ( // Let us override so we can hide buttons in the collective page
        <Flex flexDirection="column" width={[1, 0.3]}>
          <Flex flexWrap="wrap" justifyContent={['flex-start', 'flex-end']} alignItems="center" mt={[2, 0]}>
            {(showRefundButton || showRejectButton) && (
              <StyledTooltip content={rejectAndRefundTooltipContent(showRefundButton, showRejectButton)} mt={2}>
                <Box mx={2}>
                  <Info color="#1869F5" size={20} />
                </Box>
              </StyledTooltip>
            )}
            {showRefundButton && (
              <Span mb={2}>
                <TransactionRefundButton id={id} onMutationSuccess={onMutationSuccess} />
              </Span>
            )}
            {showRejectButton && (
              <Span mb={2}>
                <TransactionRejectButton
                  id={id}
                  canRefund={permissions?.canRefund && !isRefunded}
                  onMutationSuccess={onMutationSuccess}
                />
              </Span>
            )}
            {showDownloadInvoiceButton && (
              <StyledButton
                buttonSize="small"
                loading={loadingInvoice}
                onClick={downloadInvoiceWith({
                  transactionUuid: uuid,
                  toCollectiveSlug: toAccount.slug,
                  createdAt: transaction.createdAt,
                })}
                minWidth={140}
                background="transparent"
                textTransform="capitalize"
                ml={2}
                mb={2}
                px="unset"
                data-cy="download-transaction-receipt-btn"
              >
                {expense && <FormattedMessage id="DownloadInvoice" defaultMessage="Download invoice" />}
                {order && <FormattedMessage id="DownloadReceipt" defaultMessage="Download receipt" />}
              </StyledButton>
            )}
          </Flex>
        </Flex>
      )}
    </DetailsContainer>
  );
};

TransactionDetails.propTypes = {
  displayActions: PropTypes.bool,
  transaction: PropTypes.shape({
    isRefunded: PropTypes.bool,
    isRefund: PropTypes.bool,
    kind: PropTypes.oneOf(Object.values(TransactionKind)),
    isOrderRejected: PropTypes.bool,
    fromAccount: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
    }).isRequired,
    host: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
    }),
    toAccount: PropTypes.shape({
      id: PropTypes.string,
      slug: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
    }),
    order: PropTypes.shape({
      id: PropTypes.string,
      status: PropTypes.string,
      memo: PropTypes.string,
      processedAt: PropTypes.string,
    }),
    expense: PropTypes.object,
    id: PropTypes.string,
    uuid: PropTypes.string,
    type: PropTypes.string,
    currency: PropTypes.string,
    description: PropTypes.string,
    createdAt: PropTypes.string,
    taxAmount: PropTypes.object,
    taxInfo: PropTypes.object,
    paymentMethod: PropTypes.shape({
      type: PropTypes.string,
    }),
    payoutMethod: PropTypes.shape({
      type: PropTypes.string,
    }),
    amount: PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string,
    }),
    netAmount: PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string,
    }),
    platformFee: PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string,
    }),
    paymentProcessorFee: PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string,
    }),
    hostFee: PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string,
    }),
    permissions: PropTypes.shape({
      canRefund: PropTypes.bool,
      canDownloadInvoice: PropTypes.bool,
      canReject: PropTypes.bool,
    }),
    usingGiftCardFromCollective: PropTypes.object,
    relatedTransactions: PropTypes.array,
  }),
  isHostAdmin: PropTypes.bool,
  isRoot: PropTypes.bool,
  isToCollectiveAdmin: PropTypes.bool,
  onMutationSuccess: PropTypes.func,
};

export default TransactionDetails;
