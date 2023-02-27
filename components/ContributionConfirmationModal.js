import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT } from '../lib/graphql/helpers';
import { getCurrentDateInUTC } from '../lib/utils';

import Container from './Container';
import FormattedMoneyAmount from './FormattedMoneyAmount';
import { Box, Flex } from './Grid';
import StyledButton from './StyledButton';
import StyledHr from './StyledHr';
import StyledInput from './StyledInput';
import StyledInputAmount from './StyledInputAmount';
import StyledInputPercentage from './StyledInputPercentage';
import StyledModal, { CollectiveModalHeader, ModalBody, ModalFooter } from './StyledModal';
import StyledTooltip from './StyledTooltip';
import { P, Span } from './Text';
import { TOAST_TYPE, useToasts } from './ToastProvider';

const confirmContributionMutation = gql`
  mutation ConfirmContribution($order: OrderUpdateInput!, $action: ProcessOrderAction!) {
    processPendingOrder(order: $order, action: $action) {
      id
      status
      permissions {
        id
        canMarkAsPaid
        canMarkAsExpired
      }
      amount {
        currency
        valueInCents
      }
      platformTipAmount {
        currency
        valueInCents
      }
    }
  }
`;

const ContributionConfirmationModal = ({ order, onClose, onSuccess }) => {
  const defaultHostFeePercent = order.hostFeePercent || order.toAccount.bankTransfersHostFeePercent;
  const platformTipAmount = order.platformTipAmount?.valueInCents || 0;
  const amountInitiated = order.amount.valueInCents + platformTipAmount;
  const currency = order.amount.currency;
  const [amountReceived, setAmountReceived] = useState(amountInitiated);
  const [platformTip, setPlatformTip] = useState(platformTipAmount);
  const [paymentProcessorFee, setPaymentProcessorFee] = useState(0);
  const [hostFeePercent, setHostFeePercent] = useState(defaultHostFeePercent);
  const [processedAt, setProcessedAt] = useState(getCurrentDateInUTC());
  const intl = useIntl();
  const { addToast } = useToasts();
  const [confirmOrder, { loading }] = useMutation(confirmContributionMutation, { context: API_V2_CONTEXT });
  const amount = amountReceived - platformTip;
  const hostFee = Math.round(amount * hostFeePercent) / 100;
  const netAmount = amount - paymentProcessorFee - hostFee;
  const canAddHostFee = !order.toAccount.isHost;

  const triggerAction = async () => {
    // Prevent submitting the action if another one is being submitted at the same time
    if (loading) {
      return;
    }

    const orderUpdate = {
      id: order.id,
    };

    if (amount !== order.amount.valueInCents) {
      orderUpdate.amount = { valueInCents: amount, currency };
    }

    if (paymentProcessorFee !== 0) {
      orderUpdate.paymentProcessorFee = { valueInCents: paymentProcessorFee, currency };
    }

    if (platformTip !== order.platformTipAmount?.valueInCents) {
      orderUpdate.platformTip = { valueInCents: platformTip, currency };
    }

    if (defaultHostFeePercent !== hostFeePercent) {
      orderUpdate.hostFeePercent = hostFeePercent;
    }

    if (processedAt) {
      orderUpdate.processedAt = new Date(processedAt);
    }

    try {
      await confirmOrder({ variables: { order: orderUpdate, action: 'MARK_AS_PAID' } });
      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: intl.formatMessage({ defaultMessage: 'Order confirmed successfully' }),
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
    }
  };

  return (
    <StyledModal width="578px" onClose={onClose} trapFocus>
      <CollectiveModalHeader
        collective={order.toAccount}
        customText={
          <FormattedMessage defaultMessage="Confirm contribution to {payee}" values={{ payee: order.toAccount.name }} />
        }
      />
      <ModalBody>
        <P mt={3} fontSize="13px">
          <FormattedMessage defaultMessage="Confirm the amount of funds you have received in your host account." />
        </P>
        <Container mt={4}>
          <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
            <Span fontSize="14px" lineHeight="20px" fontWeight="700">
              <FormattedMessage
                defaultMessage="Amount initiated by {contributor}"
                values={{ contributor: order.fromAccount.name }}
              />
            </Span>
            <Box fontSize="16px" lineHeight="24px" fontWeight="700" mt={['8px', 0]}>
              <FormattedMoneyAmount
                width="142px"
                amount={amountInitiated}
                currency={currency}
                precision={2}
                amountStyles={null}
              />
            </Box>
          </Flex>
        </Container>
        <StyledHr borderStyle="solid" mt="16px" mb="16px" />
        <Container>
          <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
            <Span fontSize="14px" lineHeight="20px" fontWeight="400">
              <FormattedMessage defaultMessage="Amount received" />
            </Span>
            <StyledInputAmount
              name="amountReceived"
              data-cy="amount-received"
              width="142px"
              currency={currency}
              onChange={value => setAmountReceived(value)}
              value={amountReceived}
            />
          </Flex>
        </Container>
        <StyledHr borderStyle="dashed" mt="16px" mb="16px" />
        <Container>
          <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
            <Span fontSize="14px" lineHeight="20px" fontWeight="400">
              <FormattedMessage id="contribution.paymentFee" defaultMessage="Payment processor fee" />
            </Span>
            <StyledInputAmount
              name="paymentProcessorFee"
              data-cy="payment-processor-fee"
              width="142px"
              currency={currency}
              onChange={value => setPaymentProcessorFee(value)}
              value={paymentProcessorFee}
            />
          </Flex>
        </Container>
        <StyledHr borderStyle="dashed" mt="16px" mb="16px" />
        <Container>
          <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
            <Span fontSize="14px" lineHeight="20px" fontWeight="400">
              <FormattedMessage defaultMessage="Platform tip amount" />
            </Span>
            <StyledInputAmount
              name="platformTip"
              data-cy="platform-tip"
              width="142px"
              currency={currency}
              onChange={value => setPlatformTip(value)}
              value={platformTip}
            />
          </Flex>
        </Container>
        {canAddHostFee && (
          <Fragment>
            <StyledHr borderStyle="dashed" mt="16px" mb="16px" />
            <Container>
              <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
                <Span fontSize="14px" lineHeight="20px" fontWeight="400">
                  <FormattedMessage id="HostFee" defaultMessage="Host fee" />
                </Span>
                <StyledInputPercentage
                  name="hostFeePercent"
                  data-cy="host-fee-percent"
                  value={hostFeePercent}
                  onChange={value => setHostFeePercent(value)}
                />
              </Flex>
            </Container>
          </Fragment>
        )}
        <StyledHr borderStyle="dashed" mt="16px" mb="16px" />
        <Container>
          <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
            <Span fontSize="14px" lineHeight="20px" fontWeight="400">
              <span>
                <FormattedMessage id="expense.incurredAt" defaultMessage="Date" />
                {` `}
                <StyledTooltip content={() => <FormattedMessage defaultMessage="Date the funds were received." />}>
                  <InfoCircle size={16} />
                </StyledTooltip>
              </span>
            </Span>
            <StyledInput
              name="processedAt"
              type="date"
              data-cy="processedAt"
              defaultValue={processedAt}
              onChange={e => setProcessedAt(e.target.value)}
            />
          </Flex>
        </Container>
        <StyledHr borderStyle="dashed" mt="16px" mb="16px" />
        <Container>
          <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
            <Span fontSize="14px" lineHeight="20px" fontWeight="500">
              <FormattedMessage
                defaultMessage="Amount for {collective}:"
                values={{ collective: order.toAccount.name }}
              />
            </Span>
            <Box fontSize="16px" lineHeight="24px" fontWeight="700" ml="16px">
              <FormattedMoneyAmount amount={amount} currency={currency} precision={2} amountStyles={null} />
            </Box>
          </Flex>
        </Container>
        <StyledHr borderStyle="dashed" mt="16px" mb="16px" />
        <Container>
          <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
            <Span fontSize="12px" lineHeight="20px" fontWeight="500">
              <FormattedMessage defaultMessage="Payment Processor Fee:" />
            </Span>
            <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
              <FormattedMoneyAmount
                amount={paymentProcessorFee}
                currency={currency}
                precision={2}
                amountStyles={null}
              />
            </Box>
          </Flex>
          {canAddHostFee && (
            <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
              <Span fontSize="12px" lineHeight="20px" fontWeight="500">
                <FormattedMessage defaultMessage="Host Fee:" />
              </Span>
              <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
                <FormattedMoneyAmount amount={hostFee} currency={currency} precision={2} amountStyles={null} />
              </Box>
            </Flex>
          )}
          <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
            <Span fontSize="12px" lineHeight="20px" fontWeight="500">
              <FormattedMessage
                defaultMessage="Net Amount for {collective}:"
                values={{ collective: order.toAccount.name }}
              />
            </Span>
            <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
              <FormattedMoneyAmount amount={netAmount} currency={currency} precision={2} amountStyles={null} />
            </Box>
          </Flex>
        </Container>
      </ModalBody>
      <ModalFooter isFullWidth>
        <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="Wrap">
          <StyledButton
            buttonStyle="secondary"
            onClick={onClose}
            mr={[0, '16px']}
            mb={['16px', 0]}
            minWidth={['268px', 0]}
          >
            <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
          </StyledButton>
          <StyledButton
            minWidth={240}
            buttonStyle="primary"
            type="submit"
            onClick={() => triggerAction()}
            data-cy="order-confirmation-modal-submit"
          >
            <FormattedMessage defaultMessage="Confirm contribution" />
          </StyledButton>
        </Container>
      </ModalFooter>
    </StyledModal>
  );
};

ContributionConfirmationModal.propTypes = {
  /** the order that is being confirmed */
  order: PropTypes.object,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  /** Called if the action request is successfull */
  onSuccess: PropTypes.func,
};

export default ContributionConfirmationModal;
