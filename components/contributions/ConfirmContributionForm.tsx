import React, { Fragment, useState } from 'react';
import { gql, useMutation } from '@apollo/client';
import { accountHasGST, accountHasVAT, TaxType } from '@opencollective/taxes';
import { InfoCircle } from '@styled-icons/boxicons-regular/InfoCircle';
import { omit, pick } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';

import { getCurrentLocalDateStr } from '../../lib/date-utils';
import { i18nGraphqlException } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import type { TaxInput } from '../../lib/graphql/types/v2/schema';
import { i18nTaxType } from '../../lib/i18n/taxes';
import type { ConfirmContributionFieldsFragment } from '@/lib/graphql/types/v2/graphql';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import StyledHr from '../StyledHr';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputPercentage from '../StyledInputPercentage';
import StyledTooltip from '../StyledTooltip';
import { Label, P, Span } from '../Text';
import { useToast } from '../ui/useToast';

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

export const ConfirmContributionForm = ({
  order,
  onSubmit,
  onSuccess,
  onFailure,
  footer = null,
  FormBodyContainer = Fragment,
  initialValues = {},
}: {
  onSubmit: () => void;
  onSuccess: () => void;
  onFailure: () => void;
  footer?: React.ReactNode;
  FormBodyContainer?: React.ComponentType<{ children: React.ReactNode }>;
  initialValues?: { amountReceived?: number; processedAt?: string; transactionsImportRow?: { id: string } };
  order: ConfirmContributionFieldsFragment;
}) => {
  const defaultHostFeePercent = order.hostFeePercent ?? order.toAccount['bankTransfersHostFeePercent'] ?? 0;
  const defaultTaxPercent = order.tax?.rate * 100 || 0;
  const defaultPlatformTip = order.platformTipAmount?.valueInCents || 0;
  const amountInitiated = order.amount.valueInCents + defaultPlatformTip;
  const currency = order.amount.currency;
  const [amountReceived, setAmountReceived] = useState(initialValues['amountReceived'] ?? amountInitiated);
  const [platformTip, setPlatformTip] = useState(defaultPlatformTip);
  const [paymentProcessorFee, setPaymentProcessorFee] = useState(0);
  const [hostFeePercent, setHostFeePercent] = useState(defaultHostFeePercent);
  const [taxPercent, setTaxPercent] = useState(defaultTaxPercent);
  const [processedAt, setProcessedAt] = useState(initialValues['processedAt'] ?? getCurrentLocalDateStr());
  const intl = useIntl();
  const { toast } = useToast();
  const [confirmOrder, { loading: submitting }] = useMutation(confirmContributionMutation, { context: API_V2_CONTEXT });
  const contributionAmount = amountReceived - platformTip;
  const grossContributionAmount = Math.round(contributionAmount / (1 + taxPercent / 100));
  const taxAmount = taxPercent ? Math.round(contributionAmount - grossContributionAmount) : null;
  const hostFee = Math.round((contributionAmount - taxAmount) * hostFeePercent) / 100;
  const netAmount = contributionAmount - paymentProcessorFee - hostFee - taxAmount;
  const canAddHostFee = !order.toAccount['isHost'];
  const applicableTax = getApplicableTaxType(order.toAccount, order.toAccount['host']);

  return (
    <form
      onSubmit={async e => {
        e.preventDefault();

        // Prevent submitting the action if another one is being submitted at the same time
        if (submitting) {
          return;
        }

        onSubmit?.();
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
                transactionsImportRow: initialValues['transactionsImportRow']
                  ? pick(initialValues['transactionsImportRow'], 'id')
                  : null,
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
            message: intl.formatMessage({ defaultMessage: 'Contribution confirmed successfully', id: 'Khmjkh' }),
          });
          onSuccess?.();
        } catch (e) {
          onFailure?.();
          toast({ variant: 'error', message: i18nGraphqlException(intl, e) });
        }
      }}
    >
      <FormBodyContainer>
        <P mt={3} fontSize="13px">
          <FormattedMessage
            defaultMessage="Confirm the amount of funds you have received in your host account."
            id="o9RoEi"
          />
        </P>
        <Container mt={4}>
          <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
            <Span fontSize="14px" lineHeight="20px" fontWeight="700">
              <FormattedMessage
                defaultMessage="Amount initiated by {contributor}"
                id="aQgOGz"
                values={{ contributor: order.fromAccount.name }}
              />
            </Span>
            <Box fontSize="16px" lineHeight="24px" fontWeight="700" mt={['8px', 0]}>
              <FormattedMoneyAmount amount={amountInitiated} currency={currency} precision={2} />
            </Box>
          </Flex>
        </Container>
        <StyledHr borderStyle="solid" mt="16px" mb="16px" />
        <Container>
          <Flex justifyContent="space-between" alignItems={['left', 'center']} flexDirection={['column', 'row']}>
            <Label fontSize="14px" lineHeight="20px" fontWeight="400" htmlFor="confirmContribution-amountReceived">
              <FormattedMessage defaultMessage="Amount received" id="u6JRVj" />
            </Label>
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
              <FormattedMessage defaultMessage="Platform tip amount" id="Ng5BqM" />
            </Label>
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
                    id="Gsyrfa"
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
                <FormattedMessage defaultMessage="Effective Date" id="Gh3Obs" />
                {` `}
                <StyledTooltip
                  content={() => (
                    <FormattedMessage
                      defaultMessage="The date funds were cleared on your bank, Wise, PayPal, Stripe or any other external account holding these funds."
                      id="s3O6iq"
                    />
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
                      id="z2toxf"
                      values={{ collective: order.toAccount.name }}
                    />
                  ),
                }}
              />
            </Span>
            <Box fontSize="16px" lineHeight="24px" fontWeight="700" ml="16px">
              <FormattedMoneyAmount amount={contributionAmount} currency={currency} precision={2} />
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
                        id="t6u2MU"
                        values={{ service: 'Open Collective' }}
                      />
                    ),
                  }}
                />
              </Span>
              <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
                <FormattedMoneyAmount amount={platformTip} currency={currency} precision={2} />
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
                  values={{ item: <FormattedMessage defaultMessage="Payment Processor Fee" id="pzs6YY" /> }}
                />
              </Span>
              <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
                <FormattedMoneyAmount amount={paymentProcessorFee} currency={currency} precision={2} />
              </Box>
            </Flex>
          )}
          {Boolean(taxAmount) && (
            <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
              <Span fontSize="12px" lineHeight="20px" fontWeight="500">
                {i18nTaxType(intl, order.tax?.type || applicableTax, 'full')}
              </Span>
              <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
                <FormattedMoneyAmount amount={taxAmount} currency={currency} precision={2} />
              </Box>
            </Flex>
          )}
          {Boolean(hostFee) && (
            <Flex justifyContent={['center', 'right']} alignItems="center" flexWrap={['wrap', 'nowrap']}>
              <Span fontSize="12px" lineHeight="20px" fontWeight="500">
                <FormattedMessage
                  id="withColon"
                  defaultMessage="{item}:"
                  values={{ item: <FormattedMessage defaultMessage="Host Fee" id="NJsELs" /> }}
                />
              </Span>
              <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
                <FormattedMoneyAmount amount={hostFee} currency={currency} precision={2} />
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
                      id="DinF1w"
                      values={{ collective: order.toAccount.name }}
                    />
                  ),
                }}
              />
            </Span>
            <Box fontSize="14px" lineHeight="24px" fontWeight="700" ml="16px">
              <FormattedMoneyAmount amount={netAmount} currency={currency} precision={2} />
            </Box>
          </Flex>
        </Container>
      </FormBodyContainer>
      {footer}
    </form>
  );
};
