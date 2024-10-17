import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { FormattedMessage } from 'react-intl';

import {
  GQLV2_SUPPORTED_PAYMENT_METHOD_TYPES,
  PAYMENT_METHOD_SERVICE,
  PAYMENT_METHOD_TYPE,
} from '../../lib/constants/payment-methods';
import { getIntervalFromContributionFrequency } from '../../lib/date-utils';

import CreditCard from '../../components/icons/CreditCard';

import { Flex } from '../Grid';
import NewCreditCardForm from '../NewCreditCardForm';
import PayWithPaypalButton from '../PayWithPaypalButton';
import StyledButton from '../StyledButton';
import { useToast } from '../ui/useToast';

/** Return the next charge date, or `undefined` if subscription is past due */
export const getSubscriptionStartDate = order => {
  if (order.nextChargeDate && dayjs(order.nextChargeDate).isAfter(dayjs())) {
    return order.nextChargeDate;
  }
};

const STRIPE = 'stripe';

const AddPaymentMethod = ({ onStripeReady, onPaypalSuccess, setNewPaymentMethodInfo, order, isSubmitting }) => {
  const host = order.toAccount.host;
  const hasStripe = host.supportedPaymentMethods.includes(GQLV2_SUPPORTED_PAYMENT_METHOD_TYPES.CREDIT_CARD);
  const hasPaypal = host.supportedPaymentMethods.includes(GQLV2_SUPPORTED_PAYMENT_METHOD_TYPES.PAYPAL);
  const defaultProvider = hasStripe && !hasPaypal ? STRIPE : null;
  const [selectedProvider, setSelectedProvider] = React.useState(defaultProvider);
  const { toast } = useToast();

  if (!selectedProvider) {
    return (
      <Flex flexDirection="column">
        {hasStripe && (
          <StyledButton
            buttonSize="small"
            data-cy="add-pm-select-provider-credit-card-btn"
            onClick={() => setSelectedProvider(STRIPE)}
            mb={2}
          >
            <CreditCard size={24} />
            &nbsp;
            <FormattedMessage id="CreditCard" defaultMessage="Credit Card" />
          </StyledButton>
        )}
        <PayWithPaypalButton
          order={order}
          totalAmount={order.totalAmount.valueInCents}
          currency={order.totalAmount.currency}
          interval={getIntervalFromContributionFrequency(order.frequency)}
          host={host}
          collective={order.toAccount}
          tier={order.tier}
          style={{ height: 45, size: 'small' }}
          subscriptionStartDate={getSubscriptionStartDate(order)}
          isSubmitting={isSubmitting}
          onError={e => toast({ variant: 'error', title: e.message })}
          onSuccess={({ subscriptionId }) => {
            onPaypalSuccess({
              service: PAYMENT_METHOD_SERVICE.PAYPAL,
              type: PAYMENT_METHOD_TYPE.SUBSCRIPTION,
              paypalInfo: { subscriptionId },
            });
          }}
        />
      </Flex>
    );
  } else if (selectedProvider === STRIPE) {
    return (
      <NewCreditCardForm
        name="newCreditCardInfo"
        profileType={'USER'}
        onChange={setNewPaymentMethodInfo}
        onReady={onStripeReady}
        hasSaveCheckBox={false}
        isCompact
      />
    );
  }
};

AddPaymentMethod.propTypes = {
  setNewPaymentMethodInfo: PropTypes.func,
  onStripeReady: PropTypes.func,
  onPaypalSuccess: PropTypes.func,
  isSubmitting: PropTypes.bool,
  order: PropTypes.shape({
    totalAmount: PropTypes.object,
    frequency: PropTypes.string,
    toAccount: PropTypes.object,
    tier: PropTypes.object,
  }),
};

export default AddPaymentMethod;
