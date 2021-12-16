import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { FormattedMessage, useIntl } from 'react-intl';

import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../lib/graphql/helpers';

import Container from './Container';
import FormattedMoneyAmount from './FormattedMoneyAmount';
import { Box, Flex } from './Grid';
import StyledButton from './StyledButton';
import StyledHr from './StyledHr';
import StyledInputAmount from './StyledInputAmount';
import Modal, { ModalBody, ModalFooter, ModalHeader } from './StyledModal';
import { P, Span } from './Text';
import { TOAST_TYPE, useToasts } from './ToastProvider';

const confirmContributionMutation = gqlV2/* GraphQL */ `
  mutation ConfirmContribution($id: String!, $action: ProcessOrderAction!, $details: OrderDetailsInput) {
    processPendingOrder(order: { id: $id }, action: $action, details: $details) {
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
      platformContributionAmount {
        currency
        valueInCents
      }
    }
  }
`;

const ContributionConfirmationModal = ({ order, onClose, show }) => {
  const amountInitiated = order.amount.valueInCents + order.platformContributionAmount.valueInCents;
  const currency = order.amount.currency;
  const [amountReceived, setAmountReceived] = useState(amountInitiated);
  const [platformTip, setPlatformTip] = useState(order.platformContributionAmount.valueInCents);
  const [paymentProcessorFee, setPaymentProcessorFee] = useState(0);
  const intl = useIntl();
  const { addToast } = useToasts();
  const [confirmOrder, { loading }] = useMutation(confirmContributionMutation, { context: API_V2_CONTEXT });
  const netAmount = amountReceived - platformTip;

  const triggerAction = async () => {
    // Prevent submitting the action if another one is being submitted at the same time
    if (loading) {
      return;
    }

    const orderConfirmationDetails = {
      totalAmount: { valueInCents: amountReceived, currency },
      paymentProcessorFeesAmount: { valueInCents: paymentProcessorFee, currency },
      platformTipAmount: { valueInCents: platformTip, currency },
    };
    try {
      await confirmOrder({ variables: { id: order.id, action: 'MARK_AS_PAID', details: orderConfirmationDetails } });
      addToast({
        type: TOAST_TYPE.SUCCESS,
        message: intl.formatMessage({ defaultMessage: 'Order confirmed successfully' }),
      });
      onClose();
    } catch (e) {
      addToast({ type: TOAST_TYPE.ERROR, message: i18nGraphqlException(intl, e) });
    }
  };

  return (
    <Modal width="578px" show={show} onClose={onClose} trapFocus>
      <ModalHeader>
        <FormattedMessage
          defaultMessage="Confirm contribution to {collectiveName}"
          values={{
            collectiveName: order.toAccount.name,
          }}
        />
      </ModalHeader>
      <ModalBody>
        <P mb={4} fontSize="13px">
          <FormattedMessage defaultMessage="Confirm the amount of funds you have received in your host account." />
        </P>
        <Container mt="58px">
          <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
            <Span fontSize="14px" lineHeight="20px" fontWeight="700">
              <FormattedMessage
                defaultMessage="Amount initiated by {contributor}"
                values={{ contributor: order.fromAccount.name }}
              />
            </Span>
            <StyledInputAmount
              name="amountInitiated"
              width="142px"
              currency={currency}
              value={amountInitiated}
              disabled
            />
          </Flex>
        </Container>
        <StyledHr borderStyle="solid" mt="16px" mb="16px" />
        <Container>
          <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
            <Span fontSize="14px" lineHeight="20px" fontWeight="400">
              <FormattedMessage
                defaultMessage="Amount received by {collective}"
                values={{ collective: order.toAccount.name }}
              />
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
              <FormattedMessage defaultMessage="Payment processor fees" values={{ collective: order.toAccount.name }} />
            </Span>
            <StyledInputAmount
              name="paymentProcessorFee"
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
              <FormattedMessage defaultMessage="Platform tip amount" values={{ collective: order.toAccount.name }} />
            </Span>
            <StyledInputAmount
              name="platformTip"
              width="142px"
              currency={currency}
              onChange={value => setPlatformTip(value)}
              value={platformTip}
            />
          </Flex>
        </Container>
        <StyledHr borderStyle="dashed" mt="16px" mb="16px" />
        <Container>
          <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
            <Span fontSize="14px" lineHeight="20px" fontWeight="500">
              <FormattedMessage defaultMessage="Net Amount for Collective (USD):" />
            </Span>
            <Box fontSize="16px" lineHeight="24px" fontWeight="700" ml="16px">
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
            <FormattedMessage
              defaultMessage="Confirm contribution of {amount}"
              values={{
                amount: (
                  <FormattedMoneyAmount amount={netAmount} currency={currency} precision={2} amountStyles={null} />
                ),
              }}
            />
          </StyledButton>
        </Container>
      </ModalFooter>
    </Modal>
  );
};

ContributionConfirmationModal.propTypes = {
  /** the order that is being confirmed */
  order: PropTypes.object,
  /** a boolean to determine when to show modal */
  show: PropTypes.bool.isRequired,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
};

export default ContributionConfirmationModal;
