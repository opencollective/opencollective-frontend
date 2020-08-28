import React from 'react';
import PropTypes from 'prop-types';
import { ExclamationTriangle } from '@styled-icons/fa-solid/ExclamationTriangle';
import { Info } from '@styled-icons/feather/Info';
import { FormattedMessage } from 'react-intl';

import StyledTooltip from '../StyledTooltip';

const getPaypalExpiryInfo = paymentMethod => {
  const timeBeforeExpiry = new Date(paymentMethod.expiryDate) - new Date();
  const twoWeeks = 1000 * 60 * 60 * 24 * 14;
  if (timeBeforeExpiry <= 0) {
    return {
      icon: <ExclamationTriangle size={16} color="#E03F6A" />,
      message: (
        <FormattedMessage
          id="PaypalPreApproval.expired"
          defaultMessage="Your PayPal pre-approval has expired, please reconnect your account by clicking on {refillBalance}."
          values={{
            refillBalance: (
              <q>
                <FormattedMessage id="ConnectPaypal.refill" defaultMessage="Refill balance" />
              </q>
            ),
          }}
        />
      ),
    };
  } else if (timeBeforeExpiry < twoWeeks) {
    return {
      icon: <ExclamationTriangle size={16} color="#E0E01B" />,
      message: (
        <FormattedMessage
          id="PaypalPreApproval.expireSoon"
          defaultMessage="Your PayPal pre-approval will expire on {expiryDate, date, long}. Renew it by clicking on {refillBalance}."
          values={{
            expiryDate: new Date(paymentMethod.expiryDate),
            refillBalance: (
              <q>
                <FormattedMessage id="ConnectPaypal.refill" defaultMessage="Refill balance" />
              </q>
            ),
          }}
        />
      ),
    };
  } else {
    return {
      icon: <Info size={18} color="#76777A" />,
      message: (
        <FormattedMessage
          id="PaypalPreApproval.connected"
          defaultMessage="Paypal account {paypalEmail} connected on {createdAt, date, long}. The token will expire on {expiryDate, date, long}."
          values={{
            createdAt: new Date(paymentMethod.createdAt),
            expiryDate: new Date(paymentMethod.expiryDate),
            paypalEmail: <strong>{paymentMethod.name}</strong>,
          }}
        />
      ),
    };
  }
};

const PaypalPreApprovalDetailsIcon = ({ paymentMethod }) => {
  if (!paymentMethod) {
    return null;
  }

  const { message, icon } = getPaypalExpiryInfo(paymentMethod);
  return <StyledTooltip content={message}>{icon}</StyledTooltip>;
};

PaypalPreApprovalDetailsIcon.propTypes = {
  paymentMethod: PropTypes.shape({
    name: PropTypes.string,
    expiryDate: PropTypes.string,
    balance: PropTypes.shape({
      valueInCents: PropTypes.number,
      currency: PropTypes.string.isRequired,
    }).isRequired,
  }),
};

export default PaypalPreApprovalDetailsIcon;
