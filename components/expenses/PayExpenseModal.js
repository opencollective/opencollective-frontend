import React from 'react';
import PropTypes from 'prop-types';
import { Check } from '@styled-icons/boxicons-regular/Check';
import { useFormik } from 'formik';
import { defineMessages, FormattedMessage, useIntl } from 'react-intl';
import styled from 'styled-components';
import { border, color, space, typography } from 'styled-system';

import { default as hasFeature, FEATURES } from '../../lib/allowed-features';
import { PayoutMethodType } from '../../lib/constants/payout-method';
import { createError, ERROR } from '../../lib/errors';
import i18nPayoutMethodType from '../../lib/i18n/payout-method-type';

import FormattedMoneyAmount from '../FormattedMoneyAmount';
import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import Link from '../Link';
import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';
import StyledInput from '../StyledInput';
import StyledInputAmount from '../StyledInputAmount';
import StyledInputField from '../StyledInputField';
import StyledLink from '../StyledLink';
import StyledModal, { ModalBody, ModalHeader } from '../StyledModal';
import StyledSelect from '../StyledSelect';
import { H4, P, Span } from '../Text';
import { withUser } from '../UserProvider';

const PAYOUT_ACTION_TYPE = defineMessages({
  manual: {
    id: 'Expense.PayManual',
    defaultMessage: '{payoutMethodLabel} (Manual)',
  },
  auto: {
    id: 'Expense.PayAuto',
    defaultMessage: '{payoutMethodLabel} (Automatic)',
  },
});

const getPayoutLabel = (intl, type) => {
  return i18nPayoutMethodType(intl, type, { aliasBankAccountToTransferWise: true });
};

const generatePayoutOptions = (intl, payoutMethodType, host) => {
  const payoutMethodLabel = getPayoutLabel(intl, payoutMethodType);
  if (payoutMethodType === PayoutMethodType.OTHER) {
    return [{ label: payoutMethodLabel, value: { forceManual: true, action: 'PAY' } }];
  } else {
    const automaticAction =
      hasFeature(host, FEATURES.PAYPAL_PAYOUTS) &&
      payoutMethodType === PayoutMethodType.PAYPAL &&
      host.supportedPayoutMethods?.includes('PAYPAL')
        ? 'SCHEDULE_FOR_PAYMENT'
        : 'PAY';

    return [
      {
        label: intl.formatMessage(PAYOUT_ACTION_TYPE.auto, { payoutMethodLabel }),
        value: { forceManual: false, action: automaticAction },
      },
      {
        label: intl.formatMessage(PAYOUT_ACTION_TYPE.manual, { payoutMethodLabel }),
        value: { forceManual: true, action: 'PAY' },
      },
    ];
  }
};

const DEFAULT_VALUES = { paymentProcessorFee: null, twoFactorAuthenticatorCode: null };

const validate = values => {
  const errors = {};
  if (isNaN(values.paymentProcessorFee)) {
    errors.paymentProcessorFee = createError(ERROR.FORM_FIELD_PATTERN);
  }
  return errors;
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

/**
 * Modal displayed by `PayExpenseButton` to trigger the actual payment of an expense
 */
const PayExpenseModal = ({ onClose, onSubmit, expense, collective, host, LoggedInUser, error, resetError }) => {
  const intl = useIntl();
  const payoutMethodType = expense.payoutMethod?.type || PayoutMethodType.OTHER;
  const payoutOptions = generatePayoutOptions(intl, payoutMethodType, host);

  const formik = useFormik({ initialValues: { ...DEFAULT_VALUES, ...payoutOptions[0]?.value }, validate, onSubmit });
  const hasManualPayment = payoutMethodType === PayoutMethodType.OTHER || formik.values.forceManual;
  const selectedOption = payoutOptions.find(
    po => po.value?.action === formik.values.action && po.value.forceManual === formik.values.forceManual,
  );
  const payoutMethodLabel = getPayoutLabel(intl, payoutMethodType);

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
              isSearchable={false}
              onChange={({ value }) => {
                formik.setValues({ ...value, paymentProcessorFee: null });
                if (resetError) {
                  resetError();
                }
              }}
            />
          )}
        </StyledInputField>
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
        <Box mt={19}>
          <P textTransform="uppercase" fontSize="9px" color="black.400" fontWeight="500" mb="5px">
            <FormattedMessage id="PaymentBreakdown" defaultMessage="Payment breakdown" />
          </P>
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
                amount={expense.amount + (formik.values.paymentProcessorFee || 0)}
                currency={expense.currency}
                currencyCodeStyles={{ color: 'black.400' }}
              />
            </Amount>
          </AmountLine>
        </Box>
        {error && (
          <MessageBox type="error" withIcon my={3}>
            {error}
            <br />
            {/** TODO: Add a proper ID/Type to detect this error */}
            {error.startsWith('Not enough funds in your existing Paypal preapproval') && (
              <StyledLink as={Link} route="host.dashboard" params={{ hostCollectiveSlug: host.slug }}>
                <FormattedMessage
                  id="PayExpenseModal.RefillBalanceError"
                  defaultMessage="Refill balance from dashboard"
                />
              </StyledLink>
            )}
            {error.startsWith('Host has two-factor authentication enabled for large payouts.') && (
              <FormattedMessage
                id="PayExpenseModal.HostTwoFactorAuthEnabled"
                defaultMessage="Please go to your <SettingsLink>account settings</SettingsLink> to enable two-factor authentication on your account."
                values={{
                  SettingsLink: getI18nLink({
                    as: Link,
                    route: 'editCollective',
                    params: { slug: LoggedInUser.collective.slug },
                  }),
                }}
              />
            )}
          </MessageBox>
        )}
        {error && error.startsWith('Two-factor authentication') && (
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
        {!error && formik.values.forceManual && (
          <MessageBox type="warning" withIcon my={3} fontSize="12px">
            <strong>
              <FormattedMessage id="Warning.Important" defaultMessage="Important" />
            </strong>
            <br />
            <P mt={2} fontSize="12px" lineHeight="18px">
              <FormattedMessage
                id="PayExpenseModal.ManualPayoutWarning"
                defaultMessage="By clicking below you are acknowledging that you have already paid this expense via the {payoutMethod} dashboard directly."
                values={{ payoutMethod: payoutMethodLabel }}
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
  }),
  onClose: PropTypes.func.isRequired,
  /** Function called when users click on one of the "Pay" buttons */
  onSubmit: PropTypes.func.isRequired,
  /** If set, will be displayed in the pay modal */
  error: PropTypes.string,
  resetError: PropTypes.func,
  /** From withUser */
  LoggedInUser: PropTypes.object,
};

export default withUser(PayExpenseModal);
