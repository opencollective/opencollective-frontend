import React from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@apollo/client';
import { Check } from '@styled-icons/boxicons-regular/Check';
import { useFormik } from 'formik';
import { get, isNumber, round } from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { border, color, space, typography } from 'styled-system';

import { default as hasFeature, FEATURES } from '../../lib/allowed-features';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { createError, ERROR } from '../../lib/errors';
import { API_V2_CONTEXT, gqlV2 } from '../../lib/graphql/helpers';
import i18nPayoutMethodType from '../../lib/i18n/payout-method-type';
import { i18nTaxType } from '../../lib/i18n/taxes';
import { AmountPropTypeShape } from '../../lib/prop-types';
import { getAmountWithoutTaxes, getTaxAmount } from './lib/utils';

import AmountWithExchangeRateInfo from '../AmountWithExchangeRateInfo';
import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import LoadingPlaceholder from '../LoadingPlaceholder';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledButtonSet from '../StyledButtonSet';
import StyledCheckbox from '../StyledCheckbox';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalHeader } from '../StyledModal';
import StyledTooltip from '../StyledTooltip';
import { H4, P, Span } from '../Text';
import { withUser } from '../UserProvider';

import PayoutMethodData from './PayoutMethodData';
import PayoutMethodTypeWithIcon from './PayoutMethodTypeWithIcon';

const quoteExpenseQuery = gqlV2/* GraphQL */ `
  query QuoteExpenseQuery($id: String!) {
    expense(expense: { id: $id }) {
      id
      currency
      amountInHostCurrency: amountV2(currencySource: HOST) {
        exchangeRate {
          value
        }
      }
      quote {
        paymentProcessorFeeAmount {
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

const getPayoutOptionValue = (payoutMethodType, isAuto, host) => {
  if (payoutMethodType === PayoutMethodType.OTHER) {
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
  paymentProcessorFee: null,
  twoFactorAuthenticatorCode: null,
  feesPayer: 'COLLECTIVE',
});

const validate = values => {
  const errors = {};
  if (isNaN(values.paymentProcessorFee)) {
    errors.paymentProcessorFee = createError(ERROR.FORM_FIELD_PATTERN);
  }
  return errors;
};

const getTotalPayoutAmount = (expense, { paymentProcessorFee, feesPayer }) => {
  if (feesPayer === 'PAYEE') {
    return expense.amount;
  } else {
    return expense.amount + (paymentProcessorFee?.valueInCents || 0);
  }
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

const getInitialValues = (expense, host, payoutMethodType) => {
  return {
    ...DEFAULT_VALUES,
    ...getPayoutOptionValue(payoutMethodType, true, host),
    feesPayer: expense.feesPayer || DEFAULT_VALUES.feesPayer,
  };
};

const getPaymentProcessorFee = (formik, expense, quoteQuery) => {
  if (formik.values.forceManual) {
    const fxRate = expense.amountInAccountCurrency?.exchangeRate?.value || 1;
    return {
      valueInCents: Math.round(formik.values.paymentProcessorFee * fxRate),
      currency: expense.currency,
    };
  } else if (quoteQuery?.data?.expense?.quote) {
    const { quote, amountInHostCurrency } = quoteQuery.data.expense;
    if (quote.paymentProcessorFeeAmount.currency === expense.currency) {
      return quote.paymentProcessorFeeAmount;
    } else if (amountInHostCurrency.exchangeRate) {
      return {
        currency: expense.currency,
        valueInCents: quote.paymentProcessorFeeAmount.valueInCents / amountInHostCurrency.exchangeRate.value,
      };
    }
  }
};

/**
 * Modal displayed by `PayExpenseButton` to trigger the actual payment of an expense
 */
const PayExpenseModal = ({ onClose, onSubmit, expense, collective, host, error, LoggedInUser }) => {
  const intl = useIntl();
  const payoutMethodType = expense.payoutMethod?.type || PayoutMethodType.OTHER;
  const initialValues = getInitialValues(expense, host, payoutMethodType);
  const formik = useFormik({ initialValues, validate, onSubmit });
  const hasManualPayment = payoutMethodType === PayoutMethodType.OTHER || formik.values.forceManual;
  const payoutMethodLabel = getPayoutLabel(intl, payoutMethodType);
  const hasBankInfoWithoutWise = payoutMethodType === PayoutMethodType.BANK_ACCOUNT && host.transferwise === null;
  const isScheduling = formik.values.action === 'SCHEDULE_FOR_PAYMENT';
  const hasAutomaticManualPicker = ![PayoutMethodType.OTHER, PayoutMethodType.ACCOUNT_BALANCE].includes(
    payoutMethodType,
  );
  const canQuote =
    host.transferwise && payoutMethodType === PayoutMethodType.BANK_ACCOUNT && formik.values.feesPayer !== 'PAYEE';
  const quoteQuery = useQuery(quoteExpenseQuery, {
    variables: { id: expense.id },
    context: API_V2_CONTEXT,
    skip: !canQuote,
  });

  const paymentProcessorFee = getPaymentProcessorFee(formik, expense, quoteQuery);
  const isMultiCurrency =
    expense?.amountInAccountCurrency && expense.amountInAccountCurrency.currency !== expense.currency;
  const totalAmount = getTotalPayoutAmount(expense, { paymentProcessorFee, feesPayer: formik.values.feesPayer });
  const amountWithoutTaxes = getAmountWithoutTaxes(expense.amount, expense.taxes);

  return (
    <StyledModal onClose={onClose} width="100%" minWidth={280} maxWidth={334} data-cy="pay-expense-modal" trapFocus>
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
                paymentProcessorFee: null,
                feesPayer: !getCanCustomizeFeesPayer(expense, collective, hasManualPayment, null, LoggedInUser.isRoot())
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
          <StyledInputField
            name="paymentProcessorFee"
            htmlFor="payExpensePaymentProcessorFee"
            inputType="number"
            error={formik.errors.paymentProcessorFee}
            required={false}
            mt={24}
            label={<FormattedMessage id="PayExpense.ProcessorFeesInput" defaultMessage="Payment processor fees" />}
          >
            {inputProps => (
              <StyledInputAmount
                {...inputProps}
                currency={collective.currency}
                currencyDisplay="FULL"
                value={formik.values.paymentProcessorFee}
                placeholder="0.00"
                min={0}
                max={100000000}
                onChange={value => formik.setFieldValue('paymentProcessorFee', value)}
              />
            )}
          </StyledInputField>
        )}
        {getCanCustomizeFeesPayer(
          expense,
          collective,
          hasManualPayment,
          formik.values.paymentProcessorFee,
          LoggedInUser.isRoot(),
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
                showCurrencyCode={false}
                amount={amountWithoutTaxes}
                currency={expense.currency}
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
          {canQuote && quoteQuery.loading && (
            <AmountLine borderTop="0.8px dashed #9D9FA3">
              <Label>
                <FormattedMessage id="PayExpense.ProcessorFeesInput" defaultMessage="Payment processor fees" />
              </Label>
              <Amount>
                <LoadingPlaceholder height="16px" />
              </Amount>
            </AmountLine>
          )}
          {isNumber(paymentProcessorFee?.valueInCents) && (
            <AmountLine borderTop="0.8px dashed #9D9FA3">
              <Label>
                <FormattedMessage id="PayExpense.ProcessorFeesInput" defaultMessage="Payment processor fees" />
              </Label>
              <Amount>
                <FormattedMoneyAmount
                  showCurrencyCode={false}
                  amount={paymentProcessorFee.valueInCents}
                  currency={paymentProcessorFee.currency}
                  amountStyles={{
                    fontWeight: paymentProcessorFee ? 500 : 400,
                    color: paymentProcessorFee ? 'black.900' : 'black.400',
                  }}
                />
              </Amount>
            </AmountLine>
          )}
          <AmountLine borderTop="1px solid #4E5052" pt={11}>
            <Label color="black.900" fontWeight="500">
              {paymentProcessorFee !== null ? (
                <FormattedMessage id="TotalAmount" defaultMessage="Total amount" />
              ) : (
                <FormattedMessage id="TotalAmountWithoutFee" defaultMessage="Total amount (without fees)" />
              )}
            </Label>
            <Amount>
              <FormattedMoneyAmount
                amount={totalAmount}
                currency={expense.currency}
                currencyCodeStyles={{ color: 'black.500' }}
              />
            </Amount>
          </AmountLine>
          {isMultiCurrency && expense.amountInAccountCurrency?.exchangeRate?.value && (
            <AmountLine py={0}>
              <Label color="black.600" fontWeight="500">
                <FormattedMessage defaultMessage="Accounted as" />
              </Label>
              <Flex>
                <Container mr={1} color="black.500" letterSpacing="-0.4px">
                  {expense.amountInAccountCurrency.currency}
                </Container>
                <Container color="black.600">
                  <AmountWithExchangeRateInfo
                    showCurrencyCode={false}
                    amount={{
                      valueInCents: Math.round(totalAmount * expense.amountInAccountCurrency.exchangeRate.value),
                      currency: expense.currency,
                      exchangeRate: expense.amountInAccountCurrency.exchangeRate,
                    }}
                  />
                </Container>
              </Flex>
            </AmountLine>
          )}
        </Box>
        {Boolean(error?.message?.startsWith('Two-factor authentication')) && (
          <StyledInputField
            name="twoFactorAuthenticatorCode"
            htmlFor="twoFactorAuthenticatorCode"
            label={
              <FormattedMessage
                id="PayExpenseModal.TwoFactorAuthCode"
                defaultMessage="Two-factor authentication code"
              />
            }
            value={formik.values.twoFactorAuthenticatorCode}
            mt={2}
            mb={3}
          >
            {inputProps => (
              <StyledInput
                {...inputProps}
                minHeight={50}
                fontSize="20px"
                placeholder="123456"
                pattern="[0-9]{6}"
                inputMode="numeric"
                autoFocus
                onChange={e => {
                  formik.setFieldValue('twoFactorAuthenticatorCode', e.target.value);
                }}
              />
            )}
          </StyledInputField>
        )}
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
        <Flex flexWrap="wrap" justifyContent="space-evenly">
          <StyledButton
            buttonStyle="success"
            width="100%"
            m={1}
            type="submit"
            loading={formik.isSubmitting}
            data-cy="mark-as-paid-button"
            disabled={quoteQuery.loading}
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
