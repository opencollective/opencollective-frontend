import React, { Component } from 'react';
import { injectIntl } from 'react-intl';

import { paymentMethodLabelWithIcon } from '../lib/payment_method_label';

import StyledSelect from './StyledSelect';

class PaymentMethodSelect extends Component {
  paymentMethodValueAndLabel = (intl, paymentMethod) => {
    return {
      value: paymentMethod,
      label: paymentMethodLabelWithIcon(intl, paymentMethod),
    };
  };

  render() {
    const { intl, paymentMethods, defaultPaymentMethod, value, onChange, inputId, ...props } = this.props;

    const options = paymentMethods.map(paymentMethod => this.paymentMethodValueAndLabel(intl, paymentMethod));

    return (
      <StyledSelect
        inputId={inputId}
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
