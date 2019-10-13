import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import StyledButton from '../StyledButton';

const CancelPendingOrderBtn = ({ orderId, onClickCancel }) => {
  return (
    <StyledButton bg="red.500" color="#fff" onClick={() => onClickCancel(orderId)}>
      <FormattedMessage id="order.pending.cancel" defaultMessage="Cancel" />
    </StyledButton>
  );
};

CancelPendingOrderBtn.propTypes = {
  orderId: PropTypes.number.isRequired,
  onClickCancel: PropTypes.func.isRequired,
};

export default CancelPendingOrderBtn;
