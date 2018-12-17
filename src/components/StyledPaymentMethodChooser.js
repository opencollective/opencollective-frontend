import React from 'react';
import PropTypes from 'prop-types';

import StyledSelect from './StyledSelect';
import { paymentMethodLabelWithIcon } from '../lib/payment_method_label';
import withIntl from '../lib/withIntl';

const paymentMethodsToOptions = paymentMethods => {
  return paymentMethods.reduce((options, pm) => {
    return { ...options, [pm.id]: pm };
  }, {});
};

const StyledPaymentMethodChooser = ({ intl, paymentMethods, defaultPaymentMethod, ...props }) => {
  return (
    <StyledSelect
      name="paymentMethod"
      options={paymentMethodsToOptions(paymentMethods)}
      defaultValue={defaultPaymentMethod}
      {...props}
    >
      {({ value: pm }) => <div>{paymentMethodLabelWithIcon(intl, pm)}</div>}
    </StyledSelect>
  );
};

StyledPaymentMethodChooser.propTypes = {
  /** The payment methods to display. **Cannot be empty !** */
  paymentMethods: PropTypes.arrayOf(PropTypes.object).isRequired,
  /** The default payment method. Will use the first one if not provided. */
  defaultPaymentMethod: PropTypes.object,
  /** @ignore Provided by withIntl */
  intl: PropTypes.object,
};

export default withIntl(StyledPaymentMethodChooser);
