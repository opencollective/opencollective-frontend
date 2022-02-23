import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import { connectAccount } from '../../lib/api';
import { useAsyncCall } from '../../lib/hooks/useAsyncCall';

import MessageBox from '../MessageBox';
import StyledButton from '../StyledButton';

/**
 * A button for hosts to either connect or refill the balance for their PayPal account.
 */
const ConnectPaypalButton = ({ host, paymentMethod }) => {
  const { loading, error, call } = useAsyncCall(async () => {
    const urlParams = { redirect: window.location.href, useNewFlow: true };
    const json = await connectAccount(host.legacyId || host.id, 'paypal', urlParams);
    window.location.replace(json.redirectUrl);
    // Give some time (60s) for redirect
    return new Promise(resolve => setTimeout(resolve, 60000));
  });

  return (
    <React.Fragment>
      {error && (
        <MessageBox withIcon type="error" fontSize="10px" mb={2}>
          {error.message || 'Oops, something went wrong. Please try again.'}
        </MessageBox>
      )}
      <StyledButton
        buttonStyle="secondary"
        isBorderless
        buttonSize="tiny"
        fontSize="10px"
        fontWeight="normal"
        loading={loading}
        onClick={call}
        minWidth={85}
      >
        {paymentMethod ? (
          <FormattedMessage id="ConnectPaypal.refill" defaultMessage="Refill balance" />
        ) : (
          <FormattedMessage defaultMessage="Connect {service}" values={{ service: 'PayPal' }} />
        )}
      </StyledButton>
    </React.Fragment>
  );
};

ConnectPaypalButton.propTypes = {
  host: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    legacyId: PropTypes.number,
  }).isRequired,
  paymentMethod: PropTypes.shape({}),
};

export default ConnectPaypalButton;
