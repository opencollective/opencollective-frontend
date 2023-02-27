import React from 'react';
import PropTypes from 'prop-types';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Question } from '@styled-icons/octicons/Question';
import { defineMessage, FormattedMessage, useIntl } from 'react-intl';

import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from '../../lib/constants/payment-methods';

import { Box, Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import StyledCheckbox from '../StyledCheckbox';
import StyledTooltip from '../StyledTooltip';
import { P, Span } from '../Text';

import { STRIPE_PAYMENT_ELEMENT_KEY } from './utils';

const StripePaymentMethodTypesWithMandate = ['bancontact'];

const StripeSEPAMandateMessage = defineMessage({
  id: 'Stripe.SEPA.Mandate',
  defaultMessage:
    'By providing your payment information and confirming this payment, you authorise (A) OPENCOLLECTIVE INC and Stripe, our payment service provider and/or PPRO, its local service provider, to send instructions to your bank to debit your account and (B) your bank to debit your account in accordance with those instructions. As part of your rights, you are entitled to a refund from your bank under the terms and conditions of your agreement with your bank. A refund must be claimed within 8 weeks starting from the date on which your account was debited. Your rights are explained in a statement that you can obtain from your bank. You agree to receive notifications for future debits up to 2 days before they occur.',
});

function StripeMandate() {
  const intl = useIntl();
  return <P>{intl.formatMessage(StripeSEPAMandateMessage)}</P>;
}

export function PayWithStripeForm({
  defaultIsSaved,
  hasSaveCheckBox,
  bilingDetails,
  paymentIntentId,
  paymentIntentClientSecret,
  onChange,
  stepDetails,
}) {
  const [isSavedForLater, setIsSavedForLater] = React.useState(defaultIsSaved);
  const [stripePaymentMethodType, setStripePaymentMethodType] = React.useState();

  const elements = useElements();
  const stripe = useStripe();

  const onElementChange = React.useCallback(
    event => {
      onChange({
        stepPayment: {
          key: STRIPE_PAYMENT_ELEMENT_KEY,
          paymentMethod: {
            paymentIntentId,
            service: PAYMENT_METHOD_SERVICE.STRIPE,
            type: PAYMENT_METHOD_TYPE.PAYMENT_INTENT,
            isSavedForLater: defaultIsSaved,
          },
          isCompleted: event.complete,
          stripeData: {
            stripe,
            elements,
            paymentIntentClientSecret,
          },
        },
      });
      setStripePaymentMethodType(event?.value?.type);
    },
    [onChange],
  );

  const onSavePaymentMethodToggle = React.useCallback(({ checked }) => {
    onChange(({ stepPayment }) => ({
      stepPayment: {
        ...stepPayment,
        paymentMethod: {
          ...stepPayment.paymentMethod,
          isSavedForLater: checked,
        },
      },
    }));

    setIsSavedForLater(checked);
  });

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
        }}
        onChange={onElementChange}
      />

      {(stepDetails.interval || isSavedForLater) &&
        StripePaymentMethodTypesWithMandate.includes(stripePaymentMethodType) && (
          <Box mt={3} color="black.600" fontWeight="normal">
            <StripeMandate />
          </Box>
        )}
      {hasSaveCheckBox && (
        <Flex mt={3} alignItems="center" color="black.700">
          <StyledCheckbox
            defaultChecked={defaultIsSaved}
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
            <Question size="1.1em" />
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
  stepDetails: PropTypes.shape({
    interval: PropTypes.string,
  }),
};
