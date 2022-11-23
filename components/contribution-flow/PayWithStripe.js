import React from 'react';
import PropTypes from 'prop-types';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';

import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from '../../lib/constants/payment-methods';

import { STRIPE_PAYMENT_ELEMENT_KEY } from './utils';

export function PayWithStripeForm({ paymentIntentId, paymentIntentClientSecret, onChange }) {
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
            isSavedForLater: false,
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

  return <PaymentElement onChange={onElementChange} />;
}

PayWithStripeForm.propTypes = {
  paymentIntentId: PropTypes.string.isRequired,
  paymentIntentClientSecret: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
