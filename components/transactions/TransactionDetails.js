import React, { Fragment } from 'react';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { FormattedMessage, useIntl } from 'react-intl';
import styled, { css } from 'styled-components';

import { ORDER_STATUS } from '../../lib/constants/order-status';
import { TransactionKind, TransactionTypes } from '../../lib/constants/transactions';
import { ExpenseType } from '../../lib/graphql/types/v2/graphql';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';
import { renderDetailsString, saveInvoice } from '../../lib/transactions';
import useLoggedInUser from '@/lib/hooks/useLoggedInUser';
import { getDashboardTransactionsRoute, getHostDashboardTransactionsRoute } from '@/lib/url-helpers';

import PayoutMethodTypeWithIcon from '../expenses/PayoutMethodTypeWithIcon';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import PrivateInfoIcon from '../icons/PrivateInfoIcon';
import Link from '../Link';
import LinkCollective from '../LinkCollective';
import PaymentMethodTypeWithIcon from '../PaymentMethodTypeWithIcon';
import StyledLink from '../StyledLink';
import StyledTooltip from '../StyledTooltip';
import { Button } from '../ui/Button';

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

const TransactionDetails = ({ displayActions, transaction }) => {
  const intl = useIntl();
  const { LoggedInUser } = useLoggedInUser();
  const { loading: loadingInvoice, callWith: downloadInvoiceWith } = useAsyncCall(saveInvoice, { useErrorToast: true });
  const {
    legacyId,
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
  const showDownloadInvoiceButton =
    permissions?.canDownloadInvoice &&
    !isInternalTransfer(fromAccount, toAccount) &&
    (!expense || expense.type === ExpenseType.INVOICE);
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
  const isCollectiveAdmin = LoggedInUser?.isAdminOfCollective(toAccount);
  const isHostAdmin = LoggedInUser?.isAdminOfCollective(host);

  return (
    <DetailsContainer flexWrap="wrap" alignItems="flex-start">
      {!isProcessing && (
        <Flex flexDirection="column" width={[1, 0.35]}>
          <DetailTitle>
            <FormattedMessage id="transaction.details" defaultMessage="transaction details" />
          </DetailTitle>
          <DetailDescription>
            {renderDetailsString({
              relatedTransactions: transaction.relatedTransactions,
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
                <FormattedMessage defaultMessage="Memo" id="D5NqQO" />
                {` `}
                <PrivateInfoIcon size={12}>
                  <FormattedMessage defaultMessage="Visible only to Host admins" id="JM47p6" />
                </PrivateInfoIcon>
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
                    <StyledTooltip
                      content={() => <FormattedMessage defaultMessage="Date the funds were received." id="mqg/wj" />}
                    >
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
          <div className="flex flex-wrap items-center justify-start gap-2 md:justify-end">
            {(showRefundButton || showRejectButton) && (isCollectiveAdmin || isHostAdmin) && (
              <Link
                href={
                  isHostAdmin
                    ? getHostDashboardTransactionsRoute(host, { openTransactionId: legacyId, account: toAccount.slug })
                    : getDashboardTransactionsRoute(toAccount, { openTransactionId: legacyId })
                }
              >
                <Button variant="outline">
                  <FormattedMessage defaultMessage="View in Dashboard" id="OpolXQ" />
                </Button>
              </Link>
            )}
            {showDownloadInvoiceButton && (
              <Button
                data-loading={loadingInvoice}
                loading={loadingInvoice}
                onClick={downloadInvoiceWith({
                  expenseId: expense?.id,
                  transactionUuid: uuid,
                  toCollectiveSlug: toAccount.slug,
                  createdAt: transaction.createdAt,
                })}
                variant="outline"
                data-cy="download-transaction-receipt-btn"
              >
                {expense && <FormattedMessage id="DownloadInvoice" defaultMessage="Download invoice" />}
                {order && <FormattedMessage id="DownloadReceipt" defaultMessage="Download receipt" />}
              </Button>
            )}
          </div>
        </Flex>
      )}
    </DetailsContainer>
  );
};

export default TransactionDetails;
