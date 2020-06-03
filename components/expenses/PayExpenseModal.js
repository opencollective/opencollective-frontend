import React from 'react';
import PropTypes from 'prop-types';
import { useFormik } from 'formik';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';

import { default as hasFeature, FEATURES } from '../../lib/allowed-features';
import { CurrencyPrecision } from '../../lib/constants/currency-precision';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { createError, ERROR } from '../../lib/errors';
import i18nPayoutMethodType from '../../lib/i18n-payout-method-type';

import Container from '../Container';
import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Flex } from '../Grid';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledModal, { ModalBody, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import { H4, P, Span } from '../Text';

const PAYOUT_ACTION_TYPE = defineMessages({
  manual: {
    id: 'Expense.PayManual',
    defaultMessage: '{payoutMethodLabel} (Manual)',
  },
  auto: {
    id: 'Expense.PayAuto',
    defaultMessage: '{payoutMethodLabel} (Automatic)',
  },
  schedule: {
    id: 'Expense.ScheduleForPayment',
    defaultMessage: '{payoutMethodLabel} (Schedule for Payout)',
  },
});

const getPayoutLabel = (intl, type) => {
  return i18nPayoutMethodType(intl.formatMessage, type, {
    aliasBankAccountToTransferWise: true,
  });
};

const generatePayoutOptions = (intl, payoutMethodType, collective) => {
  const payoutMethodLabel = getPayoutLabel(intl, payoutMethodType);
  if (payoutMethodType === PayoutMethodType.OTHER) {
    return [{ label: payoutMethodLabel, value: PayoutMethodType.OTHER }];
  } else {
    const defaultTypes = [
      {
        label: intl.formatMessage(PAYOUT_ACTION_TYPE.auto, { payoutMethodLabel }),
        value: { forceManual: false, action: 'PAY' },
      },
      {
        label: intl.formatMessage(PAYOUT_ACTION_TYPE.manual, { payoutMethodLabel }),
        value: { forceManual: true, action: 'PAY' },
      },
    ];
    if (
      hasFeature(collective.host, FEATURES.PAYPAL_PAYOUTS) &&
      payoutMethodType === PayoutMethodType.PAYPAL &&
      collective.host?.connectedAccounts?.find(ca => ca?.service === 'paypal')
    ) {
      defaultTypes.unshift({
        label: intl.formatMessage(PAYOUT_ACTION_TYPE.schedule, { payoutMethodLabel }),
        value: { action: 'SCHEDULE_FOR_PAYMENT' },
      });
    }
    return defaultTypes;
  }
};

const DEFAULT_VALUES = { paymentProcessorFee: null };

const validate = values => {
  const errors = {};
  if (isNaN(values.paymentProcessorFee)) {
    errors.paymentProcessorFee = createError(ERROR.FORM_FIELD_PATTERN);
  }
  return errors;
};

/**
 * Modal displayed by `PayExpenseButton` to trigger the actual payment of an expense
 */
const PayExpenseModal = ({ onClose, onSubmit, expense, collective, error }) => {
  const intl = useIntl();
  const payoutMethodType = expense.payoutMethod?.type || PayoutMethodType.OTHER;
  const payoutOptions = generatePayoutOptions(intl, payoutMethodType, collective);

  const formik = useFormik({ initialValues: { ...DEFAULT_VALUES, ...payoutOptions[0]?.value }, validate, onSubmit });
  const hasManualPayment = payoutMethodType === PayoutMethodType.OTHER || formik.values.forceManual;
  const selectedOption = payoutOptions.find(
    po => po.value?.action === formik.values.action && po.value.forceManual === formik.values.forceManual,
  );
  const payoutMethodLabel = getPayoutLabel(intl, payoutMethodType);
  const formattedAmount = isNaN(formik.values.paymentProcessorFee) ? (
    <Span color="black.500" mr={2}>
      --.--
    </Span>
  ) : (
    <FormattedMoneyAmount
      amount={expense.amount + (formik.values.paymentProcessorFee || 0)}
      currency={collective.currency}
      precision={CurrencyPrecision.DEFAULT}
    />
  );

  return (
    <StyledModal show onClose={onClose} width="100%" minWidth={280} maxWidth={334}>
      <ModalHeader />
      <ModalBody as="form" mb={0} onSubmit={formik.handleSubmit}>
        <H4 fontSize="20px" fontWeight="bold" mb={3}>
          <FormattedMessage id="Expense.PayoutAndFees" defaultMessage="Payout method and fees" />
        </H4>
        {formik.values.forceManual && (
          <P fontSize="13px" lineHeight="19px" mb={3}>
            <FormattedMessage
              id="Expense.PayoutAndFeesDetails"
              defaultMessage="Please add the corresponding fees according to the payout option selected."
            />
          </P>
        )}
        <StyledInputField
          htmlFor="payExpenseModalPayoutMethod"
          label={<FormattedMessage id="ExpenseForm.PayoutOptionLabel" defaultMessage="Payout method" />}
        >
          {({ id }) => (
            <StyledSelect
              inputId={id}
              disabled={payoutOptions.length < 2}
              options={payoutOptions}
              value={selectedOption}
              onChange={({ value }) => formik.setValues({ ...value, paymentProcessorFee: null })}
            />
          )}
        </StyledInputField>
        {hasManualPayment && (
          <StyledInputField
            name="paymentProcessorFee"
            htmlFor="payExpensePaymentProcessorFee"
            inputType="number"
            error={formik.errors.paymentProcessorFee}
            mt={24}
            label={
              <FormattedMessage id="PayExpense.ProcessorFeesInput" defaultMessage="Payment processor fees (if apply)" />
            }
          >
            {inputProps => (
              <StyledInputAmount
                {...inputProps}
                currency={collective.currency}
                value={formik.values.paymentProcessorFee}
                placeholder="0.00"
                min={0}
                max={100000000}
                onChange={value => formik.setFieldValue('paymentProcessorFee', value)}
              />
            )}
          </StyledInputField>
        )}
        <Container mt={24} mb={16} py={3} borderTop="1px solid #DCDEE0" borderBottom="1px solid #DCDEE0">
          {formik.values.paymentProcessorFee !== null ? (
            <FormattedMessage
              id="TotalAmountWithFees"
              defaultMessage="Total amount with fees: {amount}"
              values={{ amount: formattedAmount }}
            >
              {(label, amount) => (
                <Flex justifyContent="space-between" alignItems="center">
                  <Span fontSize="12px" ml={3}>
                    {label}
                  </Span>
                  <Span fontSize="16px">{amount}</Span>
                </Flex>
              )}
            </FormattedMessage>
          ) : (
            <FormattedMessage
              id="TotalAmountWithoutFees"
              defaultMessage="Total amount without fees: {amount}"
              values={{ amount: formattedAmount }}
            >
              {(label, amount) => (
                <Flex justifyContent="space-between" alignItems="center">
                  <Span fontSize="12px" ml={3}>
                    {label}
                  </Span>
                  <Span fontSize="16px">{amount}</Span>
                </Flex>
              )}
            </FormattedMessage>
          )}
        </Container>
        {error && (
          <MessageBox type="error" withIcon my={3}>
            {error}
          </MessageBox>
        )}
        {!error && formik.values.forceManual && (
          <MessageBox type="warning" withIcon my={3}>
            <FormattedMessage
              id="PayExpenseModal.ManualPayoutWarning"
              defaultMessage="Important: By clicking below you are acknowledging that you have already paid this expense via the {payoutMethod} dashboard directly."
              values={{ payoutMethod: payoutMethodLabel }}
            />
          </MessageBox>
        )}
        <Flex flexWrap="wrap" justifyContent="space-evenly">
          <StyledButton buttonStyle="success" minWidth={100} m={1} type="submit" loading={formik.isSubmitting}>
            {hasManualPayment ? (
              <FormattedMessage id="expense.markAsPaid" defaultMessage="Mark as paid" />
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
    payoutMethod: PropTypes.shape({
      type: PropTypes.oneOf(Object.values(PayoutMethodType)),
    }),
  }).isRequired,
  collective: PropTypes.shape({
    balance: PropTypes.number,
    currency: PropTypes.string,
    host: PropTypes.shape({
      plan: PropTypes.object,
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  /** Function called when users click on one of the "Pay" buttons */
  onSubmit: PropTypes.func.isRequired,
  /** If set, will be displayed in the pay modal */
  error: PropTypes.string,
};

export default PayExpenseModal;
