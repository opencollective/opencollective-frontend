import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';

import { paymentMethodLabelWithIcon } from '../lib/payment_method_label';

import StyledSelect from './StyledSelect';

class PaymentMethodSelect extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    /** To control the component state */
    value: PropTypes.object,
    /** The payment methods to display. **Cannot be empty !** */
    paymentMethods: PropTypes.arrayOf(PropTypes.object).isRequired,
    /** The default payment method. Will use the first one if not provided. */
    defaultPaymentMethod: PropTypes.object,
    /** @ignore Provided by injectIntl */
    intl: PropTypes.object,
  };

  paymentMethodValueAndLabel = (intl, paymentMethod) => {
    return {
      value: paymentMethod,
      label: paymentMethodLabelWithIcon(intl, paymentMethod),
    };
  };

  render() {
    const { intl, paymentMethods, defaultPaymentMethod, value, onChange, ...props } = this.props;

    const options = paymentMethods.map(paymentMethod => this.paymentMethodValueAndLabel(intl, paymentMethod));

    return (
      <StyledSelect
        inputId="payment-method"
        name="paymentMethod"
        options={options}
        minWidth={300}
        onChange={({ value }) => onChange(value)}
        value={value ? this.paymentMethodValueAndLabel(intl, value) : undefined}
        defaultValue={defaultPaymentMethod ? this.paymentMethodValueAndLabel(intl, defaultPaymentMethod) : options[0]}
        {...props}
      />
    );
  }
}

export default injectIntl(PaymentMethodSelect);
