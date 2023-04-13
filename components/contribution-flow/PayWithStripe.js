import React from 'react';
import PropTypes from 'prop-types';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Question } from '@styled-icons/octicons/Question';
import { FormattedMessage } from 'react-intl';

import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from '../../lib/constants/payment-methods';

import { Flex } from '../Grid';
import { getI18nLink } from '../I18nFormatters';
import StyledCheckbox from '../StyledCheckbox';
import StyledTooltip from '../StyledTooltip';
import { Span } from '../Text';

import { STRIPE_PAYMENT_ELEMENT_KEY } from './utils';

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
          terms: {
            bancontact: 'always',
            card: 'always',
            ideal: 'always',
            sepaDebit: 'always',
            sofort: 'always',
            auBecsDebit: 'always',
            usBankAccount: 'always',
          },
        }}
        onChange={onElementChange}
      />

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
};
