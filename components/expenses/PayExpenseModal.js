import React from 'react';
import PropTypes from 'prop-types';
import { gql, useQuery } from '@apollo/client';
import { Check } from '@styled-icons/boxicons-regular/Check';
import { useFormik } from 'formik';
import { cloneDeep, get, round } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { border, color, space, typography } from 'styled-system';

import { default as hasFeature, FEATURES } from '../../lib/allowed-features';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { formatCurrency } from '../../lib/currency-utils';
import { createError, ERROR } from '../../lib/errors';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import i18nPayoutMethodType from '../../lib/i18n/payout-method-type';
import { i18nTaxType } from '../../lib/i18n/taxes';
import { AmountPropTypeShape } from '../../lib/prop-types';
import { getAmountWithoutTaxes, getTaxAmount } from './lib/utils';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledButtonSet from '../StyledButtonSet';
import StyledCheckbox from '../StyledCheckbox';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalHeader } from '../StyledModal';
import StyledTooltip from '../StyledTooltip';
import { H4, P, Span } from '../Text';
import { withUser } from '../UserProvider';

import PayoutMethodData from './PayoutMethodData';
import PayoutMethodTypeWithIcon from './PayoutMethodTypeWithIcon';

const quoteExpenseQuery = gql`
  query QuoteExpenseQuery($id: String!) {
    expense(expense: { id: $id }) {
      id
      currency
      amountInHostCurrency: amountV2(currencySource: HOST) {
        exchangeRate {
          value
        }
      }
      host {
        id
        transferwise {
          id
          amountBatched {
            valueInCents
            currency
          }
          balances {
            valueInCents
            currency
          }
        }
      }
      quote {
        paymentProcessorFeeAmount {
          valueInCents
          currency
        }
        sourceAmount {
          valueInCents
          currency
        }
        estimatedDeliveryAt
      }
    }
  }
`;

const getPayoutLabel = (intl, type) => {
  return i18nPayoutMethodType(intl, type, { aliasBankAccountToTransferWise: true });
};

const getPayoutOptionValue = (payoutMethod, isAuto, host) => {
  const payoutMethodType = payoutMethod?.type || PayoutMethodType.OTHER;
  if (payoutMethodType === PayoutMethodType.OTHER) {
    return { forceManual: true, action: 'PAY' };
  }
  // TODO: remove this when we implement the missing Brazilian TRANSFER NATURE field.
  else if (payoutMethod?.data?.type === 'brazil') {
    return { forceManual: true, action: 'PAY' };
  } else if (payoutMethodType === PayoutMethodType.BANK_ACCOUNT && !host.transferwise) {
    return { forceManual: true, action: 'PAY' };
  } else if (!isAuto) {
    return { forceManual: true, action: 'PAY' };
  } else {
    const isPaypalPayouts =
      host.features[FEATURES.PAYPAL_PAYOUTS] === 'ACTIVE' &&
      payoutMethodType === PayoutMethodType.PAYPAL &&
      host.supportedPayoutMethods?.includes(PayoutMethodType.PAYPAL);
    const isWiseOTT =
      payoutMethodType === PayoutMethodType.BANK_ACCOUNT &&
      host.supportedPayoutMethods?.includes(PayoutMethodType.BANK_ACCOUNT) &&
      hasFeature(host, FEATURES.TRANSFERWISE_OTT);
    return {
      forceManual: false,
      action: isPaypalPayouts || isWiseOTT ? 'SCHEDULE_FOR_PAYMENT' : 'PAY',
    };
  }
};

const DEFAULT_VALUES = Object.freeze({
  paymentProcessorFeeInHostCurrency: null,
  totalAmountPaidInHostCurrency: null,
  feesPayer: 'COLLECTIVE',
});

const validate = values => {
  const errors = {};
  if (isNaN(values.paymentProcessorFeeInHostCurrency)) {
    errors.paymentProcessorFeeInHostCurrency = createError(ERROR.FORM_FIELD_PATTERN);
  }
  if (isNaN(values.totalAmountPaidInHostCurrency)) {
    errors.totalAmountPaidInHostCurrency = createError(ERROR.FORM_FIELD_PATTERN);
  }
  return errors;
};

const getCanCustomizeFeesPayer = (expense, collective, isManualPayment, feeAmount, isRoot) => {
  const supportedPayoutMethods = [PayoutMethodType.BANK_ACCOUNT, PayoutMethodType.OTHER];
  const isSupportedPayoutMethod = supportedPayoutMethods.includes(expense.payoutMethod?.type);
  const isFullBalance = expense.amount === get(collective, 'stats.balanceWithBlockedFunds.valueInCents');
  const isSameCurrency = expense.currency === collective?.currency;

  // Current limitations:
  // - Only for transferwise and manual payouts
  // - Only when emptying the account balance (unless root user)
  // - Only with expenses submitted in the same currency as the collective
  if (!(isSupportedPayoutMethod && isSameCurrency && (isFullBalance || isRoot))) {
    return false;
  }

  // We should only show the checkbox if there may actually be fees on the payout:
  // - When the payment is manual, we only show the checkbox if a fee is set by the user
  // - If it's an automatic payment then we can't predict the fees, so in doubt we show the checkbox
  return !isManualPayment || Boolean(feeAmount);
};

const AmountLine = styled.div`
  display: flex;
  justify-content: space-between;
  font-weight: 400;
  padding: 9px 0;
  font-weight: 400;
  line-height: 18px;
  letter-spacing: 0em;

  ${border}
  ${space}
`;

const Label = styled(Span)`
  margin-right: 4px;
  flex: 0 1 70%;
  margin-right: 8px;
  line-height: 18px;
  word-break: break-word;
  color: #4e5052;
  ${color}
  ${typography}
  font-size: 12px;
`;

const Amount = styled.span`
  flex: 1 1 30%;
  text-align: right;
  font-size: 14px;
  white-space: nowrap;
  display: flex;
  flex-direction: row-reverse;
  & > * {
    margin-left: 4px;
  }
`;

const SectionLabel = styled.p`
  font-size: 9px;
  font-weight: 500;
  color: #4e5052;
  margin: 5px 0;
  text-transform: uppercase;
`;

const getInitialValues = (expense, host) => {
  return {
    ...DEFAULT_VALUES,
    ...getPayoutOptionValue(expense.payoutMethod, true, host),
    feesPayer: expense.feesPayer || DEFAULT_VALUES.feesPayer,
    totalAmountPaidInHostCurrency: expense.currency === host.currency ? expense.amount : null,
  };
};

const calculateAmounts = ({ formik, expense, quote, host, feesPayer }) => {
  if (formik.values.forceManual) {
    const totalAmount = { valueInCents: formik.values.totalAmountPaidInHostCurrency, currency: host.currency };
    const paymentProcessorFee = {
      valueInCents: formik.values.paymentProcessorFeeInHostCurrency,
      currency: host.currency,
    };
    const grossAmount = totalAmount.valueInCents - (paymentProcessorFee.valueInCents || 0);
    const effectiveRate = expense.currency !== host.currency && grossAmount / expense.amount;
    return { paymentProcessorFee, totalAmount, effectiveRate };
  } else if (quote) {
    const effectiveRate = expense.currency !== host.currency && quote.sourceAmount.valueInCents / expense.amount;
    const totalAmount = cloneDeep(quote.sourceAmount);
    if (feesPayer === 'PAYEE') {
      totalAmount.valueInCents -= quote.paymentProcessorFeeAmount.valueInCents;
    }
    return { paymentProcessorFee: quote.paymentProcessorFeeAmount, totalAmount, effectiveRate };
  } else {
    return {};
  }
};

/**
 * Modal displayed by `PayExpenseButton` to trigger the actual payment of an expense
 */
const PayExpenseModal = ({ onClose, onSubmit, expense, collective, host, error, LoggedInUser }) => {
  const intl = useIntl();
  const payoutMethodType = expense.payoutMethod?.type || PayoutMethodType.OTHER;
  const initialValues = getInitialValues(expense, host);
  const formik = useFormik({ initialValues, validate, onSubmit });
  const hasManualPayment = payoutMethodType === PayoutMethodType.OTHER || formik.values.forceManual;
  const payoutMethodLabel = getPayoutLabel(intl, payoutMethodType);
  const hasBankInfoWithoutWise = payoutMethodType === PayoutMethodType.BANK_ACCOUNT && host.transferwise === null;
  const isScheduling = formik.values.action === 'SCHEDULE_FOR_PAYMENT';
  const hasAutomaticManualPicker = ![PayoutMethodType.OTHER, PayoutMethodType.ACCOUNT_BALANCE].includes(
    payoutMethodType,
  );

  const canQuote = host.transferwise && payoutMethodType === PayoutMethodType.BANK_ACCOUNT;
  const quoteQuery = useQuery(quoteExpenseQuery, {
    variables: { id: expense.id },
    context: API_V2_CONTEXT,
    skip: !canQuote,
  });

  const amountWithoutTaxes = getAmountWithoutTaxes(expense.amount, expense.taxes);

  const amounts = calculateAmounts({
    formik,
    expense,
    quote: quoteQuery?.data?.expense?.quote,
    collective,
    host,
    feesPayer: formik.values.feesPayer,
  });

  const amountBatched = quoteQuery.data?.expense.host?.transferwise.amountBatched;
  const amountInBalance = quoteQuery.data?.expense.host?.transferwise.balances.find(
    balance => balance.currency === amountBatched?.currency,
  );
  const hasFunds =
    canQuote &&
    amountInBalance &&
    amountBatched &&
    amountInBalance.valueInCents >= amountBatched.valueInCents + amounts.totalAmount?.valueInCents;

  return (
    <StyledModal onClose={onClose} width="100%" minWidth={280} maxWidth={400} data-cy="pay-expense-modal" trapFocus>
      <ModalHeader>
        <H4 fontSize="20px" fontWeight="700">
          <FormattedMessage id="PayExpenseTitle" defaultMessage="Pay expense" />
        </H4>
      </ModalHeader>
      <ModalBody as="form" mb={0} onSubmit={formik.handleSubmit}>
        <SectionLabel>
          <FormattedMessage id="ExpenseForm.PayoutOptionLabel" defaultMessage="Payout method" />
        </SectionLabel>
        <Box mb={2}>
          <PayoutMethodTypeWithIcon type={payoutMethodType} />
        </Box>
        <PayoutMethodData payoutMethod={expense.payoutMethod} showLabel={false} />
        {hasAutomaticManualPicker && !hasBankInfoWithoutWise && (
          <StyledButtonSet
            items={['AUTO', 'MANUAL']}
            buttonProps={{ width: '50%' }}
            buttonPropsBuilder={({ item }) => ({ 'data-cy': `pay-type-${item}` })}
            mt={3}
            selected={formik.values.forceManual ? 'MANUAL' : 'AUTO'}
            customBorderRadius="6px"
            onChange={item => {
              formik.setValues({
                ...formik.values,
                ...getPayoutOptionValue(payoutMethodType, item === 'AUTO', host),
                paymentProcessorFeeInHostCurrency: null,
                totalAmountPaidInHostCurrency: expense.currency === host.currency ? expense.amount : null,
                feesPayer: !getCanCustomizeFeesPayer(expense, collective, hasManualPayment, null, LoggedInUser.isRoot)
                  ? DEFAULT_VALUES.feesPayer // Reset fees payer if can't customize
                  : formik.values.feesPayer,
              });
            }}
          >
            {({ item }) =>
              item === 'AUTO' ? (
                <FormattedMessage id="Payout.Automatic" defaultMessage="Automatic" />
              ) : (
                <FormattedMessage id="Payout.Manual" defaultMessage="Manual" />
              )
            }
          </StyledButtonSet>
        )}
        {hasManualPayment && (
          <React.Fragment>
            <StyledInputField
              name="totalAmountPaidInHostCurrency"
              htmlFor="totalAmountPaidInHostCurrency"
              inputType="number"
              error={formik.errors.totalAmountPaidInHostCurrency}
              required
              mt={3}
              label={
                <FormattedMessage
                  id="PayExpense.totalAmountPaidInHostCurrency.Input"
                  defaultMessage="Total amount paid"
                />
              }
              hint={
                <FormattedMessage
                  id="PayExpense.totalAmountPaidInHostCurrency.Hint"
                  defaultMessage="The total amount debited from your account."
                />
              }
            >
              {inputProps => (
                <StyledInputAmount
                  {...inputProps}
                  currency={host.currency}
                  currencyDisplay="FULL"
                  value={formik.values.totalAmountPaidInHostCurrency}
                  data-cy="total-amount-paid"
                  placeholder="0.00"
                  maxWidth="100%"
                  min={1}
                  onChange={value => formik.setFieldValue('totalAmountPaidInHostCurrency', value)}
                />
              )}
            </StyledInputField>
            <StyledInputField
              name="paymentProcessorFeeInHostCurrency"
              htmlFor="paymentProcessorFeeInHostCurrency"
              inputType="number"
              error={formik.errors.paymentProcessorFeeInHostCurrency}
              required={false}
              mt={3}
              label={<FormattedMessage id="PayExpense.ProcessorFeesInput" defaultMessage="Payment processor fees" />}
              hint={
                <FormattedMessage
                  id="PayExpense.paymentProcessorFeeInHostCurrency.Hint"
                  defaultMessage="Amount in fees, included in the total amount paid."
                />
              }
            >
              {inputProps => (
                <StyledInputAmount
                  {...inputProps}
                  currency={host.currency}
                  currencyDisplay="FULL"
                  value={formik.values.paymentProcessorFeeInHostCurrency}
                  placeholder="0.00"
                  maxWidth="100%"
                  min={0}
                  max={formik.values.totalAmountPaidInHostCurrency || 100000000}
                  onChange={value => formik.setFieldValue('paymentProcessorFeeInHostCurrency', value)}
                />
              )}
            </StyledInputField>
          </React.Fragment>
        )}
        {getCanCustomizeFeesPayer(
          expense,
          collective,
          hasManualPayment,
          formik.values.paymentProcessorFeeInHostCurrency,
          LoggedInUser.isRoot,
        ) && (
          <Flex mt={16}>
            <StyledTooltip
              content={
                <FormattedMessage defaultMessage="Check this box to have the payee cover the cost of payment processor fees (useful to zero balance)" />
              }
            >
              <StyledCheckbox
                name="feesPayer"
                checked={formik.values.feesPayer === 'PAYEE'}
                onChange={({ checked }) => formik.setFieldValue('feesPayer', checked ? 'PAYEE' : 'COLLECTIVE')}
                label={
                  <Span fontSize="12px">
                    <FormattedMessage defaultMessage="The payee is covering the fees" />
                  </Span>
                }
              />
            </StyledTooltip>
          </Flex>
        )}
        <Box mt={19} mb={3}>
          <SectionLabel>
            <FormattedMessage id="PaymentBreakdown" defaultMessage="Payment breakdown" />
          </SectionLabel>
          <AmountLine>
            <Label>
              <FormattedMessage id="ExpenseAmount" defaultMessage="Expense amount" />
            </Label>
            <Amount>
              <FormattedMoneyAmount
                amountStyles={{ fontWeight: 500 }}
                amount={amountWithoutTaxes}
                currency={expense.currency}
                currencyCodeStyles={{ color: 'black.500' }}
              />
            </Amount>
          </AmountLine>
          {expense.taxes?.map(tax => (
            <AmountLine key={tax.type} data-cy={`tax-${tax.type}-expense-amount-line`} pt={0}>
              <Label>
                {i18nTaxType(intl, tax.type, 'short')} ({round(tax.rate * 100, 2) || 0}%)
              </Label>
              &nbsp;
              <Amount>
                <FormattedMoneyAmount
                  amount={getTaxAmount(amountWithoutTaxes, tax)}
                  precision={2}
                  currency={expense.currency}
                  amountStyles={{ fontWeight: 500 }}
                  showCurrencyCode={false}
                />
              </Amount>
            </AmountLine>
          ))}
          {amounts.paymentProcessorFee && (
            <AmountLine borderTop="0.8px dashed #9D9FA3">
              <Label>
                <FormattedMessage id="PayExpense.ProcessorFeesInput" defaultMessage="Payment processor fees" />
              </Label>
              <Amount>
                {quoteQuery.loading ? (
                  <LoadingPlaceholder height="16px" />
                ) : (
                  <FormattedMoneyAmount
                    amount={amounts.paymentProcessorFee?.valueInCents}
                    currency={amounts.paymentProcessorFee?.currency}
                    currencyCodeStyles={{ color: 'black.500' }}
                    amountStyles={{
                      fontWeight: amounts.paymentProcessorFee ? 500 : 400,
                      color: amounts.paymentProcessorFee ? 'black.900' : 'black.400',
                    }}
                  />
                )}
              </Amount>
            </AmountLine>
          )}
          <AmountLine borderTop="1px solid #4E5052" pt={11}>
            <Label color="black.900" fontWeight="600">
              {amounts.paymentProcessorFee !== null ? (
                <FormattedMessage id="TotalAmount" defaultMessage="Total amount" />
              ) : (
                <FormattedMessage id="TotalAmountWithoutFee" defaultMessage="Total amount (without fees)" />
              )}
            </Label>
            <Amount>
              {quoteQuery.loading ? (
                <LoadingPlaceholder height="16px" />
              ) : (
                <FormattedMoneyAmount
                  amount={amounts.totalAmount?.valueInCents}
                  currency={amounts.totalAmount?.currency}
                  currencyCodeStyles={{ color: 'black.500' }}
                />
              )}
            </Amount>
          </AmountLine>
          {amounts?.effectiveRate ? (
            <AmountLine py={0}>
              <Label color="black.600" fontWeight="500">
                <FormattedMessage defaultMessage="Currency exchange rate" />
              </Label>
              <P fontSize="13px" color="black.600" whiteSpace="nowrap">
                ~ {expense.currency} 1 = {amounts.totalAmount?.currency} {round(amounts.effectiveRate, 5)}
              </P>
            </AmountLine>
          ) : null}
        </Box>
        {!error && formik.values.forceManual && payoutMethodType !== PayoutMethodType.OTHER && (
          <MessageBox type="warning" withIcon my={3} fontSize="12px">
            <strong>
              <FormattedMessage id="Warning.Important" defaultMessage="Important" />
            </strong>
            <br />
            <P mt={2} fontSize="12px" lineHeight="18px">
              <FormattedMessage
                id="PayExpenseModal.ManualPayoutWarning"
                defaultMessage="By clicking below, you acknowledge that this expense has already been paid {payoutMethod}."
                values={{ payoutMethod: hasBankInfoWithoutWise ? 'manually' : `via ${payoutMethodLabel}` }}
              />
            </P>
          </MessageBox>
        )}
        {canQuote && hasFunds === false && (
          <MessageBox type="error" withIcon my={3} fontSize="12px">
            <strong>
              <FormattedMessage id="Warning.NotEnoughFunds" defaultMessage="Not Enough Funds" />
            </strong>
            <br />
            <P mt={2} fontSize="12px" lineHeight="18px">
              <FormattedMessage
                id="PayExpenseModal.NotEnoughFundsOnWise"
                defaultMessage="Your Wise {currency} account has insufficient balance to cover the existing batch plus this expense amount. You need {totalNeeded} and you currently only have {available}.
Please add funds to your Wise {currency} account."
                values={{
                  currency: amountInBalance.currency,
                  totalNeeded: formatCurrency(
                    amountBatched.valueInCents + amounts.totalAmount.valueInCents,
                    amountBatched.currency,
                  ),
                  available: formatCurrency(amountInBalance.valueInCents, amountInBalance.currency),
                }}
              />
            </P>
          </MessageBox>
        )}
        <Flex flexWrap="wrap" justifyContent="space-evenly">
          <StyledButton
            buttonStyle="success"
            width="100%"
            m={1}
            type="submit"
            loading={formik.isSubmitting}
            data-cy="mark-as-paid-button"
            disabled={quoteQuery.loading || (canQuote && hasFunds === false)}
          >
            {hasManualPayment ? (
              <React.Fragment>
                <Check size="1.5em" />
                <Span css={{ verticalAlign: 'middle' }} ml={1}>
                  <FormattedMessage id="expense.markAsPaid" defaultMessage="Mark as paid" />
                </Span>
              </React.Fragment>
            ) : isScheduling ? (
              <FormattedMessage
                id="expense.schedule.btn"
                defaultMessage="Schedule to Pay with {paymentMethod}"
                values={{ paymentMethod: payoutMethodLabel }}
              />
            ) : (
              <FormattedMessage
                id="expense.pay.btn"
                defaultMessage="Pay with {paymentMethod}"
                values={{ paymentMethod: payoutMethodLabel }}
              />
            )}
          </StyledButton>
        </Flex>
      </ModalBody>
    </StyledModal>
  );
};

PayExpenseModal.propTypes = {
  expense: PropTypes.shape({
    id: PropTypes.string,
    legacyId: PropTypes.number,
    amount: PropTypes.number,
    amountInAccountCurrency: AmountPropTypeShape,
    currency: PropTypes.string,
    feesPayer: PropTypes.string,
    taxes: PropTypes.array,
    payoutMethod: PropTypes.shape({
      type: PropTypes.oneOf(Object.values(PayoutMethodType)),
    }),
  }).isRequired,
  collective: PropTypes.shape({
    balance: PropTypes.number,
    currency: PropTypes.string,
  }).isRequired,
  host: PropTypes.shape({
    plan: PropTypes.object,
    slug: PropTypes.string,
    currency: PropTypes.string,
    transferwise: PropTypes.object,
  }),
  onClose: PropTypes.func.isRequired,
  /** Function called when users click on one of the "Pay" buttons */
  onSubmit: PropTypes.func.isRequired,
  /** If set, will be displayed in the pay modal */
  error: PropTypes.object,
  /** From withUser */
  LoggedInUser: PropTypes.object,
};

export default withUser(PayExpenseModal);
