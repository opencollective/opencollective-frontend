import React from 'react';
import PropTypes from 'prop-types';
import { injectIntl, intlShape, defineMessages } from 'react-intl';
import moment from 'moment';
import { get } from 'lodash';
import { formatCurrency } from '../lib/utils';

/**
 * Generate a label for given payment method as a string.
 * Can safely be used for select options labels.
 */
class PaymentMethodLabel extends React.Component {
  static propTypes = {
    /** The payment method for which the label is generated */
    paymentMethod: PropTypes.shape({
      name: PropTypes.string.isRequired,
      balance: PropTypes.number.isRequired,
      type: PropTypes.string.isRequired,
      currency: PropTypes.string.isRequired,
    }).isRequired,
    /** Provided by injectIntl  */
    intl: intlShape.isRequired,
  };

  static messages = defineMessages({
    virtualcard: {
      id: 'paymentMethods.labelVirtualCard',
      defaultMessage: '{name} ({balance} left)',
      description: 'Label for gift cards',
    },
    creditcard: {
      id: 'paymentMethods.labelCreditCard',
      defaultMessage: '{name} {expiration}',
      description: 'Label for stripe credit cards',
    },
    prepaid: {
      id: 'paymentMethods.labelPrepaid',
      defaultMessage: '{name} ({balance} left)',
    },
  });

  paymentMethodExpiration = pm => {
    /* The expiryDate field will show up for prepaid cards */
    return pm.expiryDate
      ? `- exp ${moment(pm.expiryDate).format('MM/Y')}`
      : get(pm, 'data.expMonth') || get(pm, 'data.expYear')
        ? `- exp ${get(pm, 'data.expMonth')}/${get(pm, 'data.expYear')}`
        : '';
  };

  renderTranslatedString() {
    const { intl, paymentMethod } = this.props;
    const { type, balance, currency, name, data } = paymentMethod;

    if (type === 'virtualcard') {
      return intl.formatMessage(PaymentMethodLabel.messages.virtualcard, {
        name: name.replace('card from', 'Gift Card from'),
        balance: formatCurrency(balance, currency),
      });
    } else if (type === 'prepaid') {
      return intl.formatMessage(PaymentMethodLabel.messages.prepaid, {
        name: `${(data && data.brand) || type} ${name}`,
        balance: formatCurrency(balance, currency),
      });
    } else if (type === 'creditcard') {
      return intl.formatMessage(PaymentMethodLabel.messages.creditcard, {
        name: `${(data && data.brand) || type} ${name}`,
        expiration: this.paymentMethodExpiration(paymentMethod),
      });
    }

    return name;
  }

  getUnicodeIcon() {
    switch (this.props.paymentMethod.type) {
      case 'creditcard':
        return '💳';
      case 'virtualcard':
        return '🎁';
      case 'prepaid':
        return '🎟️';
      default:
        return '💰';
    }
  }

  render() {
    const icon = this.getUnicodeIcon();
    const label = this.renderTranslatedString();
    return `${icon}\xA0\xA0${label}`;
  }
}

export default injectIntl(PaymentMethodLabel);
