import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { useMutation } from '@apollo/client';
import { accountHasGST, accountHasVAT, TaxType } from '@opencollective/taxes';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { omit } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { getCurrentLocalDateStr } from '../lib/date-utils';
import { i18nGraphqlException } from '../lib/errors';
import { API_V2_CONTEXT, gql } from '../lib/graphql/helpers';
import { TaxInput } from '../lib/graphql/types/v2/graphql';
import { i18nTaxType } from '../lib/i18n/taxes';

import { useToast } from './ui/useToast';
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
import { Label, P, Span } from './Text';

export const confirmContributionFieldsFragment = gql`
  fragment ConfirmContributionFields on Order {
    id
    hostFeePercent
    pendingContributionData {
      expectedAt
      paymentMethod
      ponumber
      memo
      fromAccountInfo {
        name
        email
      }
    }
    memo
    fromAccount {
      id
      slug
      name
      type
      imageUrl
      hasImage
      isIncognito
      ... on Individual {
        isGuest
      }
    }
    toAccount {
      id
      slug
      name
      type
      imageUrl
      hasImage
      ... on AccountWithHost {
        bankTransfersHostFeePercent: hostFeePercent(paymentMethodType: MANUAL)
        host {
          id
          settings
        }
      }
      ... on Organization {
        host {
          id
          settings
        }
      }
    }
    createdByAccount {
      id
      slug
      name
      imageUrl
    }
    totalAmount {
      valueInCents
      currency
    }
    amount {
      currency
      valueInCents
    }
    taxAmount {
      currency
      valueInCents
    }
    tax {
      id
      type
      rate
    }
    platformTipAmount {
      currency
      valueInCents
    }
    platformTipEligible
  }
`;

const confirmContributionMutation = gql`
  mutation ConfirmContribution($order: OrderUpdateInput!, $action: ProcessOrderAction!) {
    processPendingOrder(order: $order, action: $action) {
      id
      legacyId
      status
      permissions {
        id
        canMarkAsPaid
        canMarkAsExpired
      }
      ...ConfirmContributionFields
    }
  }
  ${confirmContributionFieldsFragment}
`;

const getApplicableTaxType = (collective, host) => {
  if (accountHasVAT(collective, host)) {
    return TaxType.VAT;
  } else if (accountHasGST(host || collective)) {
    return TaxType.GST;
  }
};

const ContributionConfirmationModal = ({ order, onClose, onSuccess }) => {
  const defaultHostFeePercent = order.hostFeePercent || order.toAccount.bankTransfersHostFeePercent || 0;
  const defaultTaxPercent = order.tax?.rate * 100 || 0;
  const defaultPlatformTip = order.platformTipAmount?.valueInCents || 0;
  const amountInitiated = order.amount.valueInCents + defaultPlatformTip;
  const currency = order.amount.currency;
  const [amountReceived, setAmountReceived] = useState(amountInitiated);
  const [platformTip, setPlatformTip] = useState(defaultPlatformTip);
  const [paymentProcessorFee, setPaymentProcessorFee] = useState(0);
  const [hostFeePercent, setHostFeePercent] = useState(defaultHostFeePercent);
  const [taxPercent, setTaxPercent] = useState(defaultTaxPercent);
  const [processedAt, setProcessedAt] = useState(getCurrentLocalDateStr());
  const intl = useIntl();
  const { toast } = useToast();
  const [confirmOrder, { loading: submitting }] = useMutation(confirmContributionMutation, { context: API_V2_CONTEXT });
  const contributionAmount = amountReceived - platformTip;
  const grossContributionAmount = Math.round(contributionAmount / (1 + taxPercent / 100));
  const taxAmount = taxPercent ? Math.round(contributionAmount - grossContributionAmount) : null;
  const hostFee = Math.round((contributionAmount - taxAmount) * hostFeePercent) / 100;
  const netAmount = contributionAmount - paymentProcessorFee - hostFee - taxAmount;
  const canAddHostFee = !order.toAccount.isHost;
  const applicableTax = getApplicableTaxType(order.toAccount, order.toAccount.host);

  return (
    <StyledModal width="578px" onClose={onClose}>
      <CollectiveModalHeader
        collective={order.toAccount}
        customText={
          <FormattedMessage defaultMessage="Confirm contribution to {payee}" values={{ payee: order.toAccount.name }} />
        }
      />
      <form
        onSubmit={async e => {
          e.preventDefault();

          // Prevent submitting the action if another one is being submitted at the same time
          if (submitting) {
            return;
          }

          try {
            await confirmOrder({
              variables: {
                action: 'MARK_AS_PAID',
                order: {
                  id: order.id,
                  amount: { valueInCents: grossContributionAmount, currency },
                  paymentProcessorFee: { valueInCents: paymentProcessorFee || 0, currency },
                  platformTip: { valueInCents: platformTip || 0, currency },
                  hostFeePercent: hostFeePercent || 0,
                  processedAt: processedAt ? new Date(processedAt) : new Date(),
                  tax: !taxPercent
                    ? null
                    : ({
                        type: applicableTax,
                        ...omit(order.tax, ['id', '__typename']),
                        rate: taxPercent / 100,
                        amount: { valueInCents: taxAmount, currency },
                      } as TaxInput),
                },
              },
            });
            toast({
              variant: 'success',
              message: intl.formatMessage({ defaultMessage: 'Contribution confirmed successfully' }),
            });
            onSuccess?.();
            onClose();
          } catch (e) {
            toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
          }
        }}
      >
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
                <FormattedMoneyAmount amount={amountInitiated} currency={currency} precision={2} amountStyles={null} />
              </Box>
            </Flex>
          </Container>
          <StyledHr borderStyle="solid" mt="16px" mb="16px" />
          <Container>
            <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
              <Label fontSize="14px" lineHeight="20px" fontWeight="400" htmlFor="confirmContribution-amountReceived">
                <FormattedMessage defaultMessage="Amount received" />
              </Label>
              {/* @ts-ignore StyledInputAmount not typed yet */}
              <StyledInputAmount
                id="confirmContribution-amountReceived"
                name="amountReceived"
                data-cy="amount-received"
                width="142px"
                currency={currency}
                onChange={value => setAmountReceived(value)}
                value={amountReceived}
                required
              />
            </Flex>
          </Container>
          <StyledHr borderStyle="dashed" mt="16px" mb="16px" />
          <Container>
            <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
              <Label fontSize="14px" lineHeight="20px" fontWeight="400" htmlFor="confirmContribution-processorFee">
                <FormattedMessage id="contribution.paymentFee" defaultMessage="Payment processor fee" />
              </Label>
              {/* @ts-ignore StyledInputAmount not typed yet */}
              <StyledInputAmount
                id="confirmContribution-processorFee"
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
              <Label fontSize="14px" lineHeight="20px" fontWeight="400" htmlFor="confirmContribution-platformTip">
                <FormattedMessage defaultMessage="Platform tip amount" />
              </Label>
              {/* @ts-ignore StyledInputAmount not typed yet */}
              <StyledInputAmount
                id="confirmContribution-platformTip"
                name="platformTip"
                data-cy="platform-tip"
                width="142px"
                currency={currency}
                onChange={value => setPlatformTip(value)}
                value={platformTip}
                min={platformTip ? 0 : undefined}
                max={amountReceived ? amountReceived : undefined}
              />
            </Flex>
          </Container>
          {Boolean(order.taxAmount || applicableTax) && (
            <Fragment>
              <StyledHr borderStyle="dashed" mt="16px" mb="16px" />
              <Container>
                <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
                  <Label fontSize="14px" lineHeight="20px" fontWeight="400" htmlFor="confirmContribution-taxRate">
                    <FormattedMessage
                      defaultMessage="{taxName} rate"
                      values={{ taxName: i18nTaxType(intl, order.tax?.type || applicableTax, 'full') }}
                    />
                  </Label>
                  <StyledInputPercentage
                    id="confirmContribution-taxRate"
                    name="tax.rate"
                    data-cy="host-fee-percent"
                    value={taxPercent}
                    onChange={value => setTaxPercent(value)}
                  />
                </Flex>
              </Container>
            </Fragment>
          )}
          {canAddHostFee && (
            <Fragment>
              <StyledHr borderStyle="dashed" mt="16px" mb="16px" />
              <Container>
                <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
                  <Label fontSize="14px" lineHeight="20px" fontWeight="400" htmlFor="confirmContribution-hostFee">
                    <FormattedMessage id="HostFee" defaultMessage="Host fee" />
                  </Label>
                  <StyledInputPercentage
                    id="confirmContribution-hostFee"
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
              <Label fontSize="14px" lineHeight="20px" fontWeight="400" htmlFor="confirmContribution-processedAt">
                <span>
                  <FormattedMessage defaultMessage="Effective Date" />
                  {` `}
                  <StyledTooltip
                    content={() => (
                      <FormattedMessage defaultMessage="Date funds were cleared on your bank, Wise, PayPal, Stripe or any other external account holding these funds." />
                    )}
                  >
                    <InfoCircle size={16} />
                  </StyledTooltip>
                </span>
              </Label>
              <StyledInput
                id="confirmContribution-processedAt"
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
                  id="withColon"
                  defaultMessage="{item}:"
                  values={{
                    item: (
                      <FormattedMessage
                        defaultMessage="Amount for {collective}"
                        values={{ collective: order.toAccount.name }}
                      />
                    ),
                  }}
                />
              </Span>
              <Box fontSize="16px" lineHeight="24px" fontWeight="700" ml="16px">
                <FormattedMoneyAmount
                  amount={contributionAmount}
                  currency={currency}
                  precision={2}
                  amountStyles={null}
                />
              </Box>
            </Flex>
          </Container>
          {Boolean(platformTip) && (
            <Container mt={2}>
              <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
                <Span fontSize="14px" lineHeight="20px" fontWeight="500">
                  <FormattedMessage
                    id="withColon"
                    defaultMessage="{item}:"
                    values={{
                      item: (
                        <FormattedMessage
                          defaultMessage="{service} platform tip"
                          values={{ service: 'Open Collective' }}
                        />
                      ),
                    }}
                  />
                </Span>
                <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
                  <FormattedMoneyAmount amount={platformTip} currency={currency} precision={2} amountStyles={null} />
                </Box>
              </Flex>
            </Container>
          )}
          <StyledHr borderStyle="dashed" mt="16px" mb="16px" />
          <Container>
            {Boolean(paymentProcessorFee) && (
              <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
                <Span fontSize="12px" lineHeight="20px" fontWeight="500">
                  <FormattedMessage
                    id="withColon"
                    defaultMessage="{item}:"
                    values={{ item: <FormattedMessage defaultMessage="Payment Processor Fee" /> }}
                  />
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
            )}
            {Boolean(taxAmount) && (
              <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
                <Span fontSize="12px" lineHeight="20px" fontWeight="500">
                  {i18nTaxType(intl, order.tax?.type || applicableTax, 'full')}
                </Span>
                <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
                  <FormattedMoneyAmount amount={taxAmount} currency={currency} precision={2} amountStyles={null} />
                </Box>
              </Flex>
            )}
            {Boolean(hostFee) && (
              <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
                <Span fontSize="12px" lineHeight="20px" fontWeight="500">
                  <FormattedMessage
                    id="withColon"
                    defaultMessage="{item}:"
                    values={{ item: <FormattedMessage defaultMessage="Host Fee" /> }}
                  />
                </Span>
                <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
                  <FormattedMoneyAmount amount={hostFee} currency={currency} precision={2} amountStyles={null} />
                </Box>
              </Flex>
            )}
            <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
              <Span fontSize="12px" lineHeight="20px" fontWeight="500">
                <FormattedMessage
                  id="withColon"
                  defaultMessage="{item}:"
                  values={{
                    item: (
                      <FormattedMessage
                        defaultMessage="Net Amount for {collective}"
                        values={{ collective: order.toAccount.name }}
                      />
                    ),
                  }}
                />
              </Span>
              <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
                <FormattedMoneyAmount amount={netAmount} currency={currency} precision={2} amountStyles={null} />
              </Box>
            </Flex>
          </Container>
        </ModalBody>
        <ModalFooter isFullWidth>
          <Container display="flex" justifyContent={['center', 'flex-end']} flexWrap="wrap">
            <StyledButton
              buttonStyle="secondary"
              onClick={onClose}
              mr={[0, '16px']}
              mb={['16px', 0]}
              minWidth={['268px', 0]}
              type="button"
            >
              <FormattedMessage id="actions.cancel" defaultMessage="Cancel" />
            </StyledButton>
            <StyledButton
              minWidth={240}
              buttonStyle="primary"
              loading={submitting}
              type="submit"
              data-cy="order-confirmation-modal-submit"
            >
              <FormattedMessage defaultMessage="Confirm contribution" />
            </StyledButton>
          </Container>
        </ModalFooter>
      </form>
    </StyledModal>
  );
};

ContributionConfirmationModal.propTypes = {
  /** the order that is being confirmed */
  order: PropTypes.object,
  /** handles how the modal is closed */
  onClose: PropTypes.func.isRequired,
  /** Called if the action request is successful */
  onSuccess: PropTypes.func,
};

export default ContributionConfirmationModal;
