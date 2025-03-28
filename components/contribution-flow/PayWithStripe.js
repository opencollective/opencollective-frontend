import React from 'react';
import PropTypes from 'prop-types';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { HelpCircle } from 'lucide-react';
import { FormattedMessage } from 'react-intl';

import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from '../../lib/constants/payment-methods';

import { Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import StyledCheckbox from '../StyledCheckbox';
import StyledTooltip from '../StyledTooltip';
import { Span } from '../Text';

import { STRIPE_PAYMENT_ELEMENT_KEY } from './utils';

const STRIPE_REUSABLE_PAYMENT_METHODS_TYPES = [
  PAYMENT_METHOD_TYPE.US_BANK_ACCOUNT,
  PAYMENT_METHOD_TYPE.SEPA_DEBIT,
  PAYMENT_METHOD_TYPE.BACS_DEBIT,
  PAYMENT_METHOD_TYPE.BANCONTACT,
  'card', // PAYMENT_METHOD_TYPE.CREDITCARD,
];

function isReusableStripePaymentMethodType(type) {
  return STRIPE_REUSABLE_PAYMENT_METHODS_TYPES.map(pmType => pmType.toLowerCase()).includes(type);
}

export function PayWithStripeForm({
  defaultIsSaved,
  hasSaveCheckBox,
  bilingDetails,
  paymentIntentId,
  paymentIntentClientSecret,
  onChange,
}) {
  const elements = useElements();
  const stripe = useStripe();
  const [selectedPaymentMethodType, setSelectedPaymentMethodType] = React.useState('card');
  const [isSavePaymentMethod, setIsSavePaymentMethod] = React.useState(defaultIsSaved);
  const [hasFieldErrors, setHasFieldErrors] = React.useState(false);

  const onElementChange = React.useCallback(
    event => {
      setSelectedPaymentMethodType(event.value.type);
      // Track if there are validation errors in the fields
      const hasErrors = event.error || (event.value.type === 'bacs_debit' && !event.complete);
      setHasFieldErrors(hasErrors);
      
      onChange({
        stepPayment: {
          key: STRIPE_PAYMENT_ELEMENT_KEY,
          paymentMethod: {
            paymentIntentId,
            service: PAYMENT_METHOD_SERVICE.STRIPE,
            type: PAYMENT_METHOD_TYPE.PAYMENT_INTENT,
            isSavedForLater: isReusableStripePaymentMethodType(event.value.type) && isSavePaymentMethod,
          },
          isCompleted: event.complete,
          stripeData: {
            stripe,
            elements,
            paymentIntentClientSecret,
          },
        },
      });
    },
    [onChange],
  );

  const onSavePaymentMethodToggle = React.useCallback(
    ({ checked }) => {
      setIsSavePaymentMethod(checked);
      onChange(({ stepPayment }) => ({
        stepPayment: {
          ...stepPayment,
          paymentMethod: {
            ...stepPayment.paymentMethod,
            isSavedForLater: isReusableStripePaymentMethodType(selectedPaymentMethodType) && checked,
          },
        },
      }));
    },
    [selectedPaymentMethodType],
  );

  return (
    <React.Fragment>
      <PaymentElement
        options={{
          paymentMethodOrder: ['card', 'apple_pay', 'google_pay'],
          defaultValues: {
            billingDetails: {
              name: bilingDetails?.name,
              email: bilingDetails?.email,
            },
          },
          terms: {
            bancontact: 'always',
            card: 'always',
            ideal: 'always',
            sepaDebit: 'always',
            sofort: 'always',
            auBecsDebit: 'always',
            usBankAccount: 'always',
            applePay: 'always',
            cashapp: 'always',
            googlePay: 'always',
            paypal: 'always',
          },
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#3385ff',
              colorBackground: '#ffffff',
              colorText: '#30313d',
              colorDanger: '#df1b41',
              fontFamily: 'Inter, sans-serif',
            },
            rules: {
              // General field styling
              '.Input': {
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              },
              '.Input--empty': {
                borderColor: '#c0c4c9',
              },
              // Highlight incomplete/invalid fields with red border
              '.Input--invalid': {
                borderColor: 'var(--colorDanger)',
                boxShadow: '0 1px 3px 0 rgba(223, 27, 65, 0.2)',
              },
              // Add more visible focus state
              '.Input:focus': {
                borderColor: 'var(--colorPrimary)',
                boxShadow: '0 1px 3px 0 rgba(51, 133, 255, 0.3)',
              },
              // Keep error state visible when focused
              '.Input--invalid:focus': {
                borderColor: 'var(--colorDanger)',
                boxShadow: '0 1px 3px 0 rgba(223, 27, 65, 0.3)',
              },
              // Specific Bacs direct debit styling
              '.Label--bacs': {
                marginBottom: '4px',
              },
              // Style the checkbox 
              '.CheckboxInput': {
                borderWidth: '2px',
              },
              '.CheckboxInput--invalid': {
                borderColor: 'var(--colorDanger)',
                boxShadow: '0 1px 3px 0 rgba(223, 27, 65, 0.3)',
              },
              // Make the confirmation checkbox more noticeable for Bacs
              '.Label.Label--checkbox': {
                fontWeight: '500',
              },
              // Success state for completed fields
              '.Input--complete': {
                borderColor: '#09825d',
              },
            },
          },
        }}
        onChange={onElementChange}
      />
      
      {/* Show validation error message for Bacs direct debit */}
      {hasFieldErrors && selectedPaymentMethodType === 'bacs_debit' && (
        <Flex mt={2} color="red.500" fontSize="13px">
          <FormattedMessage
            id="PayWithStripe.BacsValidationError"
            defaultMessage="Please complete all required fields and check the confirmation checkbox."
          />
        </Flex>
      )}

      {hasSaveCheckBox && isReusableStripePaymentMethodType(selectedPaymentMethodType) && (
        <Flex mt={3} alignItems="center" color="black.700">
          <StyledCheckbox
            checked={isSavePaymentMethod}
            name="save"
            onChange={onSavePaymentMethodToggle}
            label={<FormattedMessage id="paymentMethod.save" defaultMessage="Remember this payment method" />}
          />
          &nbsp;&nbsp;
          <StyledTooltip
            content={() => (
              <Span fontWeight="normal">
                <FormattedMessage
                  id="ContributeFAQ.Safe"
                  defaultMessage="Open Collective doesn't store sensitive payment data (e.g. Credit Card numbers), instead relying on our payment processor, Stripe, a secure solution that is widely adopted. If our systems are compromised, your payment information is not at risk, because we simply don't store it. <LearnMoreLink>Learn more</LearnMoreLink>."
                  values={{
                    LearnMoreLink: getI18nLink({
                      openInNewTab: true,
                      href: 'https://docs.opencollective.com/help/product/security#payments-security',
                    }),
                  }}
                />
              </Span>
            )}
          >
            <HelpCircle size="1.1em" />
          </StyledTooltip>
        </Flex>
      )}
    </React.Fragment>
  );
}

PayWithStripeForm.propTypes = {
  paymentIntentId: PropTypes.string.isRequired,
  paymentIntentClientSecret: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  bilingDetails: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  defaultIsSaved: PropTypes.bool,
  hasSaveCheckBox: PropTypes.bool,
};
