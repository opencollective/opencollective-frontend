import React from 'react';
import PropTypes from 'prop-types';
import { gql, useMutation } from '@apollo/client';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { pick } from 'lodash';

import { PAYMENT_METHOD_SERVICE, PAYMENT_METHOD_TYPE } from '../../lib/constants/payment-methods';
import { API_V2_CONTEXT } from '../../lib/graphql/helpers';
import { getStripe } from '../../lib/stripe';

import StyledSpinner from '../StyledSpinner';

import { STRIPE_PAYMENT_ELEMENT_KEY } from './utils';

function PayWithStripeForm({ paymentIntentId, paymentIntentClientSecret, onChange }) {
  const elements = useElements();
  const stripe = useStripe();

  const onElementChange = React.useCallback(
    event => {
      onChange({
        stepPayment: {
          key: STRIPE_PAYMENT_ELEMENT_KEY,
          paymentMethod: {
            service: PAYMENT_METHOD_SERVICE.STRIPE,
            type: PAYMENT_METHOD_TYPE.PAYMENT_INTENT,
            paymentIntentId,
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

const createPaymentIntentMutation = gql`
  mutation CreatePaymentIntent($paymentIntent: PaymentIntentInput!) {
    createPaymentIntent(paymentIntent: $paymentIntent) {
      id
      paymentIntentClientSecret
      stripeAccount
      stripeAccountPublishableSecret
    }
  }
`;

export default function PayWithStripe({ onChange, stepProfile, stepDetails, collective }) {
  let fromAccount;
  if (!stepProfile.isGuest) {
    fromAccount = typeof stepProfile.id === 'string' ? { id: stepProfile.id } : { legacyId: stepProfile.id };
  }

  const [createPaymentIntent, { data, loading }] = useMutation(createPaymentIntentMutation, {
    context: API_V2_CONTEXT,
    variables: {
      paymentIntent: {
        amount: { valueInCents: stepDetails.amount, currency: stepDetails.currency },
        fromAccount,
        toAccount: pick(collective, 'id'),
      },
    },
  });

  React.useEffect(() => {
    onChange({
      stepPayment: {
        key: STRIPE_PAYMENT_ELEMENT_KEY,
        paymentMethod: {
          service: PAYMENT_METHOD_SERVICE.STRIPE,
          type: PAYMENT_METHOD_TYPE.PAYMENT_INTENT,
        },
        isCompleted: false,
      },
    });
    async function callCreatePaymentIntent() {
      await createPaymentIntent();
    }

    callCreatePaymentIntent();
  }, []);

  const { id, paymentIntentClientSecret, stripeAccountPublishableSecret, stripeAccount } =
    data?.createPaymentIntent ?? {};

  const stripe = React.useMemo(() => {
    if (!stripeAccount) {
      return null;
    }

    return getStripe(stripeAccountPublishableSecret, stripeAccount);
  }, [stripeAccount]);

  if (loading || !data?.createPaymentIntent || !stripe) {
    return <StyledSpinner />;
  }

  const options = {
    clientSecret: paymentIntentClientSecret,
  };

  return (
    <Elements options={options} stripe={stripe}>
      <PayWithStripeForm
        paymentIntentId={id}
        paymentIntentClientSecret={paymentIntentClientSecret}
        onChange={onChange}
      />
    </Elements>
  );
}

PayWithStripe.propTypes = {
  onChange: PropTypes.func.isRequired,
  stepDetails: PropTypes.object,
  stepProfile: PropTypes.object,
  stepSummary: PropTypes.object,
  collective: PropTypes.object,
  tier: PropTypes.object,
  isEmbed: PropTypes.bool,
};
