import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/boxicons-regular/Check';
import { useFormik } from 'formik';
import { FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { border, color, space, typography } from 'styled-system';

import { default as hasFeature, FEATURES } from '../../lib/allowed-features';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { createError, ERROR } from '../../lib/errors';
import i18nPayoutMethodType from '../../lib/i18n/payout-method-type';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledButtonSet from '../StyledButtonSet';
import StyledCheckbox from '../StyledCheckbox';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalHeader } from '../StyledModal';
import { H4, P, Span } from '../Text';
import { withUser } from '../UserProvider';

import PayoutMethodData from './PayoutMethodData';
import PayoutMethodTypeWithIcon from './PayoutMethodTypeWithIcon';

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
      hasFeature(host, FEATURES.PAYPAL_PAYOUTS) &&
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

const getTotalPayoutAmount = (expenseAmount, { paymentProcessorFee, feesPayer }) => {
  if (feesPayer === 'PAYEE') {
    return expenseAmount;
  } else {
    return expenseAmount + (paymentProcessorFee || 0);
  }
};

const canCustomizeFeesPayer = payoutMethodType => {
  return [PayoutMethodType.BANK_ACCOUNT].includes(payoutMethodType);
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

/**
 * Modal displayed by `PayExpenseButton` to trigger the actual payment of an expense
 */
const PayExpenseModal = ({ onClose, onSubmit, expense, collective, host, error }) => {
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

  return (
    <StyledModal
      show
      onClose={onClose}
      width="100%"
      minWidth={280}
      maxWidth={334}
      data-cy="pay-expense-modal"
      trapFocus
    >
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
        {canCustomizeFeesPayer(payoutMethodType) && (
          <Flex mt={16}>
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
                amount={expense.amount}
                currency={expense.currency}
              />
            </Amount>
          </AmountLine>
          {formik.values.paymentProcessorFee !== null && (
            <AmountLine borderTop="0.8px dashed #9D9FA3">
              <Label>
                <FormattedMessage id="PayExpense.ProcessorFeesInput" defaultMessage="Payment processor fees" />
              </Label>
              <Amount>
                <FormattedMoneyAmount
                  showCurrencyCode={false}
                  amount={formik.values.paymentProcessorFee}
                  currency={expense.currency}
                  amountStyles={{
                    fontWeight: formik.values.paymentProcessorFee ? 500 : 400,
                    color: formik.values.paymentProcessorFee ? 'black.900' : 'black.400',
                  }}
                />
              </Amount>
            </AmountLine>
          )}
          <AmountLine borderTop="1px solid #4E5052" pt={11}>
            <Label color="black.900" fontWeight="500">
              {formik.values.paymentProcessorFee !== null ? (
                <FormattedMessage id="TotalAmount" defaultMessage="Total amount" />
              ) : (
                <FormattedMessage id="TotalAmountWithoutFee" defaultMessage="Total amount (without fees)" />
              )}
            </Label>
            <Amount>
              <FormattedMoneyAmount
                amount={getTotalPayoutAmount(expense.amount, formik.values)}
                currency={expense.currency}
                currencyCodeStyles={{ color: 'black.500' }}
              />
            </Amount>
          </AmountLine>
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
    currency: PropTypes.string,
    feesPayer: PropTypes.string,
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
